import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

// ─── Module 1: Authentication ─────────────────────────────────────────────────
import { AuthProvider, useAuth } from './Module1-Authentication/AuthContext';
import LoginPage    from './Module1-Authentication/LoginPage';
import DashboardPage from './Module1-Authentication/DashboardPage';

// ─── Module 2: Property And Rooms ─────────────────────────────────────────────
import RoomsPage from './Module2-Property-And-Rooms/RoomsPage';

// ─── Module 3: Resident Management ────────────────────────────────────────────
import ResidentsPage from './Module3-Resident-Management/ResidentsPage';

// ─── Module 4: Complaints & Maintenance ───────────────────────────────────────
import ComplaintsPage from './Module4-Complaints-Maintenance/ComplaintsPage';

// ─── Module 5: Visitor Management ─────────────────────────────────────────────
import VisitorsPage from './Module5-Visitor-Management/VisitorsPage';

// ─── Module 6: Payments & Invoicing ───────────────────────────────────────────
import PaymentsPage from './Module6-Payments-Invoicing/PaymentsPage';

// ─── Module 7: SOS & Emergency Alerts ─────────────────────────────────────────
import EmergencyPage from './Module7-SOS-Emergency/EmergencyPage';

// ─── Module 8: Notice Board & Broadcasts ──────────────────────────────────────
import NoticesPage from './Module8-Notices-Broadcasts/NoticesPage';

// ─── Module 9: Food & Mess Management ─────────────────────────────────────────
import FoodMessPage from './Module9-Food-Mess/FoodMessPage';

// ─── Module 10: Inventory & Asset Management ──────────────────────────────────
import InventoryPage from './Module10-Inventory-Assets/InventoryPage';

// ─── Module 11: Staff & Guard Duty Roster ─────────────────────────────────────
import StaffRosterPage from './Module11-Staff-Roster/StaffRosterPage';

// ─── Module 12: Platform Intelligence & Reports ───────────────────────────────
import AnalyticsReportsPage from './Module12-Analytics-Reports/AnalyticsReportsPage';

// ─── Shared / Public ──────────────────────────────────────────────────────────
import LandingPage from './pages/LandingPage';

// Navigation Groups modeled after enterprise platforms (Slack, Stripe, Jira, Linear)
const NAV_GROUPS = [
  {
    category: 'OVERVIEW',
    items: [
      { path: '/', label: 'Home & Welcome', icon: '🏠' },
      { path: '/dashboard', label: 'My Dashboard', icon: '📊' },
      { path: '/analytics', label: 'Executive Intelligence', icon: '📈' },
    ]
  },
  {
    category: 'RESIDENCE & LIVING',
    items: [
      { path: '/rooms', label: 'Properties & Rooms', icon: '🏢' },
      { path: '/residents', label: 'Resident Directory', icon: '👥' },
      { path: '/payments', label: 'Billing & Payments', icon: '💳' },
      { path: '/food', label: 'Food & Mess Dining', icon: '🍲' },
    ]
  },
  {
    category: 'SERVICES & OPERATIONS',
    items: [
      { path: '/complaints', label: 'Helpdesk & Complaints', icon: '🛠️' },
      { path: '/notices', label: 'Community Notices', icon: '📢' },
      { path: '/visitors', label: 'Gate & Visitor Passes', icon: '🎫' },
      { path: '/inventory', label: 'Equipment & Assets', icon: '📦' },
      { path: '/roster', label: 'Staff & Guard Roster', icon: '👮' },
    ]
  }
];

// Helper to look up active page title & breadcrumbs
function getPageMeta(pathname) {
  for (const group of NAV_GROUPS) {
    const found = group.items.find(i => i.path === pathname);
    if (found) return { category: group.category, title: found.label, icon: found.icon };
  }
  if (pathname === '/emergency') return { category: 'CRITICAL OPS', title: 'Emergency Rapid Response SOS', icon: '🚨' };
  if (pathname === '/login') return { category: 'ACCESS CONTROL', title: 'Platform Authentication', icon: '🔐' };
  return { category: 'WORKSPACE', title: 'Smart Living & Safety', icon: '⚡' };
}

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside className="app-sidebar">
      {/* Brand & Workspace ID */}
      <div className="sidebar-header">
        <Link to="/" className="sidebar-brand">
          <div className="sidebar-logo-icon">🏠</div>
          <div>
            <div style={{ lineHeight: 1.1, fontSize: '0.98rem' }}>SmartLiving</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>Shared Living OS</div>
          </div>
        </Link>
        <span className="sidebar-badge">v2.4</span>
      </div>

      {/* Nav Tree */}
      <div className="sidebar-content">
        {NAV_GROUPS.map((group) => (
          <div key={group.category}>
            <div className="nav-group-title">{group.category}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span className="sidebar-nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Profile Strip */}
      <div className="sidebar-footer">
        {user ? (
          <div className="user-quick-profile">
            <div className="user-avatar-circle">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.fullName}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {user.roles && user.roles.length > 0 ? user.roles[0].replace('ROLE_', '') : 'Resident'}
              </div>
            </div>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem' }}>
            Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}

function TopBar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const pageMeta = getPageMeta(location.pathname);

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <div className="topbar-page-info">
          <span className="topbar-breadcrumb">{pageMeta.category}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>{pageMeta.icon}</span>
            <span className="topbar-title">{pageMeta.title}</span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Real-time System Pulse */}
        <div className="system-status-indicator">
          <span className="status-dot-pulse" />
          <span>Live Gateway</span>
        </div>

        {/* Dedicated Quick Action SOS Emergency Trigger */}
        <Link to="/emergency" className="topbar-sos-btn">
          <span>🚨</span>
          <span>SOS Panic</span>
        </Link>

        {/* User Account Controls */}
        {isAuthenticated && user ? (
          <div className="topbar-user">
            <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
              <div className="topbar-user-name">{user.fullName}</div>
              <div className="topbar-user-role">
                {user.roles && user.roles.length > 0 ? user.roles[0].replace('ROLE_', '') : 'MEMBER'}
              </div>
            </div>
            <button
              onClick={logout}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Sidebar />

        <div className="main-wrapper">
          <TopBar />

          <main className="page-container">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/residents" element={<ResidentsPage />} />
              <Route path="/complaints" element={<ComplaintsPage />} />
              <Route path="/notices" element={<NoticesPage />} />
              <Route path="/visitors" element={<VisitorsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/food" element={<FoodMessPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/roster" element={<StaffRosterPage />} />
              <Route path="/analytics" element={<AnalyticsReportsPage />} />
              <Route path="/emergency" element={<EmergencyPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </main>

          <footer className="app-footer">
            <div>
              &copy; {new Date().getFullYear()} <strong>SmartLiving &amp; Safety Platform</strong> &bull; Unified Enterprise Living OS
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <span>Security: RBAC Enforced</span>
              <span>Backend: Connected (Port 8080)</span>
            </div>
          </footer>
        </div>
      </div>
    </AuthProvider>
  );
}
