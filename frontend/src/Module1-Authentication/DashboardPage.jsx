import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roles = [
    {
      key: 'ROLE_RESIDENT',
      title: 'Resident Portal',
      badge: 'Resident',
      features: ['Room & bed info', 'Rent payments & receipts', 'Submit complaint', 'Leave requests', 'One-Tap SOS alert'],
    },
    {
      key: 'ROLE_ADMIN',
      title: 'Admin & Operations Console',
      badge: 'Admin / Warden',
      features: ['Properties & occupancy overview', 'Fee collection reports', 'Staff workload assignment', 'Emergency alerts oversight'],
    },
    {
      key: 'ROLE_SECURITY',
      title: 'Security & Gate Desk',
      badge: 'Security',
      features: ["Today's visitor log", 'Parcel receipt & delivery', 'Gate pass verification', 'Emergency responder coordination'],
    },
    {
      key: 'ROLE_STAFF',
      title: 'Maintenance & Service Staff',
      badge: 'Staff',
      features: ['Assigned service tasks', 'Priority work tickets', 'Status update (In Progress → Resolved)', 'Work completion proof'],
    },
  ];

  const primaryRole = user?.roles?.[0] || 'ROLE_RESIDENT';

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      {/* User Session Banner */}
      {isAuthenticated && user ? (
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1.75rem',
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Welcome, {user.fullName}</h2>
              {user.roles?.map(r => (
                <span
                  key={r}
                  style={{
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {r.replace('ROLE_', '')}
                </span>
              ))}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Logged in as <strong>{user.email}</strong> &bull; Authenticated via Spring Security JWT
            </p>
          </div>

          <button onClick={handleLogout} className="btn btn-outline">
            Sign Out
          </button>
        </div>
      ) : (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e40af' }}>Guest Preview Mode</h3>
            <p style={{ color: '#3b82f6', fontSize: '0.9rem' }}>
              You are exploring the role portals in preview mode. Sign in to unlock personalized role access.
            </p>
          </div>
          <Link to="/login" className="btn btn-primary">
            Sign In Now
          </Link>
        </div>
      )}

      {/* Role Dashboard Cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Role-Based Access Portals
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Modules are unlocked and customized according to the authenticated user's role:
        </p>
      </div>

      <div className="features-grid">
        {roles.map((r) => {
          const isUserCurrentRole = isAuthenticated && user?.roles?.includes(r.key);

          return (
            <div
              key={r.key}
              className="card"
              style={{
                border: isUserCurrentRole ? '2px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: isUserCurrentRole ? '#ffffff' : '#ffffff',
                position: 'relative',
              }}
            >
              {isUserCurrentRole && (
                <span style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'var(--primary)',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '9999px',
                }}>
                  Active Role
                </span>
              )}

              <h4 className="card-title" style={{ marginTop: '0.25rem' }}>{r.title}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Access Tier: <strong>{r.badge}</strong>
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                {r.features.map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                    <span style={{ color: 'var(--success)' }}>✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
