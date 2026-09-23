import { useState } from 'react';

import { useAuth } from '../hooks/useAuth.jsx';
import { readTheme, writeTheme } from '../lib/theme.js';

function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <div className="form-check form-switch switch-check">
      <input
        type="checkbox"
        className="form-check-input"
        role="switch"
        id={label}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}

function SettingRow({ title, desc, control }) {
  return (
    <div className="setting-row">
      <div>
        <div className="setting-title">{title}</div>
        <div className="setting-desc">{desc}</div>
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}

export default function Settings() {
  const { user, demoMode, signOut } = useAuth();
  const [theme, setTheme] = useState(readTheme());
  const [protectByDefault, setProtectByDefault] = useState(
    () => localStorage.getItem('reposweep.protect_default') === '1'
  );
  const [confirmRequired] = useState(true);

  function setAndSave(next) {
    setTheme(next);
    writeTheme(next);
  }

  function toggleProtectDefault(value) {
    setProtectByDefault(value);
    localStorage.setItem('reposweep.protect_default', value ? '1' : '0');
  }

  return (
    <>
      <div className="page-head">
        <h1>Settings</h1>
        <p>Your connection, safety preferences, and appearance.</p>
      </div>

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="settings-card h-100">
            <div className="settings-head">
              <h6 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                <i className="bi bi-github" aria-hidden="true" />
                GitHub Account
              </h6>
            </div>
            <div className="settings-body">
              <div className="d-flex align-items-center gap-3 mb-3">
                <img
                  src={user?.avatar_url}
                  alt=""
                  aria-hidden="true"
                  className="rounded-circle border"
                  style={{ width: 56, height: 56, borderColor: 'var(--rs-border)' }}
                />
                <div>
                  <div className="fw-semibold" style={{ fontSize: 16 }}>
                    {user?.display_name || user?.username}
                  </div>
                  <div className="text-muted-rs">@{user?.username}</div>
                </div>
              </div>
              <div className="d-flex flex-column gap-2 small">
                <span className="d-flex align-items-center gap-2 text-muted-rs">
                  <i className={`bi ${demoMode ? 'bi-flask' : 'bi-link-45deg'}`} aria-hidden="true" />
                  {demoMode ? 'Demo account (no GitHub connection)' : 'Connected via GitHub OAuth'}
                </span>
                <span className="d-flex align-items-center gap-2 text-muted-rs">
                  <i className="bi bi-shield-check" aria-hidden="true" />
                  GitHub identity is your sign-in
                </span>
              </div>
              <hr />
              <button
                type="button"
                className="btn btn-outline-danger w-100"
                title={demoMode ? 'Sign out of the demo session' : 'Disconnect your GitHub account from RepoSweep'}
                onClick={signOut}
              >
                <i className="bi bi-box-arrow-right me-1" aria-hidden="true" />
                {demoMode ? 'Sign out' : 'Disconnect GitHub'}
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="settings-card mb-3">
            <div className="settings-head">
              <h6 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                <i className="bi bi-shield-exclamation" aria-hidden="true" />
                Safety
              </h6>
            </div>
            <div>
              <SettingRow
                title="Require confirmation before deletion"
                desc="RepoSweep always requires you to review and type DELETE before any bulk deletion runs. This cannot be disabled."
                control={<Toggle checked={confirmRequired} disabled onChange={() => {}} label="confirm" />}
              />
              <SettingRow
                title="Protect repositories by default"
                desc="When this is on, repositories you mark as favorites should be added to your protected list automatically."
                control={<Toggle checked={protectByDefault} onChange={toggleProtectDefault} label="protect-default" />}
              />
              <SettingRow
                title="Bulk deletion safeguards"
                desc="Protected repositories are excluded server-side. Even a crafted request can't delete a protected repository in bulk."
                control={
                  <span className="badge text-bg-success d-inline-flex align-items-center gap-1">
                    <i className="bi bi-check-circle" aria-hidden="true" />
                    Enforced
                  </span>
                }
              />
            </div>
          </div>

          <div className="settings-card mb-3">
            <div className="settings-head">
              <h6 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                <i className="bi bi-brightness-high" aria-hidden="true" />
                Appearance
              </h6>
            </div>
            <div className="settings-body">
              <div role="radiogroup" aria-label="Theme" className="d-flex flex-column gap-2">
                {[
                  { value: 'light', label: 'Light', icon: 'bi-sun', desc: 'Default light developer-tool theme' },
                  { value: 'dark', label: 'Dark', icon: 'bi-moon-stars', desc: 'Low-light friendly dark theme' },
                  { value: 'system', label: 'System', icon: 'bi-laptop', desc: 'Follow your operating system preference' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={theme === option.value}
                    className="btn d-flex align-items-center gap-3 w-100 text-start"
                    style={{
                      border:
                        theme === option.value
                          ? '1px solid var(--rs-accent)'
                          : '1px solid var(--rs-border)',
                      background: theme === option.value ? 'var(--rs-accent-muted)' : 'transparent',
                      color: 'var(--rs-text)',
                    }}
                    onClick={() => setAndSave(option.value)}
                  >
                    <i className={`bi ${option.icon}`} aria-hidden="true" style={{ fontSize: 18 }} />
                    <span className="flex-grow-1">
                      <span className="fw-semibold d-block">{option.label}</span>
                      <span className="text-muted-rs" style={{ fontSize: 12.5 }}>
                        {option.desc}
                      </span>
                    </span>
                    {theme === option.value && (
                      <i className="bi bi-check-circle-fill" style={{ color: 'var(--rs-accent)' }} aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-head">
              <h6 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                <i className="bi bi-person" aria-hidden="true" />
                Account
              </h6>
            </div>
            <div className="settings-body d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="text-muted-rs" style={{ fontSize: 13 }}>
                Signed in as <strong style={{ color: 'var(--rs-text)' }}>@{user?.username}</strong>.
                Signing out returns you to the RepoSweep landing page.
              </div>
              <button type="button" className="btn btn-outline-danger" onClick={signOut}>
                <i className="bi bi-box-arrow-right me-1" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}