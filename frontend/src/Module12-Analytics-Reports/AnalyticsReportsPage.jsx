import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { analyticsService } from './analyticsService';

function MetricCard({ title, value, subtext, icon, trend, stripeColor = 'var(--palette-1)' }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-stripe" style={{ background: stripeColor }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
        <div>
          <div className="kpi-label">{title}</div>
          <div className="kpi-value" style={{ margin: '0.25rem 0' }}>{value}</div>
        </div>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 'var(--radius-md)',
          background: 'var(--palette-4)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.35rem'
        }}>
          {icon}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
        <span className="kpi-subtext" style={{ margin: 0 }}>{subtext}</span>
        {trend && (
          <span style={{ fontWeight: 700, color: trend.startsWith('+') || trend.includes('100') || trend.includes('Normal') ? 'var(--success)' : 'var(--palette-1)' }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon }) {
  return (
    <div style={{ margin: '2rem 0 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>{title}</h3>
        {subtitle && <p style={{ margin: '0.15rem 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export default function AnalyticsReportsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await analyticsService.getAnalytics();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load executive platform analytics. Admin privileges required.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) {
    return (
      <div className="card" style={{ maxWidth: 580, margin: '3.5rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Admin Access Required
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Module 12 Executive Analytics is restricted to community administrators. Please sign in with administrative credentials.
        </p>
        <div>
          <a href="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Sign In to View Reports
          </a>
        </div>
      </div>
    );
  }

  const exportReport = () => {
    if (!data) return;
    const reportJson = JSON.stringify(data, null, 2);
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartLiving_Platform_Report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdfReport = () => {
    window.print();
  };

  return (
    <div>
      {/* Top Banner with Warm Luxury Theme */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #3d2f24 0%, #241c15 100%)',
          color: 'var(--palette-4)',
          padding: '2.25rem 2rem',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          marginBottom: '2rem',
          border: '1px solid rgba(174,140,116,0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div
              style={{
                display: 'inline-block',
                background: 'rgba(228,203,167,0.18)',
                color: 'var(--palette-3)',
                padding: '0.3rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                marginBottom: '0.85rem',
                border: '1px solid rgba(228,203,167,0.3)'
              }}
            >
              🏢 Module 12 — Platform Intelligence &amp; Reports
            </div>
            <h1 style={{ margin: 0, fontSize: '1.95rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Executive Management Dashboard
            </h1>
            <p style={{ margin: '0.6rem 0 0', color: 'var(--palette-2)', maxWidth: 660, fontSize: '0.94rem', lineHeight: 1.6 }}>
              Real-time telemetry and unified cross-module intelligence aggregated across properties, residents, finances, mess, security, and staff operations.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              onClick={loadData}
              className="btn btn-outline"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <span>🔄</span> Refresh
            </button>
            <button
              onClick={exportReport}
              className="btn btn-outline"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}
            >
              <span>📥</span> Export JSON
            </button>
            <button
              onClick={exportPdfReport}
              className="btn btn-primary"
              style={{ fontWeight: 700 }}
            >
              <span>📄</span> Export PDF
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading cross-module intelligence...
        </div>
      )}

      {data && !loading && (
        <>
          {/* Section 1: Core Operations & Occupancy */}
          <SectionHeader
            title="1. Space Utilization & Community Demographics"
            subtitle="Modules 2 &amp; 3 — Properties, Rooms, Beds & Resident Allocations"
            icon="🏠"
          />
          <div className="kpi-grid">
            <MetricCard
              title="Occupancy Rate"
              value={`${data.occupancyPercent}%`}
              subtext={`${data.occupiedRooms} occupied / ${data.totalRooms} total rooms`}
              trend={`${data.availableRooms} vacant`}
              icon="🛏️"
              stripeColor="var(--palette-1)"
            />
            <MetricCard
              title="Active Residents"
              value={data.activeResidents}
              subtext={`Total registered: ${data.totalResidents}`}
              trend="100% Onboarded"
              icon="👥"
              stripeColor="var(--success)"
            />
            <MetricCard
              title="Available Units"
              value={data.availableRooms}
              subtext="Ready for new allocations"
              trend="Available"
              icon="🔑"
              stripeColor="var(--palette-2)"
            />
          </div>

          {/* Section 2: Finances & Billing */}
          <SectionHeader
            title="2. Financial Health & Rent Collection"
            subtitle="Module 6 — Invoices, Gateways, Ledger & Outstanding Arrears"
            icon="💳"
          />
          <div className="kpi-grid">
            <MetricCard
              title="Collection Efficiency"
              value={`${data.collectionRate}%`}
              subtext={`₹${data.totalCollected?.toLocaleString()} of ₹${data.totalInvoiced?.toLocaleString()}`}
              trend="Target: 95%"
              icon="📈"
              stripeColor="var(--success)"
            />
            <MetricCard
              title="Total Revenue Collected"
              value={`₹${data.totalCollected?.toLocaleString()}`}
              subtext="Audited payments via bank & gateway"
              trend="Verified"
              icon="💰"
              stripeColor="var(--palette-1)"
            />
            <MetricCard
              title="Outstanding Receivables"
              value={`₹${(data.totalInvoiced - data.totalCollected)?.toLocaleString()}`}
              subtext="Pending / partially paid dues"
              trend="Pending"
              icon="🧾"
              stripeColor="var(--warning)"
            />
          </div>

          {/* Section 3: Maintenance & Resident Satisfaction */}
          <SectionHeader
            title="3. Maintenance SLA & Resident Experience"
            subtitle="Modules 4 &amp; 9 — Complaint Resolution & Daily Mess Dining"
            icon="🛠️"
          />
          <div className="kpi-grid">
            <MetricCard
              title="SLA Resolution Rate"
              value={`${data.complaintResolutionRate}%`}
              subtext={`${data.resolvedComplaints} solved / ${data.totalComplaints} tickets`}
              trend={data.openComplaints > 0 ? `${data.openComplaints} in progress` : 'Zero backlog'}
              icon="✅"
              stripeColor="var(--palette-2)"
            />
            <MetricCard
              title="Food &amp; Mess Rating"
              value={data.avgMessRating > 0 ? `${data.avgMessRating} / 5.0` : 'No reviews'}
              subtext={`${data.totalMenuItems} scheduled menu items`}
              trend="Audited Daily"
              icon="🍲"
              stripeColor="var(--palette-1)"
            />
            <MetricCard
              title="Open Grievances"
              value={data.openComplaints}
              subtext="Awaiting technician closure"
              trend={data.openComplaints === 0 ? 'Clear' : 'Pending'}
              icon="⏳"
              stripeColor={data.openComplaints > 0 ? 'var(--danger)' : 'var(--success)'}
            />
          </div>

          {/* Section 4: Security, Assets & Safety */}
          <SectionHeader
            title="4. Safety, Physical Security & Asset Audit"
            subtitle="Modules 5, 7, 8, 10 &amp; 11 — SOS Triggers, Guard Rosters, Assets & Visitors"
            icon="🛡️"
          />
          <div className="kpi-grid">
            <MetricCard
              title="Emergency SOS Alerts"
              value={data.totalSosAlerts}
              subtext={`${data.unresolvedSos} active emergencies`}
              trend={data.unresolvedSos === 0 ? 'Normal / Secure' : '⚠️ Action Needed'}
              icon="🚨"
              stripeColor={data.unresolvedSos > 0 ? 'var(--danger)' : 'var(--success)'}
            />
            <MetricCard
              title="Guard Shifts Today"
              value={data.staffShiftsToday}
              subtext={`${data.activeShifts} currently on patrol`}
              trend={`${data.incidentsToday} incidents`}
              icon="👮"
              stripeColor="var(--palette-1)"
            />
            <MetricCard
              title="Visitors Expected Today"
              value={data.visitorsToday}
              subtext={`Cumulative: ${data.totalVisitors} gate passes`}
              trend="Logged"
              icon="🎫"
              stripeColor="var(--palette-2)"
            />
            <MetricCard
              title="Inventory Health"
              value={data.totalAssets}
              subtext={`${data.damagedAssets} flagged for replacement`}
              trend={data.damagedAssets === 0 ? '100% Operational' : 'Audit Pending'}
              icon="📦"
              stripeColor="var(--warning)"
            />
          </div>

          {/* Module Ecosystem Health Checklist */}
          <div className="card" style={{ marginTop: '2.5rem', padding: '1.75rem 2rem' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              🌐 Platform Architecture &amp; Module Directory
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {[
                { id: 'M01', name: 'Authentication & RBAC', status: 'Active (JWT + Spring Security)' },
                { id: 'M02', name: 'Properties, Rooms & Beds', status: 'Active (Auto Bed Allocation)' },
                { id: 'M03', name: 'Resident Management', status: 'Active (Leases & Allocation)' },
                { id: 'M04', name: 'Complaints & Workorders', status: 'Active (Maintenance SLA)' },
                { id: 'M05', name: 'Visitor Passes & QR', status: 'Active (Gate Verification)' },
                { id: 'M06', name: 'Billing, Invoices & Ledger', status: 'Active (Payment Verification)' },
                { id: 'M07', name: 'SOS & Emergency Alerts', status: 'Active (Real-time Broadcast)' },
                { id: 'M08', name: 'Community Notice Board', status: 'Active (Pinned Circulars)' },
                { id: 'M09', name: 'Food & Mess Operations', status: 'Active (Meal Opt-out & Feedback)' },
                { id: 'M10', name: 'Inventory & Asset Audit', status: 'Active (Condition Tracking)' },
                { id: 'M11', name: 'Staff & Guard Shift Roster', status: 'Active (Patrol Checkpoints)' },
                { id: 'M12', name: 'Platform Intelligence & KPIs', status: 'Active (Executive Reporting)' },
              ].map((mod) => (
                <div
                  key={mod.id}
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <span className="badge badge-mocha" style={{ fontWeight: 800 }}>
                    {mod.id}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>{mod.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>● {mod.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
