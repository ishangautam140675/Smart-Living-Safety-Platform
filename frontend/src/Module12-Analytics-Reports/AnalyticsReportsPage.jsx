import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { analyticsService } from './analyticsService';

function MetricCard({ title, value, subtext, icon, trend, color = '#3b82f6', bgLight = '#eff6ff' }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      padding: '1.25rem 1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: color
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', marginTop: '0.25rem' }}>
            {value}
          </div>
        </div>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: bgLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem'
        }}>
          {icon}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
        <span style={{ color: '#4b5563' }}>{subtext}</span>
        {trend && (
          <span style={{ fontWeight: 700, color: trend.startsWith('+') || trend.includes('100') ? '#059669' : '#d97706' }}>
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
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1f2937' }}>{title}</h3>
        {subtitle && <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: '#6b7280' }}>{subtitle}</p>}
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
      <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 420, margin: '0 auto', background: '#fff', borderRadius: 16, padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📊</div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Admin Access Required</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Module 12 Executive Analytics is restricted to community administrators. Please sign in with administrative credentials.
          </p>
          <a href="/login" className="btn btn-primary">Sign In to View Reports</a>
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
    <div className="container" style={{ padding: '2rem 1rem 4rem' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#fff',
        padding: '2rem',
        borderRadius: 16,
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)'
      }}>
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            🏢 Module 12 — Platform Intelligence &amp; Reports
          </div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800 }}>Executive Management Dashboard</h1>
          <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', maxWidth: 650, fontSize: '0.95rem' }}>
            Real-time telemetry and unified cross-module intelligence aggregated across properties, residents, finances, mess, security, and staff operations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={loadData} className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            🔄 Refresh
          </button>
          <button onClick={exportReport} className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            📥 Export JSON
          </button>
          <button onClick={exportPdfReport} className="btn btn-primary" style={{ background: '#dc2626', border: 'none', fontWeight: 700 }}>
            📄 Export PDF Report
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <MetricCard
              title="Occupancy Rate"
              value={`${data.occupancyPercent}%`}
              subtext={`${data.occupiedRooms} occupied / ${data.totalRooms} total rooms`}
              trend={`${data.availableRooms} vacant`}
              icon="🛏️"
              color="#3b82f6"
              bgLight="#eff6ff"
            />
            <MetricCard
              title="Active Residents"
              value={data.activeResidents}
              subtext={`Total registered: ${data.totalResidents}`}
              trend="100% Onboarded"
              icon="👥"
              color="#10b981"
              bgLight="#ecfdf5"
            />
            <MetricCard
              title="Available Units"
              value={data.availableRooms}
              subtext="Ready for new allocations"
              icon="🔑"
              color="#6366f1"
              bgLight="#eef2ff"
            />
          </div>

          {/* Section 2: Finances & Billing */}
          <SectionHeader
            title="2. Financial Health & Rent Collection"
            subtitle="Module 6 — Invoices, Gateways, Ledger & Outstanding Arrears"
            icon="💳"
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <MetricCard
              title="Collection Efficiency"
              value={`${data.collectionRate}%`}
              subtext={`₹${data.totalCollected.toLocaleString()} of ₹${data.totalInvoiced.toLocaleString()}`}
              trend="Target: 95%"
              icon="📈"
              color="#059669"
              bgLight="#d1fae5"
            />
            <MetricCard
              title="Total Revenue Collected"
              value={`₹${data.totalCollected.toLocaleString()}`}
              subtext="Audited payments via bank & gateway"
              icon="💰"
              color="#0284c7"
              bgLight="#e0f2fe"
            />
            <MetricCard
              title="Outstanding Receivables"
              value={`₹${(data.totalInvoiced - data.totalCollected).toLocaleString()}`}
              subtext="Pending / partially paid dues"
              icon="🧾"
              color="#d97706"
              bgLight="#fef3c7"
            />
          </div>

          {/* Section 3: Maintenance & Resident Satisfaction */}
          <SectionHeader
            title="3. Maintenance SLA & Resident Experience"
            subtitle="Modules 4 &amp; 9 — Complaint Resolution & Daily Mess Dining"
            icon="🛠️"
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <MetricCard
              title="SLA Resolution Rate"
              value={`${data.complaintResolutionRate}%`}
              subtext={`${data.resolvedComplaints} solved / ${data.totalComplaints} tickets`}
              trend={data.openComplaints > 0 ? `${data.openComplaints} in progress` : 'Zero backlog'}
              icon="✅"
              color="#8b5cf6"
              bgLight="#f5f3ff"
            />
            <MetricCard
              title="Food &amp; Mess Rating"
              value={data.avgMessRating > 0 ? `${data.avgMessRating} / 5.0` : 'No reviews'}
              subtext={`${data.totalMenuItems} scheduled menu items`}
              trend="Audited Daily"
              icon="🍲"
              color="#f59e0b"
              bgLight="#fffbeb"
            />
            <MetricCard
              title="Open Grievances"
              value={data.openComplaints}
              subtext="Awaiting technician closure"
              icon="⏳"
              color="#ef4444"
              bgLight="#fee2e2"
            />
          </div>

          {/* Section 4: Security, Assets & Safety */}
          <SectionHeader
            title="4. Safety, Physical Security & Asset Audit"
            subtitle="Modules 5, 7, 8, 10 &amp; 11 — SOS Triggers, Guard Rosters, Assets & Visitors"
            icon="🛡️"
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <MetricCard
              title="Emergency SOS Alerts"
              value={data.totalSosAlerts}
              subtext={`${data.unresolvedSos} active emergencies`}
              trend={data.unresolvedSos === 0 ? 'Normal / Secure' : '⚠️ Action Needed'}
              icon="🚨"
              color={data.unresolvedSos > 0 ? '#dc2626' : '#16a34a'}
              bgLight={data.unresolvedSos > 0 ? '#fee2e2' : '#f0fdf4'}
            />
            <MetricCard
              title="Guard Shifts Today"
              value={data.staffShiftsToday}
              subtext={`${data.activeShifts} currently on patrol`}
              trend={`${data.incidentsToday} incidents`}
              icon="👮"
              color="#4f46e5"
              bgLight="#eef2ff"
            />
            <MetricCard
              title="Visitors Expected Today"
              value={data.visitorsToday}
              subtext={`Cumulative: ${data.totalVisitors} gate passes`}
              icon="🎫"
              color="#0d9488"
              bgLight="#f0fdfa"
            />
            <MetricCard
              title="Inventory Health"
              value={data.totalAssets}
              subtext={`${data.damagedAssets} flagged for replacement`}
              trend={data.damagedAssets === 0 ? '100% Operational' : 'Audit Pending'}
              icon="📦"
              color="#d97706"
              bgLight="#fffbeb"
            />
          </div>

          {/* Module Ecosystem Health Checklist */}
          <div style={{ marginTop: '3rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>
              🌐 Platform Architecture &amp; Module Directory
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
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
              ].map(mod => (
                <div key={mod.id} style={{ background: '#fff', padding: '0.85rem 1rem', borderRadius: 10, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: 6 }}>
                    {mod.id}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>{mod.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>● {mod.status}</div>
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
