import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { roomService } from './Module2-Property-And-Rooms/roomService';
import { syncHub } from './utils/syncHub';

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

// Navigation Groups containing all 12 platform modules
const NAV_GROUPS = [
  {
    category: 'OVERVIEW',
    items: [
      { path: '/', label: 'Home & Welcome', icon: '🏠' },
      { path: '/dashboard', label: 'My Dashboard', icon: '📊' },
      { path: '/analytics', label: 'Executive Intelligence & PDF', icon: '📈' },
    ]
  },
  {
    category: 'RESIDENCE & LIVING',
    items: [
      { path: '/rooms', label: 'Properties & Rooms', icon: '🏢' },
      { path: '/residents', label: 'Resident Directory', icon: '👥' },
      { path: '/payments', label: 'Billing & GST Invoices', icon: '💳' },
      { path: '/food', label: 'Food & Mess Dining', icon: '🍲' },
    ]
  },
  {
    category: 'SERVICES & OPERATIONS',
    items: [
      { path: '/complaints', label: 'Helpdesk & Maintenance', icon: '🛠️' },
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

function Sidebar({ isOpen, onClose, requestCount = 0 }) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <>
      {/* Backdrop overlay for drawer menu */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" onClick={onClose}>
            <div className="sidebar-logo-icon">🏠</div>
            <div>
              <div style={{ lineHeight: 1.1, fontSize: '0.98rem' }}>SmartLiving</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>Shared Living OS</div>
            </div>
          </Link>
          <button className="sidebar-close-btn" onClick={onClose} title="Close Menu">
            ✕
          </button>
        </div>

        {/* Feature Modules Menu List */}
        <div className="sidebar-content">
          {NAV_GROUPS.map((group) => (
            <div key={group.category}>
              <div className="nav-group-title">{group.category}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const showBadge = item.path === '/rooms' && requestCount > 0;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <span className="sidebar-nav-icon">{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {showBadge && (
                        <span style={{
                          background: '#ef4444',
                          color: '#fff',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          minWidth: '18px',
                          height: '18px',
                          borderRadius: '999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 5px',
                          marginLeft: '4px',
                          lineHeight: 1,
                          flexShrink: 0,
                        }}>
                          {requestCount > 99 ? '99+' : requestCount}
                        </span>
                      )}
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
            <Link to="/login" className="btn btn-primary" onClick={onClose} style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem' }}>
              Sign In
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

function TopBar({ onToggleSidebar, isDark, onToggleTheme, requestCount = 0 }) {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const pageMeta = getPageMeta(location.pathname);

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        {/* Triple-Line (Hamburger) Menu Button */}
        <button
          className="hamburger-btn"
          onClick={onToggleSidebar}
          title="Open Features & Modules Menu"
          aria-label="Toggle Features Menu"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        <div className="topbar-page-info">
          <span className="topbar-breadcrumb">{pageMeta.category}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>{pageMeta.icon}</span>
            <span className="topbar-title">{pageMeta.title}</span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Dark / Light Theme Toggle (Sun ☀️ & Moon 🌙) */}
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* Real-time System Pulse */}
        <div className="system-status-indicator">
          <span className="status-dot-pulse" />
          <span>Live Gateway</span>
        </div>

        {/* Booking Requests Notification Bell */}
        {isAuthenticated && requestCount > 0 && (
          <Link
            to="/rooms"
            title="View Booking Requests"
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.38rem 0.75rem',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: '999px',
              color: '#ef4444',
              fontSize: '0.82rem',
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <span>🔔</span>
            <span
              style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.68rem',
                fontWeight: 800,
                minWidth: '18px',
                height: '18px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                lineHeight: 1,
              }}
            >
              {requestCount > 99 ? '99+' : requestCount}
            </span>
          </Link>
        )}

        {/* Dedicated Quick Action SOS Emergency Trigger */}
        <Link to="/emergency" className="topbar-sos-btn">
          <span>🚨</span>
          <span>SOS Panic</span>
        </Link>

        {/* User Account Controls */}
        {isAuthenticated && user ? (
          <div className="topbar-user">
            <div style={{ textAlign: 'right' }}>
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

function AppInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('smart_theme') === 'dark';
  });
  const [requestCount, setRequestCount] = useState(0);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('smart_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('smart_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Fetch booking requests count for badge
  const fetchBadgeCount = async () => {
    if (!isAuthenticated || !user) {
      setRequestCount(0);
      return;
    }
    try {
      const isAdminOrStaff = user.roles?.includes('ROLE_ADMIN') || user.roles?.includes('ROLE_STAFF');
      const isResident = user.roles?.includes('ROLE_RESIDENT');

      if (isAdminOrStaff) {
        const pending = await roomService.getPendingBookingRequests();
        setRequestCount(Array.isArray(pending) ? pending.length : 0);
      } else if (isResident) {
        const mine = await roomService.getMyBookingRequests();
        if (Array.isArray(mine)) {
          const pendingMine = mine.filter(r => r.status === 'PENDING');
          setRequestCount(pendingMine.length);
        } else {
          setRequestCount(0);
        }
      }
    } catch {
      // ignore network errors in polling
    }
  };

  useEffect(() => {
    fetchBadgeCount();

    // Subscribe to cross-tab / cross-component sync
    const unsubscribe = syncHub.subscribe((evt) => {
      if (evt.module === 'ROOMS' || evt.module === 'RESIDENTS') {
        fetchBadgeCount();
      }
    });

    // Polling interval every 30s
    const timer = setInterval(fetchBadgeCount, 30000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [isAuthenticated, user?.email]);

  return (
    <div className="app-shell">
      {/* Slide-out Drawer Sidebar containing all features & modules */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        requestCount={requestCount}
      />

      <div className="main-wrapper">
        {/* Top Bar with Triple-Line button and Sun/Moon theme switcher */}
        <TopBar
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          requestCount={requestCount}
        />

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
            <span>Theme: {isDark ? 'Dark Mode (Active)' : 'Light Mode (Active)'}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
