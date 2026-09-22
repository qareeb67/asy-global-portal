import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api } from './services/api';
import Login from './pages/Login.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Clients from './pages/Clients.jsx';
import ClientDetail from './pages/ClientDetail.jsx';
import Users from './pages/Users.jsx';
import Activity from './pages/Activity.jsx';
import ReceiptPrint from './pages/ReceiptPrint.jsx';
import Documents from './pages/Documents.jsx';
import Payments from './pages/Payments.jsx';
import Profile from './pages/Profile.jsx';
import Opportunities from './pages/Opportunities.jsx';
import Notifications from './pages/Notifications.jsx';
import Testimonials from './pages/Testimonials.jsx';

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) return <div className="app-loading">Loading ASY Portal…</div>;
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/payments/:id/print" element={<ReceiptPrint />} />
      <Route element={<Layout user={user} onLogout={() => setUser(null)} />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail user={user} />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/profile" element={<Profile user={user} onUserUpdated={setUser} />} />
        <Route path="/users" element={<Users user={user} />} />
        <Route path="/activity" element={<Activity />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
