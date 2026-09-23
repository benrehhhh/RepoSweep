import { Route, Routes, Navigate } from 'react-router-dom';

import AppLayout from './layouts/AppLayout.jsx';
import LandingPage from './pages/Landing.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Repositories from './pages/Repositories.jsx';
import ProtectedRepositories from './pages/ProtectedRepositories.jsx';
import Activity from './pages/Activity.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="repositories" element={<Repositories />} />
        <Route path="protected" element={<ProtectedRepositories />} />
        <Route path="activity" element={<Activity />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}