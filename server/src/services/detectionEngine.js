/**
 * Sentinel Africa detection engine.
 *
 * Two complementary layers, matching how real SIEM/XDR products work:
 *
 *  1. Signature rules   - deterministic, explainable pattern matches
 *     (brute force, port scanning, known-bad indicators, injection payloads).
 *  2. Anomaly scoring    - a lightweight statistical model (rolling
 *     mean/stddev -> z-score) that flags events which deviate from an
 *     asset's normal behaviour, catching things no signature covers.
 *
 * Both layers feed into a single 0-100 riskScore. Scores above
 * ALERT_THRESHOLD automatically open an Alert so analysts are never
 * relying on someone remembering to check a log.
 */

const prisma = require('../config/db');
const logger = require('../utils/logger');

const ALERT_THRESHOLD = 60;
const BRUTE_FORCE_WINDOW_MS = 5 * 60 * 1000;
const BRUTE_FORCE_THRESHOLD = 5;
const PORT_SCAN_WINDOW_MS = 60 * 1000;
const PORT_SCAN_THRESHOLD = 20;
const ANOMALY_WINDOW_SIZE = 50;
const ANOMALY_Z_SCORE_THRESHOLD = 3;

const INJECTION_PATTERNS = [
  /(\%27)|(')|(--)|(\%23)|(#)/i, // sql meta chars
  /((\%3D)|(=))[^\n]*((\%27)|(')|(--)|(\%3B)|(;))/i, // sql tautology-ish
  /<script[^>]*>/i, // xss
  /union(\s|\%20)+select/i,
  /select\s+.+\s+from\s+/i,
  /(\.\.\/){2,}/, // path traversal
];

function payloadStrings(payload) {
  if (!payload) return [];
  if (typeof payload === 'string') return [payload];
  try {
    return Object.values(payload).filter((v) => typeof v === 'string');
  } catch {
    return [];
  }
}

async function checkKnownBadIndicator(event) {
  const candidates = [event.sourceIp, ...payloadStrings(event.payload)].filter(Boolean);
  if (candidates.length === 0) return null;

  const hit = await prisma.threatIntel.findFirst({
    where: { indicator: { in: candidates } },
  });
  if (!hit) return null;

  return {
    ruleId: 'known-bad-indicator',
    score: hit.severity === 'CRITICAL' ? 95 : hit.severity === 'HIGH' ? 80 : 55,
    title: `Traffic matched known-bad indicator (${hit.type})`,
    description: `Event matched threat intelligence indicator "${hit.indicator}": ${hit.reason}`,
    severity: hit.severity,
  };
}

function checkInjectionPatterns(event) {
  const strings = payloadStrings(event.payload);
  for (const str of strings) {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(str)) {
        return {
          ruleId: 'injection-pattern',
          score: 85,
          title: 'Possible injection attack detected',
          description: `Payload matched a SQL injection / XSS / path traversal signature: "${str.slice(0, 200)}"`,
          severity: 'HIGH',
        };
      }
    }
  }
  return null;
}

async function checkBruteForce(event) {
  if (event.eventType !== 'auth.failed_login' || !event.sourceIp) return null;

  const since = new Date(event.occurredAt.getTime() - BRUTE_FORCE_WINDOW_MS);
  const count = await prisma.event.count({
    where: {
      eventType: 'auth.failed_login',
      sourceIp: event.sourceIp,
      occurredAt: { gte: since, lte: event.occurredAt },
    },
  });

  if (count >= BRUTE_FORCE_THRESHOLD) {
    return {
      ruleId: 'brute-force-login',
      score: Math.min(95, 55 + count * 3),
      title: 'Brute-force login attempt detected',
      description: `${count} failed login attempts from ${event.sourceIp} within ${BRUTE_FORCE_WINDOW_MS / 60000} minutes`,
      severity: count >= 15 ? 'CRITICAL' : 'HIGH',
    };
  }
  return null;
}

async function checkPortScan(event) {
  if (event.eventType !== 'network.connection' || !event.sourceIp) return null;
  const port = event.payload && (event.payload.destPort || event.payload.port);
  if (port === undefined) return null;

  const since = new Date(event.occurredAt.getTime() - PORT_SCAN_WINDOW_MS);
  const recent = await prisma.event.findMany({
    where: {
      eventType: 'network.connection',
      sourceIp: event.sourceIp,
      occurredAt: { gte: since, lte: event.occurredAt },
    },
    select: { payload: true },
    take: 500,
  });

  const distinctPorts = new Set(
    recent
      .map((e) => e.payload && (e.payload.destPort || e.payload.port))
      .filter((p) => p !== undefined)
  );
  distinctPorts.add(port);

  if (distinctPorts.size >= PORT_SCAN_THRESHOLD) {
    return {
      ruleId: 'port-scan',
      score: Math.min(90, 50 + distinctPorts.size),
      title: 'Port scan detected',
      description: `${event.sourceIp} probed ${distinctPorts.size} distinct ports within ${PORT_SCAN_WINDOW_MS / 1000}s`,
      severity: 'HIGH',
    };
  }
  return null;
}

/**
 * Statistical anomaly detection: compares this event's numeric magnitude
 * (bytes transferred, request rate, whatever the source provides under
 * payload.value) against the rolling mean/stddev for the same asset +
 * eventType. A z-score beyond the threshold marks the event as anomalous
 * even though no fixed rule fired.
 */
async function checkStatisticalAnomaly(event) {
  const value = event.payload && typeof event.payload.value === 'number' ? event.payload.value : null;
  if (value === null || !event.assetId) return null;

  const history = await prisma.event.findMany({
    where: {
      assetId: event.assetId,
      eventType: event.eventType,
      id: { not: event.id },
    },
    orderBy: { occurredAt: 'desc' },
    take: ANOMALY_WINDOW_SIZE,
    select: { payload: true },
  });

  const values = history
    .map((e) => e.payload && e.payload.value)
    .filter((v) => typeof v === 'number');

  if (values.length < 8) return null; // not enough history to model behaviour yet

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);
  if (stddev === 0) return null;

  const zScore = Math.abs((value - mean) / stddev);
  if (zScore >= ANOMALY_Z_SCORE_THRESHOLD) {
    return {
      ruleId: 'statistical-anomaly',
      score: Math.min(90, 40 + zScore * 8),
      title: 'Behavioural anomaly detected',
      description: `Value ${value} deviates ${zScore.toFixed(1)}σ from this asset's rolling baseline (mean ${mean.toFixed(1)}, n=${values.length})`,
      severity: zScore >= 5 ? 'HIGH' : 'MEDIUM',
      isAnomaly: true,
    };
  }
  return null;
}

/**
 * Evaluate a persisted Event through every detection layer, update its
 * riskScore/isAnomaly, and open an Alert (optionally attached to an
 * existing open Incident for the same asset) when the combined score
 * clears ALERT_THRESHOLD. Returns { event, alert } for callers that want
 * to push a websocket notification.
 */
async function evaluateEvent(event) {
  const findings = (
    await Promise.all([
      checkKnownBadIndicator(event),
      checkInjectionPatterns(event),
      checkBruteForce(event),
      checkPortScan(event),
      checkStatisticalAnomaly(event),
    ])
  ).filter(Boolean);

  const riskScore = findings.length === 0 ? 0 : Math.max(...findings.map((f) => f.score));
  const isAnomaly = findings.some((f) => f.isAnomaly);

  const updatedEvent = await prisma.event.update({
    where: { id: event.id },
    data: { riskScore, isAnomaly },
  });

  let alert = null;
  if (riskScore >= ALERT_THRESHOLD && findings.length > 0) {
    const top = findings.sort((a, b) => b.score - a.score)[0];
    alert = await prisma.alert.create({
      data: {
        title: top.title,
        description: findings.map((f) => f.description).join(' | '),
        severity: top.severity,
        ruleId: findings.map((f) => f.ruleId).join(','),
        riskScore,
        assetId: event.assetId,
        eventId: event.id,
      },
      include: { asset: true },
    });

    if (event.assetId) {
      await prisma.asset.update({
        where: { id: event.assetId },
        data: {
          riskScore,
          status: riskScore >= 85 ? 'COMPROMISED' : 'AT_RISK',
        },
      });
    }

    logger.warn('Alert generated by detection engine', {
      alertId: alert.id,
      rules: top.ruleId,
      riskScore,
    });
  }

  return { event: updatedEvent, alert, findings };
}

module.exports = {
  evaluateEvent,
  ALERT_THRESHOLD,
};
