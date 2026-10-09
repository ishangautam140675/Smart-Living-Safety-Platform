import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { roomService } from '../Module2-Property-And-Rooms/roomService';

export default function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [hasNoBooking, setHasNoBooking] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.roles?.includes('ROLE_RESIDENT')) {
      roomService.getMyBookingRequests().then(reqs => {
         const hasApprovedOrPending = reqs.some(r => r.status === 'APPROVED' || r.status === 'PENDING');
         if (!hasApprovedOrPending) {
            setHasNoBooking(true);
         }
      }).catch(err => console.error(err));
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roles = [
    {
      key: 'ROLE_RESIDENT',
      title: 'Resident Portal',
      badge: 'Resident Member',
      icon: '🏠',
      desc: 'Self-service suite for students & shared-living residents.',
      features: [
        'Room allocation & bed details',
        'Hotel-style itemized GST rent receipts',
        'Daily 4-meal mess menu & anti-waste opt-out',
        'Submit & track categorized complaints',
        'One-Tap & Silent SOS emergency triggers'
      ],
      quickLink: '/rooms',
      quickLabel: 'View Room & Bed'
    },
    {
      key: 'ROLE_ADMIN',
      title: 'Admin Operations Console',
      badge: 'Super Admin / Warden',
      icon: '⚡',
      desc: 'Complete oversight across property infrastructure and financial health.',
      features: [
        'Property, building & room management',
        'Resident onboarding & bed mapping',
        'Real-time rent collection & dues audit',
        'Permanent clear of completed maintenance tasks',
        'Executive Intelligence & PDF Report generation'
      ],
      quickLink: '/analytics',
      quickLabel: 'Open Executive Intelligence'
    },
    {
      key: 'ROLE_SECURITY',
      title: 'Security Command Desk',
      badge: 'Campus Security',
      icon: '🛡️',
      desc: 'Perimeter access control and emergency rapid response.',
      features: [
        'Live visitor registration & QR pass check-in',
        'Gate access history & active visitors log',
        'Emergency SOS dispatch & responder assignment',
        'Harassment & incident reporting documentation'
      ],
      quickLink: '/visitors',
      quickLabel: 'Visitor Gate Pass Desk'
    },
    {
      key: 'ROLE_STAFF',
      title: 'Facility & Maintenance Staff',
      badge: 'Operations Staff',
      icon: '👷',
      desc: 'Workorder ticketing, maintenance assignments and guard duty rosters.',
      features: [
        'Assigned maintenance workorder queue',
        'Status updates (In Progress → Resolved → Closed)',
        'Staff & Guard duty shift scheduling',
        'Patrol checkpoint verification & incident flags'
      ],
      quickLink: '/complaints',
      quickLabel: 'Maintenance Workorder Queue'
    },
  ];

  const primaryRole = user?.roles?.[0] || 'ROLE_RESIDENT';

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1rem 0 3rem' }}>
      {hasNoBooking && (
        <div style={{ padding: '1rem 1.5rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', marginBottom: '1.5rem', color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: '1.1rem' }}>⚠️ Action Required</strong>
            <div style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>You haven't requested a room yet. Please go to Rooms to request one.</div>
          </div>
          <Link to="/rooms" className="btn btn-primary" style={{ background: '#d97706', border: 'none' }}>Go to Rooms</Link>
        </div>
      )}

      {/* User Welcome Banner */}
      {isAuthenticated && user ? (
        <div style={{
          background: 'linear-gradient(135deg, #241c17 0%, #382a22 50%, #1c1511 100%)',
          borderRadius: '22px',
          padding: '2.25rem 2.75rem',
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.75rem',
          boxShadow: '0 16px 36px -8px rgba(36, 28, 23, 0.45)',
          border: '1px solid rgba(207, 173, 148, 0.2)',
          color: '#ffffff'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2rem' }}>👋</span>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.025em' }}>
                Welcome back, {user.fullName}
              </h2>
              {user.roles?.map(r => (
                <span
                  key={r}
                  style={{
                    backgroundColor: 'rgba(207, 173, 148, 0.16)',
                    color: '#e4cba7',
                    border: '1px solid rgba(228, 203, 167, 0.35)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em'
                  }}
                >
                  {r.replace('ROLE_', '')}
                </span>
              ))}
            </div>
            <p style={{ color: '#cfad94', fontSize: '0.94rem', margin: 0, lineHeight: 1.5 }}>
              Account: <strong style={{ color: '#fffbea' }}>{user.email}</strong> &bull; Authenticated via Spring Security JWT &bull; Active Scope: <strong style={{ color: '#fffbea' }}>{primaryRole.replace('ROLE_', '')}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <Link to="/analytics" className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.08)', color: '#fffbea', border: '1px solid rgba(228, 203, 167, 0.3)' }}>
              📊 Executive Reports
            </Link>
            <button onClick={handleLogout} className="btn" style={{ background: 'var(--danger)', color: '#ffffff', border: 'none', padding: '0.62rem 1.25rem', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          padding: '2rem 2.25rem',
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>
              Guest Role Preview Mode
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', margin: 0 }}>
              You are exploring the role portals in preview mode. Sign in with administrative or resident credentials to access personal dashboards.
            </p>
          </div>
          <Link to="/login" className="btn btn-primary" style={{ fontWeight: 700, padding: '0.75rem 1.75rem' }}>
            Sign In Now &rarr;
          </Link>
        </div>
      )}

      {/* Role Dashboard Cards */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.45rem', letterSpacing: '-0.025em' }}>
          Role-Based Access Control Portals
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', margin: 0 }}>
          Modules are configured and secured according to authenticated permission scopes:
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '1.75rem'
      }}>
        {roles.map((r) => {
          const isUserCurrentRole = isAuthenticated && user?.roles?.includes(r.key);

          return (
            <div
              key={r.key}
              style={{
                background: 'var(--bg-surface)',
                borderRadius: '18px',
                padding: '2rem 1.85rem',
                border: isUserCurrentRole ? '2px solid var(--palette-1)' : '1px solid var(--border)',
                boxShadow: isUserCurrentRole ? 'var(--shadow-warm-glow)' : 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2.2rem' }}>{r.icon}</span>
                  {isUserCurrentRole ? (
                    <span style={{
                      background: 'linear-gradient(135deg, var(--palette-1) 0%, #8c664d 100%)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '999px',
                      letterSpacing: '0.04em',
                      boxShadow: '0 2px 8px rgba(174, 140, 116, 0.35)'
                    }}>
                      Current Role
                    </span>
                  ) : (
                    <span style={{
                      background: 'var(--bg-subtle)',
                      color: 'var(--palette-1)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      letterSpacing: '0.03em'
                    }}>
                      {r.badge}
                    </span>
                  )}
                </div>

                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.45rem', letterSpacing: '-0.02em' }}>
                  {r.title}
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  {r.desc}
                </p>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.15rem', marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--palette-1)', textTransform: 'uppercase', marginBottom: '0.65rem', letterSpacing: '0.06em' }}>
                    Core Capabilities
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                    {r.features.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: 'var(--text-main)' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '0.9rem' }}>✓</span>
                        <span style={{ lineHeight: 1.45 }}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                to={r.quickLink}
                className={isUserCurrentRole ? 'btn btn-primary' : 'btn btn-outline'}
                style={{
                  width: '100%',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                {r.quickLabel} &rarr;
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
