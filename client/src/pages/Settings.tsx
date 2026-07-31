import { useAuth } from '../context/AuthContext';

export function Settings() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="panel p-6">
        <h2 className="font-medium mb-4">Profile</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-sentinel-muted">Name</dt>
            <dd>{user?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sentinel-muted">Email</dt>
            <dd>{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sentinel-muted">Role</dt>
            <dd>{user?.role}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sentinel-muted">Organization</dt>
            <dd>{user?.organization || '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="panel p-6">
        <h2 className="font-medium mb-4">About Sentinel Africa</h2>
        <p className="text-sm text-sentinel-muted leading-relaxed">
          Sentinel Africa combines signature-based detection (known-bad indicators, brute-force and injection
          patterns) with statistical anomaly scoring to surface threats across your network, banking and enterprise
          infrastructure in real time. Edge agents buffer telemetry locally and sync automatically once connectivity
          is restored, so monitoring continues uninterrupted even on unreliable links.
        </p>
      </div>
    </div>
  );
}
