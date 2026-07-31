const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  organization: z.string().max(200).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const assetSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum([
    'SERVER',
    'WORKSTATION',
    'FIREWALL',
    'ROUTER',
    'DATABASE',
    'BRANCH_GATEWAY',
    'ATM',
    'CLOUD_SERVICE',
    'IOT_DEVICE',
  ]),
  ipAddress: z.string().max(64).optional(),
  location: z.string().max(200).optional(),
  ownerOrg: z.string().max(200).optional(),
  criticality: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
});

const eventSchema = z.object({
  externalId: z.string().max(200).optional(),
  assetId: z.string().uuid().optional(),
  sourceIp: z.string().max(64).optional(),
  eventType: z.string().min(1).max(100),
  payload: z.record(z.any()).optional(),
  occurredAt: z.string().datetime().optional(),
});

const eventBatchSchema = z.object({
  events: z.array(eventSchema).min(1).max(500),
});

const alertUpdateSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE']).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  incidentId: z.string().uuid().nullable().optional(),
});

const incidentCreateSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(5000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  alertIds: z.array(z.string().uuid()).optional(),
});

const incidentUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().min(1).max(5000).optional(),
  status: z.enum(['OPEN', 'CONTAINED', 'RESOLVED', 'CLOSED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

const incidentNoteSchema = z.object({
  body: z.string().min(1).max(5000),
});

const userUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER']).optional(),
  isActive: z.boolean().optional(),
});

const threatIntelSchema = z.object({
  indicator: z.string().min(1).max(300),
  type: z.enum(['ip', 'domain', 'hash', 'pattern']),
  reason: z.string().min(1).max(1000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  source: z.string().max(200).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  assetSchema,
  eventSchema,
  eventBatchSchema,
  alertUpdateSchema,
  incidentCreateSchema,
  incidentUpdateSchema,
  incidentNoteSchema,
  userUpdateSchema,
  threatIntelSchema,
};
