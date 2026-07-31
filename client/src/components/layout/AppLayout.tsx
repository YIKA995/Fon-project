import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useRealtimeAlerts } from '../../hooks/useSocket';

const titles: Record<string, string> = {
  '/': 'Overview',
  '/alerts': 'Alerts',
  '/incidents': 'Incidents',
  '/assets': 'Assets',
  '/threat-intel': 'Threat Intelligence',
  '/users': 'Users',
  '/audit-log': 'Audit Log',
  '/settings': 'Settings',
};

function titleFor(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  const base = `/${pathname.split('/')[1]}`;
  return titles[base] || 'Sentinel Africa';
}

export function AppLayout() {
  const location = useLocation();
  useRealtimeAlerts();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={titleFor(location.pathname)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
