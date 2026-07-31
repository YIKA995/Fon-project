import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/client';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/Badge';
import type { DashboardSummary } from '../types';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#f87171',
  HIGH: '#fb923c',
  MEDIUM: '#facc15',
  LOW: '#60a5fa',
};

export function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get('/dashboard/summary');
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, 'Failed to load dashboard'));
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (error) return <p className="text-sentinel-critical text-sm">{error}</p>;
  if (!data) return <p className="text-sentinel-muted text-sm">Loading overview…</p>;

  const trend = data.alertsTrend.map((t) => ({
    time: new Date(t.bucket).toLocaleString(undefined, { hour: '2-digit', day: '2-digit', month: 'short' }),
    count: t.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Monitored Assets" value={data.assets.total} hint={`${data.assets.atRisk} at risk`} />
        <StatCard label="Open Alerts" value={data.alerts.open} tone={data.alerts.open > 0 ? 'critical' : 'good'} hint={`${data.alerts.critical} critical`} />
        <StatCard label="Open Incidents" value={data.incidents.open} tone={data.incidents.open > 0 ? 'critical' : 'good'} />
        <StatCard label="Events (24h)" value={data.events.last24h} hint={`${data.alerts.last24h} alerts generated`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel p-5 lg:col-span-2">
          <h2 className="font-medium mb-4">Alert volume (7 days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2a40" />
              <XAxis dataKey="time" stroke="#8b9ab3" fontSize={11} tickLine={false} />
              <YAxis stroke="#8b9ab3" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#131b2e', border: '1px solid #1f2a40', borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" stroke="#22d3ee" fill="url(#alertGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel p-5">
          <h2 className="font-medium mb-4">Alerts by severity</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.severityBreakdown}
                dataKey="count"
                nameKey="severity"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {data.severityBreakdown.map((entry) => (
                  <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#131b2e', border: '1px solid #1f2a40', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {data.severityBreakdown.map((s) => (
              <div key={s.severity} className="flex items-center gap-1.5 text-xs text-sentinel-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_COLORS[s.severity] }} />
                {s.severity} ({s.count})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel p-5">
          <h2 className="font-medium mb-4">Highest risk assets</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.topAssets} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2a40" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="#8b9ab3" fontSize={11} />
              <YAxis type="category" dataKey="name" width={140} stroke="#8b9ab3" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: '#131b2e', border: '1px solid #1f2a40', borderRadius: 8 }} />
              <Bar dataKey="riskScore" fill="#f87171" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel p-5">
          <h2 className="font-medium mb-4">Assets requiring attention</h2>
          <div className="space-y-2">
            {data.topAssets.length === 0 && <p className="text-sm text-sentinel-muted">No elevated-risk assets right now.</p>}
            {data.topAssets.map((asset) => (
              <Link
                key={asset.id}
                to={`/assets/${asset.id}`}
                className="flex items-center justify-between rounded-lg border border-sentinel-border bg-sentinel-panelAlt px-3 py-2.5 hover:border-sentinel-accent/50 transition"
              >
                <div>
                  <div className="text-sm font-medium">{asset.name}</div>
                  <div className="text-xs text-sentinel-muted">{asset.type.replace('_', ' ')}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-sentinel-critical">{asset.riskScore.toFixed(0)}</span>
                  <StatusBadge status={asset.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
