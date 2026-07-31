import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function Topbar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const online = useOnlineStatus();
  const navigate = useNavigate();

  return (
    <header className="h-16 shrink-0 border-b border-sentinel-border bg-sentinel-panel/60 backdrop-blur flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <div
          className={clsx(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ring-1 ring-inset',
            online
              ? 'text-sentinel-accent2 ring-sentinel-accent2/30 bg-sentinel-accent2/10'
              : 'text-sentinel-critical ring-sentinel-critical/30 bg-sentinel-critical/10'
          )}
          title={online ? 'Connected to Sentinel Africa' : 'Offline — showing cached data'}
        >
          <span className={clsx('h-1.5 w-1.5 rounded-full', online ? 'bg-sentinel-accent2' : 'bg-sentinel-critical animate-pulse')} />
          {online ? 'Online' : 'Offline'}
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-[11px] text-sentinel-muted">{user.role}</div>
            </div>
            <button
              className="btn-secondary !px-3 !py-1.5"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
