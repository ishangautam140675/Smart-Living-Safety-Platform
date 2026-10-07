import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('ROLE_RESIDENT');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleFillDemoAdmin = () => {
    setIsRegister(false);
    setEmail('admin@smartliving.local');
    setPassword('Admin@12345');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(fullName, email, password, phone, role);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication error. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container placeholder-page">
      <div className="placeholder-box" style={{ maxWidth: '480px', textAlign: 'left' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isRegister
              ? 'Join Smart Living & Safety Platform'
              : 'Sign in to access your dashboard'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              borderBottom: !isRegister ? '2px solid var(--primary)' : 'none',
              color: !isRegister ? varColor('--primary', '#2563eb') : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              borderBottom: isRegister ? '2px solid var(--primary)' : 'none',
              color: isRegister ? varColor('--primary', '#2563eb') : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #f87171',
            color: '#b91c1c',
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            marginBottom: '1.25rem',
            fontSize: '0.9rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@smartliving.local"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-9876543210"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Account Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={inputStyle}
                >
                  <option value="ROLE_RESIDENT">Resident (Hostel/PG/Apartment)</option>
                  <option value="ROLE_ADMIN">Admin / Property Manager</option>
                  <option value="ROLE_SECURITY">Security / Gate Officer</option>
                  <option value="ROLE_STAFF">Maintenance Staff</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {submitting ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {!isRegister && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--border)', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', width: '100%' }}
            >
              Fill Default Admin Credentials
            </button>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--primary)', fontWeight: 500 }}>
            &larr; Back to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}

function varColor(cssVar, fallback) {
  return `var(${cssVar}, ${fallback})`;
}

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  borderRadius: '0.375rem',
  border: '1px solid var(--border)',
  fontSize: '0.95rem',
  backgroundColor: '#ffffff',
};
