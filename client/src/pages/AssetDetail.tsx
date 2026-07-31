import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge';
import type { Asset } from '../types';

export function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/assets/${id}`);
      setAsset(res.data.asset);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load asset'));
    }
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  if (!asset) return <p className="text-sentinel-muted text-sm">Loading asset…</p>;

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/assets" className="text-sm text-sentinel-accent hover:underline">← All assets</Link>

      <div className="panel p-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{asset.name}</h1>
          <p className="text-sentinel-muted text-sm mt-1">{asset.type.replace('_', ' ')} · {asset.location || 'Unknown location'}</p>
          <p className="text-xs text-sentinel-muted mt-1 font-mono">{asset.ipAddress || 'No IP recorded'}</p>
        </div>
        <div className="text-right">
          <StatusBadge status={asset.status} />
          <div className="text-2xl font-mono font-semibold mt-2 text-sentinel-critical">{asset.riskScore.toFixed(0)}</div>
          <div className="text-xs text-sentinel-muted">risk score</div>
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="font-medium mb-3">Recent alerts</h2>
        <div className="space-y-2">
          {(asset.alerts || []).map((alert) => (
            <div key={alert.id} className="flex items-center justify-between rounded-lg border border-sentinel-border px-3 py-2.5 text-sm">
              <div>
                <div className="font-medium">{alert.title}</div>
                <div className="text-xs text-sentinel-muted">{new Date(alert.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={alert.severity} />
                <StatusBadge status={alert.status} />
              </div>
            </div>
          ))}
          {(!asset.alerts || asset.alerts.length === 0) && <p className="text-sm text-sentinel-muted">No alerts for this asset.</p>}
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="font-medium mb-3">Recent events</h2>
        <table className="w-full text-sm">
          <thead className="text-sentinel-muted text-xs uppercase">
            <tr>
              <th className="text-left py-2">Type</th>
              <th className="text-left py-2">Source IP</th>
              <th className="text-left py-2">Risk</th>
              <th className="text-left py-2">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sentinel-border">
            {(asset.events || []).map((event) => (
              <tr key={event.id}>
                <td className="py-2">
                  {event.eventType}
                  {event.isAnomaly && <span className="badge bg-sentinel-medium/15 text-sentinel-medium ml-2">anomaly</span>}
                </td>
                <td className="py-2 font-mono text-sentinel-muted">{event.sourceIp || '—'}</td>
                <td className="py-2 font-mono">{event.riskScore.toFixed(0)}</td>
                <td className="py-2 text-sentinel-muted">{new Date(event.occurredAt).toLocaleString()}</td>
              </tr>
            ))}
            {(!asset.events || asset.events.length === 0) && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sentinel-muted">No events recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
