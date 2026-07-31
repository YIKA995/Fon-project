import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import type { Asset, AssetType } from '../types';

const ASSET_TYPES: AssetType[] = [
  'SERVER',
  'WORKSTATION',
  'FIREWALL',
  'ROUTER',
  'DATABASE',
  'BRANCH_GATEWAY',
  'ATM',
  'CLOUD_SERVICE',
  'IOT_DEVICE',
];

export function Assets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'SERVER' as AssetType, ipAddress: '', location: '', criticality: 3 });

  const canManage = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  const load = useCallback(async () => {
    try {
      const res = await api.get('/assets');
      setAssets(res.data.assets);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load assets'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/assets', form);
      toast.success('Asset added');
      setShowCreate(false);
      setForm({ name: '', type: 'SERVER', ipAddress: '', location: '', criticality: 3 });
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to add asset'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-sentinel-muted">{assets.length} monitored assets</span>
        {canManage && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + Add asset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <Link key={asset.id} to={`/assets/${asset.id}`} className="panel p-4 hover:border-sentinel-accent/50 transition">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium">{asset.name}</div>
                <div className="text-xs text-sentinel-muted">{asset.type.replace('_', ' ')}</div>
              </div>
              <StatusBadge status={asset.status} />
            </div>
            <div className="text-xs text-sentinel-muted space-y-1 mt-3">
              {asset.ipAddress && <div>IP: <span className="font-mono text-sentinel-text">{asset.ipAddress}</span></div>}
              {asset.location && <div>Location: {asset.location}</div>}
              <div>Criticality: {'★'.repeat(asset.criticality)}{'☆'.repeat(5 - asset.criticality)}</div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-sentinel-muted">Risk score</span>
              <span className="font-mono font-semibold text-sentinel-critical">{asset.riskScore.toFixed(0)}</span>
            </div>
          </Link>
        ))}
        {assets.length === 0 && <p className="text-sm text-sentinel-muted">No assets registered yet.</p>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <form className="panel p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <h2 className="text-lg font-semibold">Add asset</h2>
            <div>
              <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Name</label>
              <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AssetType })}>
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-sentinel-muted mb-1.5">IP address</label>
              <input className="input" value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Location</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Criticality (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                className="input"
                value={form.criticality}
                onChange={(e) => setForm({ ...form, criticality: Number(e.target.value) })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Adding…' : 'Add asset'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
