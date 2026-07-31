/* eslint-disable no-console */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Sentinel@2026';

async function main() {
  console.log('Seeding Sentinel Africa demo data...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const [admin, analyst, viewer] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@sentinelafrica.io' },
      update: {},
      create: {
        name: 'Ada Obi',
        email: 'admin@sentinelafrica.io',
        passwordHash,
        role: 'ADMIN',
        organization: 'Sentinel Africa',
      },
    }),
    prisma.user.upsert({
      where: { email: 'analyst@sentinelafrica.io' },
      update: {},
      create: {
        name: 'Kwame Boateng',
        email: 'analyst@sentinelafrica.io',
        passwordHash,
        role: 'ANALYST',
        organization: 'Sentinel Africa',
      },
    }),
    prisma.user.upsert({
      where: { email: 'viewer@sentinelafrica.io' },
      update: {},
      create: {
        name: 'Fatima Diallo',
        email: 'viewer@sentinelafrica.io',
        passwordHash,
        role: 'VIEWER',
        organization: 'Partner Bank Plc',
      },
    }),
  ]);

  const assetDefs = [
    { name: 'Core Banking Server - Lagos DC', type: 'DATABASE', ipAddress: '10.10.1.5', location: 'Lagos, NG', ownerOrg: 'Partner Bank Plc', criticality: 5 },
    { name: 'Perimeter Firewall - Nairobi HQ', type: 'FIREWALL', ipAddress: '10.20.0.1', location: 'Nairobi, KE', ownerOrg: 'Partner Bank Plc', criticality: 5 },
    { name: 'Branch Gateway - Accra Central', type: 'BRANCH_GATEWAY', ipAddress: '10.30.4.2', location: 'Accra, GH', ownerOrg: 'Partner Bank Plc', criticality: 4 },
    { name: 'ATM Cluster - Kampala Road', type: 'ATM', ipAddress: '10.40.7.14', location: 'Kampala, UG', ownerOrg: 'Partner Bank Plc', criticality: 4 },
    { name: 'Employee Workstation - Finance', type: 'WORKSTATION', ipAddress: '10.10.9.44', location: 'Lagos, NG', ownerOrg: 'Partner Bank Plc', criticality: 2 },
    { name: 'Cloud API Gateway', type: 'CLOUD_SERVICE', ipAddress: '10.50.0.9', location: 'AWS af-south-1', ownerOrg: 'Partner Bank Plc', criticality: 4 },
    { name: 'Core Router - Johannesburg', type: 'ROUTER', ipAddress: '10.60.1.1', location: 'Johannesburg, ZA', ownerOrg: 'Partner Bank Plc', criticality: 3 },
    { name: 'Branch IoT Sensor Hub', type: 'IOT_DEVICE', ipAddress: '10.70.2.3', location: 'Kigali, RW', ownerOrg: 'Partner Bank Plc', criticality: 2 },
  ];

  const assets = [];
  for (const def of assetDefs) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await prisma.asset.findFirst({ where: { name: def.name } });
    // eslint-disable-next-line no-await-in-loop
    const asset = existing || (await prisma.asset.create({ data: def }));
    assets.push(asset);
  }

  const threatIntelDefs = [
    { indicator: '185.220.101.7', type: 'ip', reason: 'Known Tor exit node used in prior credential-stuffing campaigns', severity: 'HIGH' },
    { indicator: '45.155.204.20', type: 'ip', reason: 'Associated with banking trojan C2 infrastructure', severity: 'CRITICAL' },
    { indicator: 'evil-payload.example', type: 'domain', reason: 'Phishing domain impersonating regional bank portal', severity: 'HIGH' },
  ];
  for (const def of threatIntelDefs) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.threatIntel.upsert({
      where: { indicator: def.indicator },
      update: {},
      create: def,
    });
  }

  const coreDb = assets[0];
  const firewall = assets[1];

  // Six failed logins from a flagged IP against the core banking server -> should trip brute force + known-bad rules.
  const attackerIp = '45.155.204.20';
  for (let i = 0; i < 6; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.event.create({
      data: {
        assetId: coreDb.id,
        sourceIp: attackerIp,
        eventType: 'auth.failed_login',
        payload: { username: 'svc_admin', attempt: i + 1 },
        riskScore: 0,
        occurredAt: new Date(Date.now() - (6 - i) * 30 * 1000),
      },
    });
  }

  const alert = await prisma.alert.create({
    data: {
      title: 'Brute-force login attempt detected',
      description: `6 failed login attempts from ${attackerIp} within 5 minutes | Traffic matched known-bad indicator (ip): Associated with banking trojan C2 infrastructure`,
      severity: 'CRITICAL',
      ruleId: 'brute-force-login,known-bad-indicator',
      riskScore: 95,
      assetId: coreDb.id,
      assignedToId: analyst.id,
      status: 'INVESTIGATING',
    },
  });

  await prisma.asset.update({ where: { id: coreDb.id }, data: { riskScore: 95, status: 'COMPROMISED' } });

  const incident = await prisma.incident.create({
    data: {
      title: 'Suspected credential-stuffing attack on core banking server',
      summary: 'Multiple failed authentication attempts from an IP flagged in threat intelligence as banking-trojan C2 infrastructure. Investigating scope of exposure and whether any accounts were compromised.',
      severity: 'CRITICAL',
      status: 'OPEN',
      createdById: admin.id,
      alerts: { connect: [{ id: alert.id }] },
    },
  });

  await prisma.incidentNote.create({
    data: {
      incidentId: incident.id,
      authorId: analyst.id,
      body: 'Blocked source IP at perimeter firewall pending full investigation. No successful logins observed yet.',
    },
  });

  await prisma.asset.update({ where: { id: firewall.id }, data: { riskScore: 20, status: 'AT_RISK' } });

  console.log('Seed complete.');
  console.log('Demo accounts (password for all: %s)', DEMO_PASSWORD);
  console.log('  Admin:   admin@sentinelafrica.io');
  console.log('  Analyst: analyst@sentinelafrica.io');
  console.log('  Viewer:  viewer@sentinelafrica.io');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
