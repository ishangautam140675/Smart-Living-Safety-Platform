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
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '20px',
          padding: '2rem 2.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
          color: '#ffffff'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.8rem' }}>👋</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
                Welcome back, {user.fullName}
              </h2>
              {user.roles?.map(r => (
                <span
                  key={r}
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.25)',
                    color: '#93c5fd',
                    border: '1px solid rgba(147, 197, 253, 0.3)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {r.replace('ROLE_', '')}
                </span>
              ))}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: 0 }}>
              Account: <strong>{user.email}</strong> &bull; Authenticated via Spring Security JWT &bull; Active Role: <strong>{primaryRole.replace('ROLE_', '')}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/analytics" className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              📊 Executive Reports
            </Link>
            <button onClick={handleLogout} className="btn" style={{ background: '#dc2626', color: '#fff', border: 'none' }}>
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e40af', margin: '0 0 0.25rem' }}>
              Guest Role Preview Mode
            </h3>
            <p style={{ color: '#3b82f6', fontSize: '0.92rem', margin: 0 }}>
              You are exploring the role portals in preview mode. Sign in with administrative or resident credentials to access personal dashboards.
            </p>
          </div>
          <Link to="/login" className="btn btn-primary" style={{ fontWeight: 700 }}>
            Sign In Now &rarr;
          </Link>
        </div>
      )}

      {/* Role Dashboard Cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>
          Role-Based Access Control Portals
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
          Modules are configured and secured according to authenticated permission scopes:
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem'
      }}>
        {roles.map((r) => {
          const isUserCurrentRole = isAuthenticated && user?.roles?.includes(r.key);

          return (
            <div
              key={r.key}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '1.75rem',
                border: isUserCurrentRole ? '2px solid #2563eb' : '1px solid #e2e8f0',
                boxShadow: isUserCurrentRole ? '0 10px 25px -5px rgba(37, 99, 235, 0.15)' : '0 4px 6px -1px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '2rem' }}>{r.icon}</span>
                  {isUserCurrentRole ? (
                    <span style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '20px'
                    }}>
                      Current Role
                    </span>
                  ) : (
                    <span style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {r.badge}
                    </span>
                  )}
                </div>

                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>
                  {r.title}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                  {r.desc}
                </p>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Core Capabilities
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.84rem' }}>
                    {r.features.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#334155' }}>
                        <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                to={r.quickLink}
                className="btn btn-outline"
                style={{
                  width: '100%',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderColor: isUserCurrentRole ? '#2563eb' : '#cbd5e1',
                  color: isUserCurrentRole ? '#2563eb' : '#1e293b',
                  background: isUserCurrentRole ? '#eff6ff' : '#ffffff'
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
