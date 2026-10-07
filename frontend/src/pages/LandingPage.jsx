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
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1rem 0 3rem' }}>
      {/* Hero Showcase Section */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        borderRadius: '24px',
        padding: '3.5rem 2.5rem',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '2.5rem'
      }}>
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '820px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#93c5fd',
            marginBottom: '1.25rem'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
            Enterprise Shared-Living Operating System &bull; v2.4
          </div>

          <h1 style={{
            fontSize: '2.85rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            margin: '0 0 1rem'
          }}>
            Smart Living, Hostel &amp; <span style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Safety Platform</span>
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: '#94a3b8',
            lineHeight: 1.6,
            margin: '0 0 2rem',
            maxWidth: '680px'
          }}>
            A unified, real-time operating ecosystem for modern student housing, PGs, and shared co-living communities.
            Managing resident services, room bookings, daily mess meals, itemized GST billing, and instant emergency response.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {isAuthenticated && user ? (
              <>
                <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', fontWeight: 700 }}>
                  ⚡ Open My Dashboard
                </Link>
                <Link to="/analytics" className="btn btn-outline" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                  📊 Executive Intelligence
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', fontWeight: 700 }}>
                  🔐 Sign In to Platform
                </Link>
                <Link to="/rooms" className="btn btn-outline" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                  🏢 Explore Rooms &amp; Rates
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Live System Telemetry Status Bar */}
        <div style={{
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: loading ? '#f59e0b' : error ? '#ef4444' : '#10b981',
              boxShadow: loading ? '0 0 8px #f59e0b' : error ? '0 0 8px #ef4444' : '0 0 8px #10b981'
            }} />
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
              Backend Services:{' '}
              {loading ? 'Connecting...' : error ? 'Offline' : `${health?.service || 'Active'} (Port 8080)`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', color: '#94a3b8' }}>
            <span>Security: <strong>RBAC + Spring JWT</strong></span>
            <span>Architecture: <strong>12 Modular Domains</strong></span>
            <button onClick={fetchHealth} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              🔄 Re-check
            </button>
          </div>
        </div>
      </section>

      {/* Quick Access Operational Grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
          Platform Pillars &amp; Resident Services
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Direct access to the 12 interconnected modules powering community operations:
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        {corePillars.map((p, i) => (
          <Link
            key={i}
            to={p.link}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              textDecoration: 'none',
              color: 'inherit',
              position: 'relative'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = '#93c5fd';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.03)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>{p.icon}</span>
                <span style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  {p.tag}
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>
                {p.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                {p.desc}
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem' }}>
              <span>Open Module</span>
              <span>&rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
