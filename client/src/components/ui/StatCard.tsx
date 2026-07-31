import type { ReactNode } from 'react';
import clsx from 'clsx';

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'critical' | 'good';
  icon?: ReactNode;
}) {
  return (
    <div className="panel p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-sentinel-muted">{label}</span>
        {icon && <span className="text-sentinel-muted">{icon}</span>}
      </div>
      <div
        className={clsx(
          'text-2xl font-semibold',
          tone === 'critical' && 'text-sentinel-critical',
          tone === 'good' && 'text-sentinel-accent2',
          tone === 'default' && 'text-sentinel-text'
        )}
      >
        {value}
      </div>
      {hint && <span className="text-xs text-sentinel-muted">{hint}</span>}
    </div>
  );
}
