import { NavLink } from 'react-router-dom';

import SweepMark from '../common/SweepMark.jsx';

export const NAV_ITEMS = [
  { to: '/app', end: true, icon: 'bi-grid-1x2', label: 'Dashboard' },
  { to: '/app/repositories', icon: 'bi-collection', label: 'Repositories' },
  { to: '/app/protected', icon: 'bi-shield-lock', label: 'Protected' },
  { to: '/app/activity', icon: 'bi-clock-history', label: 'Activity' },
  { to: '/app/settings', icon: 'bi-gear', label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="app-sidebar" aria-label="Primary navigation">
      <Brand />
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Workspace</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <i className="bi bi-github me-1" aria-hidden="true" />
        Powered by the GitHub API
        <div className="mt-1">v1.0.0</div>
      </div>
    </aside>
  );
}

export function Brand({ tagline = true }) {
  return (
    <a className="sidebar-brand" href="/">
      <span className="brand-mark" aria-hidden="true">
        <SweepMark size={20} />
      </span>
      <span className="d-flex flex-column">
        <span className="brand-name">RepoSweep</span>
        {tagline && <span className="brand-tagline">Clean up your GitHub</span>}
      </span>
    </a>
  );
}

export function NavItems() {
  return (
    <nav className="sidebar-nav">
      <div className="sidebar-section-label">Workspace</div>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <i className={`bi ${item.icon}`} aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}