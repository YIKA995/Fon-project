import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import type { Incident, IncidentStatus } from '../types';

const STATUS_OPTIONS: IncidentStatus[] = ['OPEN', 'CONTAINED', 'RESOLVED', 'CLOSED'];

export function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [note, setNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/incidents/${id}`);
      setIncident(res.data.incident);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load incident'));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(status: IncidentStatus) {
    if (!id) return;
    try {
      const res = await api.patch(`/incidents/${id}`, { status });
      setIncident(res.data.incident);
      toast.success(`Incident marked ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update incident'));
    }
  }

  async function addNote(e: FormEvent) {
    e.preventDefault();
    if (!id || !note.trim()) return;
    setSubmittingNote(true);
    try {
      await api.post(`/incidents/${id}/notes`, { body: note });
      setNote('');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to add note'));
    } finally {
      setSubmittingNote(false);
    }
  }

  if (!incident) return <p className="text-sentinel-muted text-sm">Loading incident…</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/incidents" className="text-sm text-sentinel-accent hover:underline">← All incidents</Link>

      <div className="panel p-6">
        <div className="flex items-center gap-2 mb-3">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
        </div>
        <h1 className="text-xl font-semibold mb-2">{incident.title}</h1>
        <p className="text-sentinel-muted text-sm mb-4">{incident.summary}</p>
        <p className="text-xs text-sentinel-muted">
          Opened {new Date(incident.createdAt).toLocaleString()}
          {incident.createdBy ? ` by ${incident.createdBy.name}` : ''}
        </p>

        {canManage && (
          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                className="btn-secondary !py-1.5 !text-xs"
                disabled={incident.status === status}
                onClick={() => updateStatus(status)}
              >
                Mark {status.toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="panel p-6">
        <h2 className="font-medium mb-3">Linked alerts ({incident.alerts?.length || 0})</h2>
        <div className="space-y-2">
          {(incident.alerts || []).map((alert) => (
            <div key={alert.id} className="flex items-center justify-between rounded-lg border border-sentinel-border px-3 py-2.5 text-sm">
              <div>
                <div className="font-medium">{alert.title}</div>
                <div className="text-xs text-sentinel-muted">{alert.asset?.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={alert.severity} />
                <StatusBadge status={alert.status} />
              </div>
            </div>
          ))}
          {(!incident.alerts || incident.alerts.length === 0) && (
            <p className="text-sm text-sentinel-muted">No alerts linked yet.</p>
          )}
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="font-medium mb-3">Investigation notes</h2>
        <div className="space-y-3 mb-4">
          {(incident.notes || []).map((n) => (
            <div key={n.id} className="text-sm border-l-2 border-sentinel-accent/40 pl-3">
              <p>{n.body}</p>
              <p className="text-xs text-sentinel-muted mt-1">
                {n.author?.name || 'System'} · {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {(!incident.notes || incident.notes.length === 0) && (
            <p className="text-sm text-sentinel-muted">No notes yet.</p>
          )}
        </div>

        {canManage && (
          <form onSubmit={addNote} className="flex gap-2">
            <input
              className="input"
              placeholder="Add an investigation note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button type="submit" disabled={submittingNote} className="btn-primary shrink-0">
              Add
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
