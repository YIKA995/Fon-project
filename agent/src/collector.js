const { v4: uuidv4 } = require('uuid');

/**
 * Stand-in telemetry source.
 *
 * A production deployment would hook this up to real signals (auditd,
 * netflow/sflow export, EDR agent, firewall syslog, etc). For this
 * reference build it synthesizes realistic security events - mostly
 * benign traffic with an occasional suspicious burst - so the full
 * pipeline (collect -> buffer -> sync -> detect -> alert) can be
 * exercised end-to-end without external infrastructure.
 */

const KNOWN_BAD_IPS = ['45.155.204.20', '185.220.101.7'];
const BENIGN_IPS = ['41.203.72.10', '196.216.2.5', '102.68.79.14', '154.66.196.22'];
const INJECTION_SAMPLES = [
  "' OR '1'='1",
  "<script>document.location='http://evil.example'</script>",
  'admin\' --',
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function nextEvent(assetId) {
  const roll = Math.random();

  if (roll < 0.05) {
    // Simulated brute-force burst against this asset.
    return {
      externalId: uuidv4(),
      assetId,
      sourceIp: randomFrom(KNOWN_BAD_IPS),
      eventType: 'auth.failed_login',
      payload: { username: 'svc_admin', attempt: Math.ceil(Math.random() * 10) },
      occurredAt: new Date().toISOString(),
    };
  }

  if (roll < 0.08) {
    // Simulated injection attempt against a web-facing service.
    return {
      externalId: uuidv4(),
      assetId,
      sourceIp: randomFrom([...KNOWN_BAD_IPS, ...BENIGN_IPS]),
      eventType: 'http.request',
      payload: { path: '/api/accounts', query: randomFrom(INJECTION_SAMPLES) },
      occurredAt: new Date().toISOString(),
    };
  }

  if (roll < 0.12) {
    // Simulated port sweep.
    return {
      externalId: uuidv4(),
      assetId,
      sourceIp: randomFrom(KNOWN_BAD_IPS),
      eventType: 'network.connection',
      payload: { destPort: 1024 + Math.floor(Math.random() * 40000), protocol: 'tcp' },
      occurredAt: new Date().toISOString(),
    };
  }

  // Normal background traffic with a numeric "value" (e.g. bytes
  // transferred) so the anomaly-scoring model has a baseline to learn.
  return {
    externalId: uuidv4(),
    assetId,
    sourceIp: randomFrom(BENIGN_IPS),
    eventType: 'network.connection',
    payload: {
      destPort: randomFrom([443, 22, 3306, 8443]),
      protocol: 'tcp',
      value: Math.round(800 + Math.random() * 200),
    },
    occurredAt: new Date().toISOString(),
  };
}

module.exports = { nextEvent };
