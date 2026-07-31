import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import type { Incident, Severity } from '../types';

export function Incidents() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  const load = useCallback(async () => {
    try {
      const res = await api.get('/incidents');
      setIncidents(res.data.incidents);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load incidents'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/incidents', { title, summary, severity });
      toast.success('Incident created');
      setShowCreate(false);
      setTitle('');
      setSummary('');
      setSeverity('MEDIUM');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to create incident'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-sentinel-muted">{incidents.length} incidents</span>
        {canManage && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + New incident
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {incidents.length === 0 && <p className="text-sm text-sentinel-muted">No incidents recorded.</p>}
        {incidents.map((incident) => (
          <Link
            key={incident.id}
            to={`/incidents/${incident.id}`}
            className="panel p-4 flex items-center justify-between hover:border-sentinel-accent/50 transition"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={incident.status} />
              </div>
              <div className="font-medium">{incident.title}</div>
              <div className="text-xs text-sentinel-muted mt-0.5">
                {incident.alerts?.length || 0} linked alerts · opened {new Date(incident.createdAt).toLocaleDateString()}
                {incident.createdBy ? ` by ${incident.createdBy.name}` : ''}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <form className="panel p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <h2 className="text-lg font-semibold">New incident</h2>
            <div>
              <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Title</label>
              <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Summary</label>
              <textarea required className="input min-h-24" value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Severity</label>
              <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Creating…' : 'Create incident'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
