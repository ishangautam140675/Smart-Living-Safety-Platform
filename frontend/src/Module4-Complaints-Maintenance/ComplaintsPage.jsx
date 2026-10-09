import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { complaintService } from './complaintService';
import { syncHub } from '../utils/syncHub';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'PLUMBING', 'ELECTRICAL', 'CLEANING', 'FURNITURE', 'WIFI_INTERNET',
  'SECURITY', 'NOISE', 'PEST_CONTROL', 'LAUNDRY', 'FOOD_CANTEEN',
  'LIFT_ELEVATOR', 'PARKING', 'WATER_SUPPLY', 'OTHER',
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const ALL_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

// ─── Small helper components ──────────────────────────────────────────────────

function StatusBadge({ status }) {
  switch (status) {
    case 'OPEN':
      return <span className="badge badge-warning">⏳ OPEN</span>;
    case 'IN_PROGRESS':
      return <span className="badge badge-warm">⚙️ IN PROGRESS</span>;
    case 'RESOLVED':
      return <span className="badge badge-success">✓ RESOLVED</span>;
    case 'CLOSED':
      return <span className="badge badge-neutral">CLOSED</span>;
    case 'REJECTED':
      return <span className="badge badge-danger">REJECTED</span>;
    default:
      return <span className="badge badge-neutral">{status?.replace('_', ' ')}</span>;
  }
}

function PriorityBadge({ priority }) {
  switch (priority) {
    case 'CRITICAL':
      return <span className="badge badge-danger" style={{ fontWeight: 800 }}>⚡ CRITICAL</span>;
    case 'HIGH':
      return <span className="badge badge-warning" style={{ fontWeight: 700 }}>HIGH</span>;
    case 'MEDIUM':
      return <span className="badge badge-warm">MEDIUM</span>;
    case 'LOW':
    default:
      return <span className="badge badge-neutral">LOW</span>;
  }
}

function KpiCard({ label, value, stripeColor = 'var(--palette-1)', valueColor = 'var(--text-main)' }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-stripe" style={{ background: stripeColor }} />
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value" style={{ color: valueColor }}>{value}</div>
      </div>
      <div className="kpi-subtext">
        <span>•</span> Ticket Status
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * ComplaintsPage
 *
 * Renders differently based on role:
 *  - RESIDENT  → Submit-complaint form + "My Complaints" list
 *  - ADMIN / STAFF / SECURITY → Summary KPI cards + searchable / filterable table
 *                               Admin & Staff also get a status-update panel
 */
export default function ComplaintsPage() {
  const { user } = useAuth();

  const isAdmin    = user?.roles?.includes('ROLE_ADMIN');
  const isStaff    = user?.roles?.includes('ROLE_STAFF');
  const isSecurity = user?.roles?.includes('ROLE_SECURITY');
  const isResident = user?.roles?.includes('ROLE_RESIDENT');
  const canManage  = isAdmin || isStaff;
  const canViewAll = isAdmin || isStaff || isSecurity;

  // ── Shared state ────────────────────────────────────────────────────────────
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  // ── Admin / Staff state ──────────────────────────────────────────────────────
  const [summary, setSummary]       = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [keyword, setKeyword]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Status-update panel
  const [newStatus, setNewStatus]       = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ── Resident state ───────────────────────────────────────────────────────────
  const [myComplaints, setMyComplaints] = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: 'OTHER',
    title: '',
    description: '',
    priority: 'MEDIUM',
    roomId: '',
  });

  // ── Data loading ─────────────────────────────────────────────────────────────

  const loadAdminData = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      const [sum, list] = await Promise.all([
        isAdmin ? complaintService.getComplaintSummary().catch(() => null) : Promise.resolve(null),
        complaintService.getComplaints({ keyword, status: statusFilter }).catch(() => []),
      ]);
      setSummary(sum);
      setComplaints(list || []);
    } catch (e) {
      setError(e.message || 'Failed to load complaints');
    }
  }, [user, isAdmin, keyword, statusFilter]);

  const loadMyComplaints = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      const list = await complaintService.getMyComplaints().catch(() => []);
      setMyComplaints(list || []);
    } catch (e) {
      setMyComplaints([]);
    }
  }, [user]);

  useEffect(() => {
    if (canViewAll) loadAdminData();
    if (isResident) loadMyComplaints();
  }, [canViewAll, isResident, loadAdminData, loadMyComplaints]);

  // Instant cross-tab sync listener
  useEffect(() => {
    const unsubscribe = syncHub.subscribe((evt) => {
      if (evt.module === 'COMPLAINTS') {
        if (canViewAll) loadAdminData();
        if (isResident) loadMyComplaints();
      }
    });
    return unsubscribe;
  }, [canViewAll, isResident, loadAdminData, loadMyComplaints]);

  // Periodic background sync fallback every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (canViewAll) loadAdminData();
      if (isResident) loadMyComplaints();
    }, 10000);
    return () => clearInterval(interval);
  }, [canViewAll, isResident, loadAdminData, loadMyComplaints]);

  // ── Submit complaint (resident) ───────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await complaintService.submitComplaint({
        ...form,
        roomId: form.roomId ? Number(form.roomId) : null,
      });
      setSuccess('Your complaint has been submitted successfully!');
      setShowForm(false);
      setForm({ category: 'OTHER', title: '', description: '', priority: 'MEDIUM', roomId: '' });
      syncHub.emit('COMPLAINTS', 'SUBMITTED');
      await loadMyComplaints();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Update status (admin / staff) ─────────────────────────────────────────────

  async function handleStatusUpdate(e) {
    e.preventDefault();
    if (!selectedComplaint) return;
    setError('');
    setSuccess('');
    setUpdatingStatus(true);
    try {
      await complaintService.updateComplaintStatus(selectedComplaint.id, {
        newStatus,
        resolutionNote: resolutionNote || undefined,
      });
      setSuccess(`Complaint #${selectedComplaint.id} updated to ${newStatus}`);
      setSelectedComplaint(null);
      setNewStatus('');
      setResolutionNote('');
      syncHub.emit('COMPLAINTS', 'STATUS_UPDATED', { complaintId: selectedComplaint.id, newStatus });
      await loadAdminData();
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  // ─── UI Helpers ───────────────────────────────────────────────────────────────

  const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="card" style={{ maxWidth: 580, margin: '3.5rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛠️</div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.6rem' }}>
          Complaints &amp; Maintenance Portal
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Please sign in with your Resident, Staff, or Admin account to lodge maintenance tickets, view resolution updates, or manage hostel complaints.
        </p>
        <a href="/login" className="btn btn-primary" style={{ padding: '0.65rem 1.75rem' }}>
          Sign In to Access
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>🛠️</span> Complaints &amp; Maintenance
          </h1>
          <p className="page-subtitle">
            {isResident
              ? 'Submit repair tickets, track ticket resolution, and view maintenance history.'
              : 'Monitor active facility tickets, assign personnel, and record SLA resolutions.'}
          </p>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem', background: 'var(--success-light)', color: 'var(--success)', border: '1px solid rgba(58, 122, 79, 0.3)' }}>
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* ════════════════════════════════════════
          RESIDENT VIEW
      ════════════════════════════════════════ */}
      {isResident && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              My Maintenance Requests ({myComplaints.length})
            </h2>
            <button
              onClick={() => setShowForm((f) => !f)}
              className="btn btn-primary"
            >
              {showForm ? '✕ Close Form' : '➕ Lodge New Complaint'}
            </button>
          </div>

          {/* Submit form */}
          {showForm && (
            <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1.25rem', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 700 }}>
                Lodge a Maintenance Request
              </h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.85rem' }}>
                      Category *
                    </label>
                    <select
                      className="form-control"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.85rem' }}>
                      Priority
                    </label>
                    <select
                      className="form-control"
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.85rem' }}>
                    Title / Summary *
                  </label>
                  <input
                    className="form-control"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Brief description of the problem (e.g. Geyser not heating, Tap leaking)"
                    required
                    maxLength={150}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.85rem' }}>
                    Detailed Description *
                  </label>
                  <textarea
                    className="form-control"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe what happened, exact location in room, and urgency..."
                    required
                    rows={4}
                    maxLength={2000}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ maxWidth: '280px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 700, fontSize: '0.85rem' }}>
                    Room Number / ID (Optional)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.roomId}
                    onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
                    placeholder="e.g. 101 (Leave empty for common areas)"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Submitting…' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* My complaints list */}
          {myComplaints.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No complaints lodged yet</div>
              <div className="empty-state-desc">
                Everything looks quiet and clean. Click "Lodge New Complaint" if anything requires repair or attention.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myComplaints.map((c) => (
                <div key={c.id} className="card" style={{ padding: '1.5rem 1.75rem', marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.65rem' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.05rem' }}>{c.title}</span>
                      <span style={{ marginLeft: '10px', color: 'var(--palette-1)', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700 }}>
                        #{c.id}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                    {c.description}
                  </p>

                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <span>🏷️ {c.category?.replace('_', ' ')}</span>
                    {c.roomNumber && <span>🚪 Room {c.roomNumber}</span>}
                    <span>📅 {fmt(c.createdAt)}</span>
                    {c.assignedStaffName && <span>👷 Responding: {c.assignedStaffName}</span>}
                    {c.resolvedAt && <span style={{ color: 'var(--success)' }}>✅ Resolved: {fmt(c.resolvedAt)}</span>}
                  </div>

                  {c.resolutionNote && (
                    <div style={{ marginTop: '0.85rem', padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
                      <strong style={{ color: 'var(--palette-1)' }}>Staff Resolution Note:</strong> {c.resolutionNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════
          ADMIN / STAFF / SECURITY VIEW
      ════════════════════════════════════════ */}
      {canViewAll && (
        <>
          {/* KPI Summary */}
          {summary && (
            <div className="kpi-grid">
              <KpiCard label="Total Tickets" value={summary.totalComplaints} stripeColor="linear-gradient(90deg, var(--palette-1), var(--palette-2))" />
              <KpiCard label="Open" value={summary.open} stripeColor="linear-gradient(90deg, #c27a1e, #e4cba7)" valueColor="var(--warning)" />
              <KpiCard label="In Progress" value={summary.inProgress} stripeColor="linear-gradient(90deg, var(--palette-1), #8d674f)" valueColor="var(--palette-1)" />
              <KpiCard label="Resolved" value={summary.resolved} stripeColor="linear-gradient(90deg, #3a7a4f, #5ca072)" valueColor="var(--success)" />
              <KpiCard label="Closed" value={summary.closed} stripeColor="linear-gradient(90deg, #736357, #9e8e82)" valueColor="var(--text-muted)" />
              <KpiCard label="Rejected" value={summary.rejected} stripeColor="linear-gradient(90deg, #b83a2d, #df7164)" valueColor="var(--danger)" />
            </div>
          )}

          {/* Search & filter toolbar */}
          <div className="toolbar-card">
            <div className="search-input-wrapper">
              <span className="search-icon-inside">🔍</span>
              <input
                className="form-control"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by ticket title, description, or resident name…"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ minWidth: '150px' }}
              >
                <option value="">All Statuses</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <button onClick={loadAdminData} className="btn btn-outline">
                🔄 Filter
              </button>
              {canManage && (
                <button
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to permanently clear all completed/resolved and closed maintenance tasks?')) return;
                    try {
                      const res = await complaintService.clearCompletedComplaints();
                      setSuccess(`Cleared ${res.count || 0} completed tasks permanently.`);
                      await loadAdminData();
                    } catch (e) {
                      setError(e.message);
                    }
                  }}
                  className="btn btn-outline"
                  style={{ borderColor: 'rgba(184, 58, 45, 0.4)', color: 'var(--danger)' }}
                >
                  🗑️ Clear Resolved
                </button>
              )}
            </div>
          </div>

          {/* Status-update panel (admin / staff only) */}
          {canManage && selectedComplaint && (
            <div className="card" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--palette-2)', padding: '1.75rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Update Complaint #{selectedComplaint.id}: <em>{selectedComplaint.title}</em>
                </h3>
                <button
                  className="btn btn-outline"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  onClick={() => { setSelectedComplaint(null); setNewStatus(''); setResolutionNote(''); }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleStatusUpdate} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ minWidth: '180px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    New Status *
                  </label>
                  <select
                    className="form-control"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  >
                    <option value="">Select status…</option>
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: '240px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Resolution Note {(newStatus === 'RESOLVED' || newStatus === 'REJECTED') ? '(required)' : '(optional)'}
                  </label>
                  <input
                    className="form-control"
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Describe maintenance actions taken…"
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" disabled={updatingStatus} className="btn btn-primary">
                    {updatingStatus ? 'Saving…' : '✅ Save Update'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => { setSelectedComplaint(null); setNewStatus(''); setResolutionNote(''); }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Complaints table */}
          <div className="table-wrapper">
            {complaints.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No complaints found</div>
                <div className="empty-state-desc">No tickets matched your query or filter criteria.</div>
              </div>
            ) : (
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>#ID</th>
                    <th>Category</th>
                    <th>Title</th>
                    <th>Resident</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--palette-1)' }}>
                        #{c.id}
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.category?.replace('_', ' ')}</td>
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{c.title}</div>
                        {c.roomNumber && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Room {c.roomNumber}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.residentName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.residentEmail}</div>
                      </td>
                      <td><PriorityBadge priority={c.priority} /></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {c.assignedStaffName || '—'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {fmt(c.createdAt)}
                      </td>
                      <td>
                        {canManage && (
                          <div style={{ display: 'flex', gap: '0.45rem' }}>
                            <button
                              onClick={() => { setSelectedComplaint(c); setNewStatus(c.status); setResolutionNote(c.resolutionNote || ''); }}
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                            >
                              Update
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm(`Permanently delete complaint #${c.id}?`)) return;
                                try {
                                  await complaintService.deleteComplaint(c.id);
                                  setSuccess(`Deleted complaint #${c.id}`);
                                  await loadAdminData();
                                } catch (e) {
                                  setError(e.message);
                                }
                              }}
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', borderColor: 'rgba(184, 58, 45, 0.35)', color: 'var(--danger)' }}
                              title="Delete permanently"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
