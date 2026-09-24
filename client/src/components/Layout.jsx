import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Bell, BriefcaseBusiness, FileText, FolderLock, LayoutDashboard, LogOut, UsersRound, WalletCards, Plane, UserRound, HeartHandshake, Globe2, Settings2 } from 'lucide-react';
import { api } from '../services/api';
import BrandLogo from './BrandLogo.jsx';

export default function Layout({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadUnread() {
    try { const { data } = await api.get('/notifications/unread-count'); setUnreadCount(Number(data.count || 0)); } catch {}
  }

  useEffect(() => { loadUnread(); }, [location.pathname]);
  useEffect(() => { const t = window.setInterval(loadUnread, 30000); return () => window.clearInterval(t); }, []);

  async function logout() {
    try { await api.post('/auth/logout'); } finally {
      onLogout();
      navigate('/login');
    }
  }

  return (
    <div className="portal-shell">
      <aside className="sidebar">
        <Link to="/dashboard" className="brand">
          <BrandLogo showPartnership />
        </Link>

        <div className="partnership-card">
          <div className="partnership-icon"><Plane size={15} /></div>
          <div><span>JOINT TRAVEL PARTNERSHIP</span><strong>ASY &amp; HAJJA ZAINAB</strong></div>
        </div>

        <div className="sidebar-section">OPERATIONS</div>
        <nav>
          <NavLink to="/dashboard"><LayoutDashboard size={18} /><span>Dashboard</span></NavLink>
          <NavLink to="/clients"><UsersRound size={18} /><span>Clients</span></NavLink>
          <NavLink to="/documents"><FolderLock size={18} /><span>Documents</span></NavLink>
          <NavLink to="/payments"><WalletCards size={18} /><span>Payments</span></NavLink>
          <NavLink to="/opportunities"><Globe2 size={18} /><span>Travel Desk</span></NavLink>
          <NavLink to="/testimonials"><HeartHandshake size={18} /><span>Testimonials</span></NavLink>
          <NavLink to="/notifications"><Bell size={18} /><span>Notifications</span>{unreadCount > 0 && <b className="sidebar-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</b>}</NavLink>
          <NavLink to="/users"><BriefcaseBusiness size={18} /><span>Staff &amp; Users</span></NavLink>
          <NavLink to="/activity"><Activity size={18} /><span>Activity Log</span></NavLink>
          <NavLink to="/profile"><Settings2 size={18} /><span>Account Settings</span></NavLink>
        </nav>

        <div className="sidebar-footer">
          <Link to="/profile" className="signed-user signed-user-link">
            <div className="profile-link-icon"><UserRound size={15} /></div>
            <div className="avatar">{user.full_name.slice(0,1).toUpperCase()}</div>
            <div><strong>{user.full_name}</strong><span>{user.role.replace('_', ' ')}</span></div>
          </Link>
          <button className="logout-btn" onClick={logout}><LogOut size={17} /> Sign out</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">PRIVATE OPERATIONS PORTAL</div>
            <h1>ASY &amp; HAJJA ZAINAB GLOBAL TOURS AND MOBILITY</h1>
          </div>
          <div className="topbar-actions"><Link to="/notifications" className="notification-bell" title="Notifications"><Bell size={18}/>{unreadCount > 0 && <span>{unreadCount > 99 ? '99+' : unreadCount}</span>}</Link><div className="secure-badge"><FileText size={16} /> Authorized workspace <span className="partner-mini">ASY &amp; Hajja Zainab</span></div></div>
        </header>
        <section className="page-content"><Outlet /></section>
      </main>
    </div>
  );
}
