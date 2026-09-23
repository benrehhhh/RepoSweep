import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import { Topbar } from '../components/layout/Topbar.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import DemoModeBanner from '../components/common/DemoModeBanner.jsx';

export default function AppLayout() {
  const { loading, authenticated, demoMode } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <LoadingState label="Checking your session…" rows={3} />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-shell d-flex">
      <Sidebar />
      <div className="app-main d-flex flex-column">
        {demoMode && <DemoModeBanner />}
        <Topbar />
        <main className="app-content flex-grow-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}