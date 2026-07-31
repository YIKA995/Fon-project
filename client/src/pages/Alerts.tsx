import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import type { Alert, AlertStatus, Severity } from '../types';

const STATUS_OPTIONS: AlertStatus[] = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'];
const SEVERITY_OPTIONS: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [selected, setSelected] = useState<Alert | null>(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts', {
        params: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(severityFilter ? { severity: severityFilter } : {}),
        },
      });
      setAlerts(res.data.alerts);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load alerts'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(alert: Alert, status: AlertStatus) {
    try {
      const res = await api.patch(`/alerts/${alert.id}`, { status });
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? res.data.alert : a)));
      setSelected(res.data.alert);
      toast.success(`Alert marked ${status.replace('_', ' ').toLowerCase()}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update alert'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select className="input !w-auto" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">All severities</option>
          {SEVERITY_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="input !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <span className="text-xs text-sentinel-muted ml-auto">{alerts.length} alerts</span>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sentinel-panelAlt text-sentinel-muted text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Alert</th>
              <th className="text-left px-4 py-3 font-medium">Asset</th>
              <th className="text-left px-4 py-3 font-medium">Severity</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Risk</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sentinel-border">
            {!loading && alerts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sentinel-muted">
                  No alerts match these filters.
                </td>
              </tr>
            )}
            {alerts.map((alert) => (
              <tr
                key={alert.id}
                onClick={() => setSelected(alert)}
                className="cursor-pointer hover:bg-sentinel-panelAlt/60 transition"
              >
                <td className="px-4 py-3 max-w-md">
                  <div className="font-medium truncate">{alert.title}</div>
                  <div className="text-xs text-sentinel-muted truncate">{alert.ruleId}</div>
                </td>
                <td className="px-4 py-3 text-sentinel-muted">{alert.asset?.name || '—'}</td>
                <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
                <td className="px-4 py-3"><StatusBadge status={alert.status} /></td>
                <td className="px-4 py-3 font-mono">{alert.riskScore.toFixed(0)}</td>
                <td className="px-4 py-3 text-sentinel-muted whitespace-nowrap">
                  {new Date(alert.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md h-full bg-sentinel-panel border-l border-sentinel-border p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <SeverityBadge severity={selected.severity} />
                <h2 className="text-lg font-semibold mt-2">{selected.title}</h2>
              </div>
              <button className="text-sentinel-muted hover:text-sentinel-text" onClick={() => setSelected(null)}>✕</button>
            </div>

            <p className="text-sm text-sentinel-muted mb-6">{selected.description}</p>

            <dl className="space-y-3 text-sm mb-6">
              <div className="flex justify-between">
                <dt className="text-sentinel-muted">Status</dt>
                <dd><StatusBadge status={selected.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sentinel-muted">Risk score</dt>
                <dd className="font-mono">{selected.riskScore.toFixed(0)} / 100</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sentinel-muted">Rule(s)</dt>
                <dd className="font-mono text-xs text-right">{selected.ruleId || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sentinel-muted">Asset</dt>
                <dd>{selected.asset?.name || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sentinel-muted">Assigned to</dt>
                <dd>{selected.assignedTo?.name || 'Unassigned'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sentinel-muted">Created</dt>
                <dd>{new Date(selected.createdAt).toLocaleString()}</dd>
              </div>
            </dl>

            {canManage && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-sentinel-muted">Update status</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      className="btn-secondary !py-1.5 !text-xs"
                      disabled={selected.status === status}
                      onClick={() => updateStatus(selected, status)}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
