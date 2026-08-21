import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  icon: string;
  label: string;
  path: string;
}

const citizenNav: NavItem[] = [
  { icon: 'dashboard', label: 'Overview', path: '/dashboard' },
  { icon: 'report_problem', label: 'My Complaints', path: '/complaints' },
  { icon: 'add_circle', label: 'Submit Complaint', path: '/complaints/new' },
  { icon: 'map', label: 'City Map', path: '/map' },
  { icon: 'notifications', label: 'Notifications', path: '/notifications' },
];

const workerNav: NavItem[] = [
  { icon: 'assignment', label: 'My Assignments', path: '/worker' },
  { icon: 'map', label: 'City Map', path: '/map' },
  { icon: 'person', label: 'Profile', path: '/profile' },
];

const adminNav: NavItem[] = [
  { icon: 'dashboard', label: 'Dashboard', path: '/admin' },
  { icon: 'list_alt', label: 'All Complaints', path: '/admin/complaints' },
  { icon: 'engineering', label: 'Workers', path: '/admin/workers' },
  { icon: 'bar_chart', label: 'Analytics', path: '/admin/analytics' },
  { icon: 'map', label: 'City Map', path: '/admin/map' },
  { icon: 'health_metrics', label: 'Zone Health', path: '/admin/zones' },
];

interface LayoutProps {
  children: ReactNode;
  user: any;
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function Layout({ children, user, pageTitle, pageSubtitle }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const nav = user?.role === 'admin' ? adminNav : user?.role === 'worker' ? workerNav : citizenNav;
  const homeRoute = user?.role === 'admin' ? '/admin' : user?.role === 'worker' ? '/worker' : '/dashboard';
  const initials = (user?.name || user?.email || '?').slice(0, 2).toUpperCase();
  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'worker' ? 'Field Worker' : 'Citizen';
  const roleBadgeColor = user?.role === 'admin' ? '#1e1e8a' : user?.role === 'worker' ? '#d97706' : '#16a34a';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <div className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to={homeRoute} className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>location_city</span>
          </div>
          <div>
            <div className="sidebar-brand-name">Civic Intelligence</div>
            <div className="sidebar-brand-subtitle">Bhopal, MP</div>
          </div>
        </Link>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: roleBadgeColor }}>
              {user?.role === 'admin' ? 'admin_panel_settings' : user?.role === 'worker' ? 'engineering' : 'person'}
            </span>
            {roleLabel} Menu
          </div>

          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${location.pathname === item.path || (item.path !== homeRoute && location.pathname.startsWith(item.path)) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/profile" className="sidebar-user" onClick={() => setSidebarOpen(false)}>
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name" style={{ fontSize: 13, fontWeight: 600, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || user?.email}
              </div>
              <div className="sidebar-user-role" style={{ fontSize: 11, color: roleBadgeColor, fontWeight: 600 }}>{roleLabel}</div>
            </div>
          </Link>
          <button className="sidebar-logout" onClick={handleLogout} title="Sign out">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button className="topbar-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="topbar-title">
            <h1 className="topbar-page-title">{pageTitle || 'Civic Platform'}</h1>
            {pageSubtitle && <p className="topbar-page-subtitle">{pageSubtitle}</p>}
          </div>
          <div className="topbar-actions">
            <Link to="/notifications" className="topbar-icon-btn" title="Notifications">
              <span className="material-symbols-outlined">notifications</span>
            </Link>
            <Link to="/profile" className="topbar-avatar" title="Profile">
              {initials}
            </Link>
          </div>
        </header>

        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}
