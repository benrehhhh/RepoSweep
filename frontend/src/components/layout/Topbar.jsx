import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import Dropdown from '../common/Dropdown.jsx';
import Offcanvas from '../common/Offcanvas.jsx';
import { Brand, NavItems } from './Sidebar.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';

const TITLES = {
  '/app': 'Dashboard',
  '/app/repositories': 'Repositories',
  '/app/protected': 'Protected Repositories',
  '/app/activity': 'Activity',
  '/app/settings': 'Settings',
};

export function pageTitle(pathname) {
  return TITLES[pathname] || 'RepoSweep';
}

export function Topbar() {
  const { user, demoMode, signOut } = useAuth();
  const [mobileNav, setMobileNav] = useState(false);
  const location = useLocation();

  return (
    <header className="app-topbar">
      <button
        type="button"
        className="btn btn-ghost d-lg-none d-flex align-items-center"
        aria-label="Open navigation"
        onClick={() => setMobileNav(true)}
      >
        <i className="bi bi-list fs-4" aria-hidden="true" />
      </button>
      <h1 className="page-title m-0">{pageTitle(location.pathname)}</h1>

      <div className="ms-auto d-flex align-items-center gap-2">
        {demoMode && (
          <span className="demo-badge d-none d-sm-inline-flex">
            <i className="bi bi-flask" aria-hidden="true" />
            Demo mode
          </span>
        )}
        <Dropdown
          className="ms-1"
          align="end"
          menuClassName="position-absolute end-0"
          toggle={
            <>
              <span className="avatar me-1 d-inline-block" aria-hidden="true">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="rounded-circle"
                    style={{ width: 28, height: 28 }}
                  />
                ) : (
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary text-white"
                    style={{ width: 28, height: 28 }}
                  >
                    <i className="bi bi-person" />
                  </span>
                )}
              </span>
              <span className="d-none d-sm-inline user-name" style={{ fontSize: 13.5, fontWeight: 600 }}>
                {user?.username || 'Account'}
              </span>
              <i className="bi bi-chevron-down small text-muted-rs" aria-hidden="true" />
            </>
          }
        >
          <div className="px-2 py-2 border-bottom mb-1">
            <div className="fw-semibold" style={{ fontSize: 13.5 }}>
              {user?.display_name || user?.username}
            </div>
            <div className="text-muted-rs" style={{ fontSize: 12 }}>
              @{user?.username}
              {user?.is_demo && (
                <span className="ms-1 demo-badge" style={{ border: 'none', padding: '1px 6px' }}>
                  Demo
                </span>
              )}
            </div>
          </div>
          <NavLink to="/app/settings" className="dropdown-item">
            <i className="bi bi-gear" aria-hidden="true" />
            Settings
          </NavLink>
          <button type="button" className="dropdown-item text-fire" onClick={signOut}>
            <i className="bi bi-box-arrow-right" aria-hidden="true" />
            Sign out
          </button>
        </Dropdown>
      </div>

      <Offcanvas
        open={mobileNav}
        onClose={() => setMobileNav(false)}
        title="RepoSweep"
        side="start"
        className="offcanvas-nav"
      >
        <Brand tagline={false} />
        <div className="mt-2 border-top">
          <NavItems />
        </div>
        <div className="p-3 mt-auto text-muted-rs">
          <div className="small">
            <i className="bi bi-github me-1" aria-hidden="true" />
            Powered by the GitHub API
          </div>
        </div>
      </Offcanvas>
    </header>
  );
}