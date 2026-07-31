import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import type { AuditLogEntry } from '../types';

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    api
      .get('/audit-logs')
      .then((res) => setLogs(res.data.logs))
      .catch((err) => toast.error(apiErrorMessage(err, 'Failed to load audit log')));
  }, []);

  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-sentinel-panelAlt text-sentinel-muted text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Action</th>
            <th className="text-left px-4 py-3 font-medium">User</th>
            <th className="text-left px-4 py-3 font-medium">Target</th>
            <th className="text-left px-4 py-3 font-medium">IP</th>
            <th className="text-left px-4 py-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sentinel-border">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
              <td className="px-4 py-3 text-sentinel-muted">{log.user?.name || 'System'}</td>
              <td className="px-4 py-3 text-sentinel-muted font-mono text-xs">{log.target || '—'}</td>
              <td className="px-4 py-3 text-sentinel-muted font-mono text-xs">{log.ipAddress || '—'}</td>
              <td className="px-4 py-3 text-sentinel-muted whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sentinel-muted">No audit events recorded yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
