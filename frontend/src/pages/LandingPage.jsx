import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkBackendHealth } from '../Module1-Authentication/api';
import { useAuth } from '../Module1-Authentication/AuthContext';

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
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

  const corePillars = [
    {
      icon: '🏢',
      title: 'Smart Space & Room Booking',
      desc: 'Seamless bed allocation, room reservations with live occupancy, and automated amenities mapping.',
      link: '/rooms',
      tag: 'Module 02'
    },
    {
      icon: '🍲',
      title: 'Daily Mess Dining & Opt-Out',
      desc: 'View 4-meal daily menus, select dietary preferences, anti-waste meal opt-outs, and rating reviews.',
      link: '/food',
      tag: 'Module 09'
    },
    {
      icon: '💳',
      title: 'Hotel-Grade Billing & GST Invoices',
      desc: 'Itemized rent breakdowns, day-wise stay calculation, SAC-coded GST tax receipts, and payment ledger.',
      link: '/payments',
      tag: 'Module 06'
    },
    {
      icon: '🛠️',
      title: 'Rapid Maintenance Helpdesk',
      desc: 'Raise categorized issues, track SLA progression, and permanently clear completed maintenance tasks.',
      link: '/complaints',
      tag: 'Module 04'
    },
    {
      icon: '🚨',
      title: 'One-Tap SOS & Silent Emergency',
      desc: 'Instant panic triggers, discreet silent alerts, responder assignment, and incident reporting.',
      link: '/emergency',
      tag: 'Module 07'
    },
    {
      icon: '📊',
      title: 'Executive Intelligence & PDF Reports',
      desc: 'Real-time telemetry, collection efficiency, occupancy metrics, and comprehensive printable reports.',
      link: '/analytics',
      tag: 'Module 12'
    }
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.5rem 0 3.5rem' }}>
      {/* Hero Showcase Section */}
      <section style={{
        background: 'linear-gradient(135deg, #241c17 0%, #382a22 50%, #1c1511 100%)',
        borderRadius: '24px',
        padding: '3.75rem 3rem',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 48px -15px rgba(36, 28, 23, 0.55)',
        border: '1px solid rgba(207, 173, 148, 0.2)',
        marginBottom: '3rem'
      }}>
        <div style={{
          position: 'absolute',
          top: '-90px',
          right: '-90px',
          width: '380px',
          height: '380px',
          background: 'radial-gradient(circle, rgba(174, 140, 116, 0.35) 0%, rgba(174, 140, 116, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '840px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(207, 173, 148, 0.14)',
            border: '1px solid rgba(228, 203, 167, 0.3)',
            borderRadius: '999px',
            padding: '5px 16px',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#e4cba7',
            marginBottom: '1.5rem',
            letterSpacing: '0.02em'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ae8c74', boxShadow: '0 0 8px #ae8c74' }} />
            Enterprise Shared-Living Operating System &bull; v2.4
          </div>

          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 0 1.25rem',
            color: '#ffffff'
          }}>
            Smart Living, Hostel &amp; <span style={{
              background: 'linear-gradient(135deg, #fffbea 0%, #e4cba7 40%, #cfad94 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Safety Platform</span>
          </h1>

          <p style={{
            fontSize: '1.12rem',
            color: '#d4c5b9',
            lineHeight: 1.65,
            margin: '0 0 2.25rem',
            maxWidth: '700px'
          }}>
            A unified, real-time operating ecosystem for modern student housing, PGs, and shared co-living communities.
            Managing resident services, room bookings, daily mess meals, itemized GST billing, and instant emergency response.
          </p>

          <div style={{ display: 'flex', gap: '1.15rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {isAuthenticated && user ? (
              <>
                <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 700 }}>
                  ⚡ Open My Dashboard
                </Link>
                <Link to="/analytics" className="btn btn-outline" style={{ padding: '0.85rem 2rem', fontSize: '1rem', background: 'rgba(255,255,255,0.08)', color: '#fffbea', border: '1px solid rgba(228, 203, 167, 0.3)' }}>
                  📊 Executive Intelligence
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 700 }}>
                  🔐 Sign In to Platform
                </Link>
                <Link to="/rooms" className="btn btn-outline" style={{ padding: '0.85rem 2rem', fontSize: '1rem', background: 'rgba(255,255,255,0.08)', color: '#fffbea', border: '1px solid rgba(228, 203, 167, 0.3)' }}>
                  🏢 Explore Rooms &amp; Rates
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Live System Telemetry Status Bar */}
        <div style={{
          marginTop: '2.75rem',
          paddingTop: '1.75rem',
          borderTop: '1px solid rgba(207, 173, 148, 0.16)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          fontSize: '0.86rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: loading ? '#f59e0b' : error ? '#ef4444' : '#10b981',
              boxShadow: loading ? '0 0 10px #f59e0b' : error ? '0 0 10px #ef4444' : '0 0 10px #10b981'
            }} />
            <span style={{ color: '#e8dfd5', fontWeight: 600 }}>
              Backend Gateway:{' '}
              {loading ? 'Connecting...' : error ? 'Offline' : `${health?.service || 'Active'} (Port 8080)`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.75rem', color: '#cfad94', flexWrap: 'wrap', alignItems: 'center' }}>
            <span>Security: <strong>RBAC + Spring JWT</strong></span>
            <span>Architecture: <strong>12 Modular Domains</strong></span>
            <button onClick={fetchHealth} style={{ background: 'none', border: 'none', color: '#e4cba7', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🔄 Re-check
            </button>
          </div>
        </div>
      </section>

      {/* Quick Access Operational Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem', letterSpacing: '-0.025em' }}>
          Platform Pillars &amp; Resident Services
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', margin: 0 }}>
          Direct access to the 12 interconnected modules powering community operations:
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
        gap: '1.75rem',
        marginBottom: '3rem'
      }}>
        {corePillars.map((p, i) => (
          <Link
            key={i}
            to={p.link}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '18px',
              padding: '1.75rem',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              textDecoration: 'none',
              color: 'inherit',
              position: 'relative'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-warm-glow)';
              e.currentTarget.style.borderColor = 'var(--palette-1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '2.2rem' }}>{p.icon}</span>
                <span style={{
                  background: 'var(--bg-subtle)',
                  color: 'var(--palette-1)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  letterSpacing: '0.04em'
                }}>
                  {p.tag}
                </span>
              </div>
              <h3 style={{ fontSize: '1.22rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.65rem', letterSpacing: '-0.02em' }}>
                {p.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                {p.desc}
              </p>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--palette-1)', fontWeight: 700, fontSize: '0.88rem' }}>
              <span>Open Module</span>
              <span>&rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
