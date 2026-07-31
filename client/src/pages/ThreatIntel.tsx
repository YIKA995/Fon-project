import { useCallback, useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { SeverityBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import type { Severity, ThreatIntelIndicator } from '../types';

export function ThreatIntel() {
  const { user } = useAuth();
  const [indicators, setIndicators] = useState<ThreatIntelIndicator[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ indicator: '', type: 'ip', reason: '', severity: 'HIGH' as Severity });

  const canManage = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  const load = useCallback(async () => {
    try {
      const res = await api.get('/threat-intel');
      setIndicators(res.data.indicators);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load threat intelligence'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/threat-intel', form);
      toast.success('Indicator added');
      setShowCreate(false);
      setForm({ indicator: '', type: 'ip', reason: '', severity: 'HIGH' });
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to add indicator'));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    try {
      await api.delete(`/threat-intel/${id}`);
      setIndicators((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to remove indicator'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-sentinel-muted max-w-2xl">
          Known-bad IPs, domains and hashes. Any event whose source IP or payload matches an indicator here is
          automatically scored and escalated to an alert by the detection engine.
        </p>
        {canManage && (
          <button className="btn-primary shrink-0" onClick={() => setShowCreate(true)}>
            + Add indicator
          </button>
        )}
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sentinel-panelAlt text-sentinel-muted text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Indicator</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Reason</th>
              <th className="text-left px-4 py-3 font-medium">Severity</th>
              <th className="text-left px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sentinel-border">
            {indicators.map((ind) => (
              <tr key={ind.id}>
                <td className="px-4 py-3 font-mono">{ind.indicator}</td>
                <td className="px-4 py-3 text-sentinel-muted">{ind.type}</td>
                <td className="px-4 py-3 text-sentinel-muted max-w-sm truncate">{ind.reason}</td>
                <td className="px-4 py-3"><SeverityBadge severity={ind.severity} /></td>
                <td className="px-4 py-3 text-right">
                  {canManage && (
                    <button className="text-sentinel-muted hover:text-sentinel-critical text-xs" onClick={() => remove(ind.id)}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {indicators.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sentinel-muted">No indicators yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <form className="panel p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <h2 className="text-lg font-semibold">Add threat indicator</h2>
            <div>
              <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Indicator (IP / domain / hash)</label>
              <input required className="input" value={form.indicator} onChange={(e) => setForm({ ...form, indicator: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="ip">IP address</option>
                <option value="domain">Domain</option>
                <option value="hash">File hash</option>
                <option value="pattern">Pattern</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Reason</label>
              <input required className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Severity</label>
              <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}>
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Adding…' : 'Add indicator'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
