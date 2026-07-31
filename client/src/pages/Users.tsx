import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Role, User } from '../types';

const ROLES: Role[] = ['ADMIN', 'ANALYST', 'VIEWER'];

export function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load users'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateRole(id: string, role: Role) {
    try {
      const res = await api.patch(`/users/${id}`, { role });
      setUsers((prev) => prev.map((u) => (u.id === id ? res.data.user : u)));
      toast.success('Role updated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update role'));
    }
  }

  async function toggleActive(u: User) {
    try {
      const res = await api.patch(`/users/${u.id}`, { isActive: !u.isActive });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? res.data.user : x)));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update user'));
    }
  }

  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-sentinel-panelAlt text-sentinel-muted text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Name</th>
            <th className="text-left px-4 py-3 font-medium">Email</th>
            <th className="text-left px-4 py-3 font-medium">Organization</th>
            <th className="text-left px-4 py-3 font-medium">Role</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">Last login</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sentinel-border">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-medium">{u.name}</td>
              <td className="px-4 py-3 text-sentinel-muted">{u.email}</td>
              <td className="px-4 py-3 text-sentinel-muted">{u.organization || '—'}</td>
              <td className="px-4 py-3">
                <select
                  className="input !w-auto !py-1"
                  value={u.role}
                  disabled={u.id === me?.id}
                  onChange={(e) => updateRole(u.id, e.target.value as Role)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <button
                  className={u.isActive ? 'badge bg-sentinel-accent2/15 text-sentinel-accent2' : 'badge bg-sentinel-muted/15 text-sentinel-muted'}
                  disabled={u.id === me?.id}
                  onClick={() => toggleActive(u)}
                >
                  {u.isActive ? 'Active' : 'Disabled'}
                </button>
              </td>
              <td className="px-4 py-3 text-sentinel-muted">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
