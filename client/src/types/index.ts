export type Role = 'ADMIN' | 'ANALYST' | 'VIEWER';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
export type IncidentStatus = 'OPEN' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
export type AssetStatus = 'HEALTHY' | 'AT_RISK' | 'COMPROMISED' | 'OFFLINE';
export type AssetType =
  | 'SERVER'
  | 'WORKSTATION'
  | 'FIREWALL'
  | 'ROUTER'
  | 'DATABASE'
  | 'BRANCH_GATEWAY'
  | 'ATM'
  | 'CLOUD_SERVICE'
  | 'IOT_DEVICE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  ipAddress?: string | null;
  location?: string | null;
  ownerOrg?: string | null;
  criticality: number;
  riskScore: number;
  status: AssetStatus;
  tags: string[];
  createdAt: string;
  events?: SentinelEvent[];
  alerts?: Alert[];
}

export interface SentinelEvent {
  id: string;
  externalId?: string | null;
  assetId?: string | null;
  asset?: { id: string; name: string } | null;
  sourceIp?: string | null;
  eventType: string;
  payload?: Record<string, unknown> | null;
  riskScore: number;
  isAnomaly: boolean;
  ingestedVia: string;
  occurredAt: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  ruleId?: string | null;
  riskScore: number;
  assetId?: string | null;
  asset?: Asset | null;
  eventId?: string | null;
  event?: SentinelEvent | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  incidentId?: string | null;
  incident?: Incident | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface IncidentNote {
  id: string;
  incidentId: string;
  authorId?: string | null;
  author?: { id: string; name: string } | null;
  body: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  title: string;
  summary: string;
  status: IncidentStatus;
  severity: Severity;
  createdById?: string | null;
  createdBy?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  alerts?: Alert[];
  notes?: IncidentNote[];
}

export interface AuditLogEntry {
  id: string;
  userId?: string | null;
  user?: { id: string; name: string; email: string } | null;
  action: string;
  target?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  message: string;
  severity: Severity;
  read: boolean;
  createdAt: string;
}

export interface ThreatIntelIndicator {
  id: string;
  indicator: string;
  type: string;
  reason: string;
  severity: Severity;
  source: string;
  createdAt: string;
}

export interface DashboardSummary {
  assets: { total: number; atRisk: number; compromised: number };
  alerts: { open: number; critical: number; last24h: number };
  incidents: { open: number };
  events: { last24h: number };
  severityBreakdown: { severity: Severity; count: number }[];
  topAssets: Pick<Asset, 'id' | 'name' | 'type' | 'riskScore' | 'status'>[];
  alertsTrend: { bucket: string; count: number }[];
}
