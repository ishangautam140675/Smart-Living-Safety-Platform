import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkBackendHealth } from '../Module1-Authentication/api';

export default function LandingPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = () => {
    setLoading(true);
    setError(null);
    checkBackendHealth()
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Unable to connect to backend');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div>
      <section className="hero container">
        <div className="hero-tag">Version 0 &bull; Project Foundation</div>
        <h1 className="hero-title">
          Smart Living &amp; <span>Safety Platform</span>
        </h1>
        <p className="hero-desc">
          A unified, secure platform for shared-living environments—managing resident services,
          operations, visitors, payments, and rapid-response emergency workflows.
        </p>

        <div className="hero-actions">
          <Link to="/login" className="btn btn-primary">
            Sign In to Platform
          </Link>
          <Link to="/dashboard" className="btn btn-outline">
            View Dashboards
          </Link>
        </div>

        {/* Backend Health Check Card */}
        <div className="health-card">
          <div className="health-status">
            <span
              className={`status-dot ${
                loading ? 'loading' : error ? 'offline' : 'online'
              }`}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                Backend API Status:{' '}
                {loading ? 'Checking...' : error ? 'Offline / Disconnected' : `${health?.status || 'Online'}`}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {loading
                  ? 'Querying /api/health...'
                  : error
                  ? `Error: ${error} (Start backend on port 8080)`
                  : `Service: ${health?.service} | Ver: ${health?.version}`}
              </div>
            </div>
          </div>
          <button onClick={fetchHealth} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            Refresh
          </button>
        </div>

        {/* Core Pillars */}
        <div className="features-grid">
          <div className="card">
            <h3 className="card-title">🏢 Operations &amp; Living</h3>
            <p className="card-desc">
              Properties, buildings, rooms, and bed allocations with transparent resident onboarding and maintenance.
            </p>
          </div>
          <div className="card">
            <h3 className="card-title">🛡️ Safety &amp; Emergency</h3>
            <p className="card-desc">
              One-tap SOS, silent alerts, responder assignment, escalation tracking, and audit-safe incident documentation.
            </p>
          </div>
          <div className="card">
            <h3 className="card-title">🔐 Role-Based Access</h3>
            <p className="card-desc">
              Secure domain-driven architecture protecting Resident, Admin, Security, and Staff operations.
            </p>
          </div>
          <div className="card">
            <h3 className="card-title">⚙️ Modular Monolith</h3>
            <p className="card-desc">
              Spring Boot 3.4 REST APIs + MySQL JPA backend paired with a modern responsive React interface.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
