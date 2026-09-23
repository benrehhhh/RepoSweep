import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import SweepMark from '../components/common/SweepMark.jsx';

const FEATURES = [
  { icon: 'bi-collection', title: 'Bulk Repository Management', text: 'Work across every repository in your GitHub account from one focused workspace.' },
  { icon: 'bi-funnel', title: 'Smart Filtering', text: 'Filter by activity, visibility, language, and age. Sort by name, stars, or last update.' },
  { icon: 'bi-shield-check', title: 'Safe Deletion', text: 'Bulk deletion requires an explicit typed confirmation. Nothing destructive happens on a stray click.' },
  { icon: 'bi-archive', title: 'Repository Archiving', text: 'Archive multiple repositories at once — a reversible first step before deciding what to remove.' },
  { icon: 'bi-clock-history', title: 'Activity History', text: 'A complete log of every sweep, archive, and protection change you make.' },
  { icon: 'bi-github', title: 'GitHub Integration', text: 'Sign in with your GitHub account. RepoSweep uses your existing permissions — nothing more.' },
];

const STEPS = [
  { title: 'Connect GitHub', text: 'Sign in with your GitHub account using OAuth. We never ask for your password.' },
  { title: 'Review Your Repositories', text: 'See everything you have, with clear indicators for repositories that haven’t seen recent activity.' },
  { title: 'Select What You Want to Clean', text: 'Search, filter, and multi-select. Protect the repositories you want to keep safe.' },
  { title: 'Sweep', text: 'Review the exact changes, confirm, and let RepoSweep execute. Track results as they complete.' },
];

function TerminalMock() {
  return (
    <div className="hero-terminal" role="img" aria-label="Demo of a sweep finishing successfully">
      <div className="term-head">
        <span className="dot" style={{ background: '#ff5f57' }} />
        <span className="dot" style={{ background: '#febc2e' }} />
        <span className="dot" style={{ background: '#28c840' }} />
        <span className="ms-2">reposweep sweep</span>
      </div>
      <div className="term-body">
        <div>
          <span className="prompt">$</span> reposweep sweep —confirm-yeet
        </div>
        <div className="dim">Sweeping 4 repositories…</div>
        <div>
          <span className="ok">✓</span> old-school-project <span className="dim">deleted</span>
        </div>
        <div>
          <span className="ok">✓</span> test-api <span className="dim">deleted</span>
        </div>
        <div>
          <span className="ok">✓</span> experiment-2023 <span className="dim">deleted</span>
        </div>
        <div>
          <span className="bad">✗</span> unused-demo <span className="dim">rate limited — retained</span>
        </div>
        <div className="dim mt-1">
          → 3 deleted, 1 retained. Nothing destroyed without your explicit OK.
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user, demoMode, signInDemo, loading } = useAuth();
  const [error, setError] = useState(null);

  async function handlePrimary() {
    setError(null);
    if (demoMode) {
      const ok = await signInDemo();
      if (!ok) setError('Could not start the demo session. Check that the backend is running.');
      return;
    }
    window.location.href = '/api/auth/github';
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg landing-navbar sticky-top">
        <div className="container">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
            <span
              className="d-grid place-items-center rounded"
              style={{ width: 30, height: 30, background: 'var(--rs-accent)', color: '#fff' }}
            >
              <SweepMark size={20} />
            </span>
            <span className="fw-bold">RepoSweep</span>
          </Link>
          <div className="d-none d-md-flex align-items-center gap-3">
            <a href="#features" className="nav-link text-decoration-none text-muted-rs">
              Features
            </a>
            <a href="#how-it-works" className="nav-link text-decoration-none text-muted-rs">
              How It Works
            </a>
            <a href="#safety" className="nav-link text-decoration-none text-muted-rs">
              Safety
            </a>
          </div>
          <div className="d-flex align-items-center gap-2">
            {user ? (
              <Link to="/app" className="btn btn-primary btn-sm">
                Go to Dashboard
                <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handlePrimary}
                disabled={loading}
              >
                <i className="bi bi-github me-1" aria-hidden="true" />
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>
      </nav>

      <header className="landing-hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="eyebrow">
                <SweepMark size={17} className="align-middle" />
                Bulk GitHub repository cleanup
              </span>
              <h1 className="display-5 fw-bold mt-3 mb-3" style={{ letterSpacing: '-0.03em' }}>
                Clean up your GitHub without the busywork.
              </h1>
              <p className="lead text-muted-rs mb-4" style={{ fontSize: 17 }}>
                Manage, archive, and clean up multiple repositories from one simple workspace.
              </p>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <button type="button" className="btn btn-primary btn-lg px-4" onClick={handlePrimary}>
                  <i className="bi bi-github me-2" aria-hidden="true" />
                  Connect GitHub
                </button>
                <a href="#how-it-works" className="btn btn-outline-secondary btn-lg px-4">
                  See How It Works
                </a>
              </div>
              {error && (
                <div className="alert alert-danger d-inline-flex align-items-center gap-2 py-2">
                  <i className="bi bi-exclamation-circle" aria-hidden="true" />
                  {error}
                </div>
              )}
              <p className="small text-muted-rs mt-2">
                Sign in with GitHub OAuth. RepoSweep never asks for your password.
              </p>
            </div>
            <div className="col-lg-6 d-none d-lg-block">
              <TerminalMock />
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="landing-section">
        <div className="container">
          <div className="text-center mb-5">
            <div className="section-kicker">Features</div>
            <h2 className="mt-2 fw-bold">Everything you need to sweep clean</h2>
            <p className="text-muted-rs mx-auto" style={{ maxWidth: 560 }}>
              Built for developers who have accumulated more repositories than they can
              keep track of.
            </p>
          </div>
          <div className="row g-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="col-md-6 col-lg-4">
                <div className="feature-tile">
                  <div className="feat-icon">
                    <i className={`bi ${f.icon}`} aria-hidden="true" />
                  </div>
                  <h5 className="fw-semibold mt-2">{f.title}</h5>
                  <p className="text-muted-rs mb-0" style={{ fontSize: 13.5 }}>
                    {f.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section" style={{ background: 'var(--rs-surface)', borderTop: '1px solid var(--rs-border-subtle)', borderBottom: '1px solid var(--rs-border-subtle)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <div className="section-kicker">How It Works</div>
            <h2 className="mt-2 fw-bold">From review to cleanup in four steps</h2>
          </div>
          <div className="row g-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="col-md-6 col-lg-3">
                <div>
                  <div className="step-number">{i + 1}</div>
                  <h5 className="fw-semibold">{s.title}</h5>
                  <p className="text-muted-rs" style={{ fontSize: 13.5 }}>
                    {s.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="landing-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card p-4 p-lg-5">
                <div className="text-center mb-4">
                  <div className="section-kicker">Safety First</div>
                  <h2 className="mt-2 fw-bold">Deleting repositories is your call — always.</h2>
                </div>
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="d-flex gap-3">
                      <i className="bi bi-shield-check fs-3" style={{ color: 'var(--rs-accent)' }} aria-hidden="true" />
                      <div>
                        <h6 className="fw-semibold">No automatic deletion</h6>
                        <p className="text-muted-rs" style={{ fontSize: 13 }}>
                          RepoSweep never deletes repositories on its own. Inactive repositories
                          are flagged as potentially inactive — never auto-removed.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex gap-3">
                      <i className="bi bi-typing fs-3" style={{ color: 'var(--rs-accent)' }} aria-hidden="true" />
                      <div>
                        <h6 className="fw-semibold">Explicit confirmation</h6>
                        <p className="text-muted-rs" style={{ fontSize: 13 }}>
                          Bulk deletion requires reviewing the full list and typing{' '}
                          <span className="mono code-chip">DELETE</span> before anything is removed.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex gap-3">
                      <i className="bi bi-shield-lock fs-3" style={{ color: 'var(--rs-accent)' }} aria-hidden="true" />
                      <div>
                        <h6 className="fw-semibold">Protected repositories</h6>
                        <p className="text-muted-rs" style={{ fontSize: 13 }}>
                          Shield important repositories so they’re excluded from bulk destructive
                          actions until you remove the protection.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex gap-3">
                      <i className="bi bi-server-check fs-3" style={{ color: 'var(--rs-accent)' }} aria-hidden="true" />
                      <div>
                        <h6 className="fw-semibold">Server-side enforcement</h6>
                        <p className="text-muted-rs" style={{ fontSize: 13 }}>
                          Every destructive request is re-validated on the server. The frontend
                          never decides on its own what GitHub should allow.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-5">
<div className="d-flex align-items-center gap-2 mb-2">
                <SweepMark size={18} />
                <span className="fw-bold text-white">RepoSweep</span>
              </div>
              <p className="mb-1" style={{ color: 'var(--rs-sidebar-muted)', fontSize: 13 }}>
                Clean up your GitHub, one sweep at a time.
              </p>
              <p style={{ color: 'var(--rs-sidebar-muted)', fontSize: 12 }}>
                RepoSweep is not affiliated with GitHub. GitHub and the GitHub logo are
                trademarks of GitHub, Inc.
              </p>
            </div>
            <div className="col-md-3 col-6">
              <div className="fw-semibold mb-2" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Product
              </div>
              <div className="d-flex flex-column gap-1">
                <a href="#features">Features</a>
                <a href="#how-it-works">How it works</a>
                <a href="#safety">Safety</a>
              </div>
            </div>
            <div className="col-md-2 col-6">
              <div className="fw-semibold mb-2" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Legal
              </div>
              <div className="d-flex flex-column gap-1">
                <a href="#privacy">Privacy</a>
                <a href="#terms">Terms</a>
              </div>
            </div>
            <div className="col-md-2 col-6">
              <div className="fw-semibold mb-2" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                GitHub API
              </div>
              <div className="d-flex flex-column gap-1">
                <a href="https://docs.github.com/en/rest" target="_blank" rel="noreferrer">
                  API docs
                  <i className="bi bi-box-arrow-up-right ms-1" aria-hidden="true" />
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer">
                  github.com
                </a>
              </div>
            </div>
          </div>
          <hr style={{ borderColor: 'var(--rs-sidebar-border)', margin: '24px 0 16px' }} />
          <div className="d-flex justify-content-between flex-wrap gap-2" style={{ color: 'var(--rs-sidebar-muted)', fontSize: 12 }}>
            <span>© {new Date().getFullYear()} RepoSweep</span>
            <span>Built with the GitHub REST API</span>
          </div>
        </div>
      </footer>
    </>
  );
}