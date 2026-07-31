import clsx from 'clsx';
import type { Severity } from '../../types';

const severityStyles: Record<Severity, string> = {
  CRITICAL: 'bg-sentinel-critical/15 text-sentinel-critical ring-1 ring-inset ring-sentinel-critical/30',
  HIGH: 'bg-sentinel-high/15 text-sentinel-high ring-1 ring-inset ring-sentinel-high/30',
  MEDIUM: 'bg-sentinel-medium/15 text-sentinel-medium ring-1 ring-inset ring-sentinel-medium/30',
  LOW: 'bg-sentinel-low/15 text-sentinel-low ring-1 ring-inset ring-sentinel-low/30',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={clsx('badge', severityStyles[severity])}>{severity}</span>;
}

const genericStyles: Record<string, string> = {
  OPEN: 'bg-sentinel-critical/15 text-sentinel-critical ring-1 ring-inset ring-sentinel-critical/30',
  INVESTIGATING: 'bg-sentinel-medium/15 text-sentinel-medium ring-1 ring-inset ring-sentinel-medium/30',
  CONTAINED: 'bg-sentinel-medium/15 text-sentinel-medium ring-1 ring-inset ring-sentinel-medium/30',
  RESOLVED: 'bg-sentinel-accent2/15 text-sentinel-accent2 ring-1 ring-inset ring-sentinel-accent2/30',
  CLOSED: 'bg-sentinel-muted/15 text-sentinel-muted ring-1 ring-inset ring-sentinel-muted/30',
  FALSE_POSITIVE: 'bg-sentinel-muted/15 text-sentinel-muted ring-1 ring-inset ring-sentinel-muted/30',
  HEALTHY: 'bg-sentinel-accent2/15 text-sentinel-accent2 ring-1 ring-inset ring-sentinel-accent2/30',
  AT_RISK: 'bg-sentinel-medium/15 text-sentinel-medium ring-1 ring-inset ring-sentinel-medium/30',
  COMPROMISED: 'bg-sentinel-critical/15 text-sentinel-critical ring-1 ring-inset ring-sentinel-critical/30',
  OFFLINE: 'bg-sentinel-muted/15 text-sentinel-muted ring-1 ring-inset ring-sentinel-muted/30',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={clsx('badge', genericStyles[status] || 'bg-sentinel-muted/15 text-sentinel-muted')}>{status.replace('_', ' ')}</span>;
}
