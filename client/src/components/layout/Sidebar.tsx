import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'ANALYST', 'VIEWER'] },
  { to: '/alerts', label: 'Alerts', icon: '🚨', roles: ['ADMIN', 'ANALYST', 'VIEWER'] },
  { to: '/incidents', label: 'Incidents', icon: '🧭', roles: ['ADMIN', 'ANALYST', 'VIEWER'] },
  { to: '/assets', label: 'Assets', icon: '🖥️', roles: ['ADMIN', 'ANALYST', 'VIEWER'] },
  { to: '/threat-intel', label: 'Threat Intel', icon: '🧬', roles: ['ADMIN', 'ANALYST', 'VIEWER'] },
  { to: '/users', label: 'Users', icon: '👥', roles: ['ADMIN'] },
  { to: '/audit-log', label: 'Audit Log', icon: '📜', roles: ['ADMIN'] },
  { to: '/settings', label: 'Settings', icon: '⚙️', roles: ['ADMIN', 'ANALYST', 'VIEWER'] },
];

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-60 shrink-0 border-r border-sentinel-border bg-sentinel-panel flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-sentinel-border">
        <span className="text-2xl">🛡️</span>
        <div>
          <div className="font-semibold leading-tight">Sentinel Africa</div>
          <div className="text-[11px] text-sentinel-muted leading-tight">Cyber Defense Platform</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems
          .filter((item) => !user || item.roles.includes(user.role))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-sentinel-accent/10 text-sentinel-accent shadow-glow'
                    : 'text-sentinel-muted hover:bg-sentinel-panelAlt hover:text-sentinel-text'
                )
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
      </nav>
      <div className="px-4 py-4 border-t border-sentinel-border text-[11px] text-sentinel-muted">
        Sentinel Africa v1.0
        <br />
        AI-assisted threat detection
      </div>
    </aside>
  );
}
