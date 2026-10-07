import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { complaintService } from './complaintService';

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
  const colors = {
    OPEN:        'background:#fff3cd;color:#856404;border:1px solid #ffc107',
    IN_PROGRESS: 'background:#cfe2ff;color:#084298;border:1px solid #0d6efd',
    RESOLVED:    'background:#d1e7dd;color:#0f5132;border:1px solid #198754',
    CLOSED:      'background:#e2e3e5;color:#41464b;border:1px solid #adb5bd',
    REJECTED:    'background:#f8d7da;color:#842029;border:1px solid #dc3545',
  };
  return (
    <span style={{
      ...Object.fromEntries(
        (colors[status] || 'background:#eee;color:#333').split(';').map(s => s.split(':'))
      ),
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
    }}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const colors = {
    LOW:      '#6c757d',
    MEDIUM:   '#0d6efd',
    HIGH:     '#fd7e14',
    CRITICAL: '#dc3545',
  };
  return (
    <span style={{
      background: colors[priority] || '#aaa',
      color: '#fff',
      padding: '2px 8px',
      borderRadius: 8,
      fontSize: 11,
      fontWeight: 700,
    }}>
      {priority}
    </span>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${color}`,
      borderLeft: `5px solid ${color}`,
      borderRadius: 8,
      padding: '18px 24px',
      flex: '1 1 140px',
      minWidth: 120,
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{label}</div>
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
      <div style={{ padding: '60px 24px', maxWidth: 600, margin: '40px auto', textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛠️</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Complaints &amp; Maintenance Portal</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Please sign in with your Resident, Staff, or Admin account to lodge maintenance tickets, view resolution updates, or manage hostel complaints.
        </p>
        <a href="/login" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, backgroundColor: '#0d6efd', color: '#fff' }}>
          Sign In to Access
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>
        🛠️ Complaints & Maintenance
      </h1>
      <p style={{ color: '#666', marginBottom: 28, fontSize: 14 }}>
        {isResident ? 'Submit and track your maintenance requests.' :
          'Manage all resident complaints and maintenance tickets.'}
      </p>

      {/* ── Alerts ── */}
      {error   && <div style={{ background:'#f8d7da',color:'#842029',padding:'12px 16px',borderRadius:8,marginBottom:16,border:'1px solid #f1aeb5' }}>{error}</div>}
      {success && <div style={{ background:'#d1e7dd',color:'#0f5132',padding:'12px 16px',borderRadius:8,marginBottom:16,border:'1px solid #a3cfbb' }}>{success}</div>}

      {/* ════════════════════════════════════════
          RESIDENT VIEW
      ════════════════════════════════════════ */}
      {isResident && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontSize:18, margin:0, color:'#333' }}>My Complaints ({myComplaints.length})</h2>
            <button
              onClick={() => setShowForm(f => !f)}
              style={{ background:'#0d6efd',color:'#fff',border:'none',padding:'10px 20px',borderRadius:8,cursor:'pointer',fontWeight:600 }}>
              {showForm ? '✕ Cancel' : '+ New Complaint'}
            </button>
          </div>

          {/* Submit form */}
          {showForm && (
            <form onSubmit={handleSubmit} style={{ background:'#f8f9fa',borderRadius:12,padding:24,marginBottom:28,border:'1px solid #dee2e6' }}>
              <h3 style={{ margin:'0 0 20px', color:'#1a1a2e' }}>Submit a Complaint</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div>
                  <label style={{ display:'block',marginBottom:6,fontWeight:600,fontSize:13 }}>Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({...f, category:e.target.value}))}
                    style={{ width:'100%',padding:'9px 12px',borderRadius:6,border:'1px solid #ced4da',fontSize:14 }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block',marginBottom:6,fontWeight:600,fontSize:13 }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({...f, priority:e.target.value}))}
                    style={{ width:'100%',padding:'9px 12px',borderRadius:6,border:'1px solid #ced4da',fontSize:14 }}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block',marginBottom:6,fontWeight:600,fontSize:13 }}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))}
                  placeholder="Brief summary of the issue"
                  required maxLength={150}
                  style={{ width:'100%',padding:'9px 12px',borderRadius:6,border:'1px solid #ced4da',fontSize:14,boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block',marginBottom:6,fontWeight:600,fontSize:13 }}>Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))}
                  placeholder="Describe the problem in detail..."
                  required rows={4} maxLength={2000}
                  style={{ width:'100%',padding:'9px 12px',borderRadius:6,border:'1px solid #ced4da',fontSize:14,boxSizing:'border-box',resize:'vertical' }} />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block',marginBottom:6,fontWeight:600,fontSize:13 }}>Room ID (optional — leave blank for common areas)</label>
                <input type="number" value={form.roomId} onChange={e => setForm(f => ({...f, roomId:e.target.value}))}
                  placeholder="e.g. 1"
                  style={{ width:200,padding:'9px 12px',borderRadius:6,border:'1px solid #ced4da',fontSize:14 }} />
              </div>
              <button type="submit" disabled={submitting}
                style={{ background:'#0d6efd',color:'#fff',border:'none',padding:'10px 28px',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:14 }}>
                {submitting ? 'Submitting…' : 'Submit Complaint'}
              </button>
            </form>
          )}

          {/* My complaints list */}
          {myComplaints.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'#888', background:'#f8f9fa', borderRadius:12, border:'1px dashed #dee2e6' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
              <div style={{ fontSize:16, fontWeight:600 }}>No complaints yet</div>
              <div style={{ fontSize:13, marginTop:6 }}>Click "New Complaint" to submit a maintenance request.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {myComplaints.map(c => (
                <div key={c.id} style={{ background:'#fff', border:'1px solid #dee2e6', borderRadius:10, padding:'16px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:8 }}>
                    <div>
                      <span style={{ fontWeight:700, color:'#1a1a2e', fontSize:15 }}>{c.title}</span>
                      <span style={{ marginLeft:10, color:'#888', fontSize:12 }}>#{c.id}</span>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                  <div style={{ color:'#555', fontSize:13, marginBottom:8 }}>{c.description}</div>
                  <div style={{ display:'flex', gap:20, fontSize:12, color:'#888', flexWrap:'wrap' }}>
                    <span>🏷️ {c.category?.replace('_',' ')}</span>
                    {c.roomNumber && <span>🚪 Room {c.roomNumber}</span>}
                    <span>📅 {fmt(c.createdAt)}</span>
                    {c.assignedStaffName && <span>👷 {c.assignedStaffName}</span>}
                    {c.resolvedAt && <span>✅ Resolved: {fmt(c.resolvedAt)}</span>}
                  </div>
                  {c.resolutionNote && (
                    <div style={{ marginTop:10, padding:'8px 12px', background:'#d1e7dd', borderRadius:6, fontSize:13, color:'#0f5132' }}>
                      <strong>Staff note:</strong> {c.resolutionNote}
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
            <div style={{ display:'flex', flexWrap:'wrap', gap:16, marginBottom:32 }}>
              <KpiCard label="Total"       value={summary.totalComplaints} color="#6c757d" />
              <KpiCard label="Open"        value={summary.open}            color="#ffc107" />
              <KpiCard label="In Progress" value={summary.inProgress}      color="#0d6efd" />
              <KpiCard label="Resolved"    value={summary.resolved}        color="#198754" />
              <KpiCard label="Closed"      value={summary.closed}          color="#adb5bd" />
              <KpiCard label="Rejected"    value={summary.rejected}        color="#dc3545" />
            </div>
          )}

          {/* Search & filter toolbar */}
          <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', flex:1 }}>
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="Search by title, description or resident…"
                style={{ flex:1, minWidth:220, padding:'9px 14px', borderRadius:8, border:'1px solid #ced4da', fontSize:14 }}
              />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ padding:'9px 14px', borderRadius:8, border:'1px solid #ced4da', fontSize:14 }}>
                <option value="">All Statuses</option>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
              <button onClick={loadAdminData}
                style={{ background:'#0d6efd',color:'#fff',border:'none',padding:'9px 20px',borderRadius:8,cursor:'pointer',fontWeight:600 }}>
                🔍 Search
              </button>
            </div>
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
                style={{ background:'#dc2626', color:'#fff', border:'none', padding:'9px 18px', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13 }}>
                🗑️ Clear Completed Tasks
              </button>
            )}
          </div>

          {/* Status-update panel (admin / staff only) */}
          {canManage && selectedComplaint && (
            <div style={{ background:'#fff3cd', border:'1px solid #ffc107', borderRadius:10, padding:20, marginBottom:24 }}>
              <h3 style={{ margin:'0 0 16px', fontSize:16, color:'#856404' }}>
                Update Complaint #{selectedComplaint.id}: <em>{selectedComplaint.title}</em>
              </h3>
              <form onSubmit={handleStatusUpdate} style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, marginBottom:4 }}>New Status *</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)} required
                    style={{ padding:'9px 14px', borderRadius:6, border:'1px solid #ced4da', fontSize:14 }}>
                    <option value="">Select status…</option>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div style={{ flex:1, minWidth:220 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, marginBottom:4 }}>
                    Resolution Note {(newStatus === 'RESOLVED' || newStatus === 'REJECTED') ? '(required)' : '(optional)'}
                  </label>
                  <input value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
                    placeholder="Describe actions taken…"
                    style={{ width:'100%', padding:'9px 12px', borderRadius:6, border:'1px solid #ced4da', fontSize:14, boxSizing:'border-box' }} />
                </div>
                <button type="submit" disabled={updatingStatus}
                  style={{ background:'#198754',color:'#fff',border:'none',padding:'9px 20px',borderRadius:8,cursor:'pointer',fontWeight:600,whiteSpace:'nowrap' }}>
                  {updatingStatus ? 'Saving…' : '✅ Save'}
                </button>
                <button type="button" onClick={() => { setSelectedComplaint(null); setNewStatus(''); setResolutionNote(''); }}
                  style={{ background:'#6c757d',color:'#fff',border:'none',padding:'9px 16px',borderRadius:8,cursor:'pointer',fontWeight:600 }}>
                  Cancel
                </button>
              </form>
            </div>
          )}

          {/* Complaints table */}
          {complaints.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'#888', background:'#f8f9fa', borderRadius:12, border:'1px dashed #dee2e6' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
              <div>No complaints found.</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
                <thead>
                  <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #dee2e6' }}>
                    {['#ID','Category','Title','Resident','Priority','Status','Assigned To','Created','Actions'].map(h => (
                      <th key={h} style={{ padding:'12px 14px', textAlign:'left', fontSize:12, fontWeight:700, color:'#555', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom:'1px solid #f0f0f0', background: i%2===0?'#fff':'#fafbfc' }}>
                      <td style={{ padding:'12px 14px', fontSize:13, color:'#888' }}>#{c.id}</td>
                      <td style={{ padding:'12px 14px', fontSize:13 }}>{c.category?.replace('_',' ')}</td>
                      <td style={{ padding:'12px 14px', fontSize:13, maxWidth:200 }}>
                        <div style={{ fontWeight:600, color:'#1a1a2e' }}>{c.title}</div>
                        {c.roomNumber && <div style={{ fontSize:11, color:'#888' }}>Room {c.roomNumber}</div>}
                      </td>
                      <td style={{ padding:'12px 14px', fontSize:13 }}>
                        <div>{c.residentName}</div>
                        <div style={{ fontSize:11, color:'#888' }}>{c.residentEmail}</div>
                      </td>
                      <td style={{ padding:'12px 14px' }}><PriorityBadge priority={c.priority} /></td>
                      <td style={{ padding:'12px 14px' }}><StatusBadge status={c.status} /></td>
                      <td style={{ padding:'12px 14px', fontSize:13, color:'#555' }}>{c.assignedStaffName || '—'}</td>
                      <td style={{ padding:'12px 14px', fontSize:12, color:'#888', whiteSpace:'nowrap' }}>{fmt(c.createdAt)}</td>
                      <td style={{ padding:'12px 14px' }}>
                        {canManage && (
                          <div style={{ display:'flex', gap:6 }}>
                            <button
                              onClick={() => { setSelectedComplaint(c); setNewStatus(c.status); setResolutionNote(c.resolutionNote || ''); }}
                              style={{ background:'#0d6efd',color:'#fff',border:'none',padding:'5px 10px',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:600 }}>
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
                              style={{ background:'#fee2e2',color:'#dc2626',border:'1px solid #fecaca',padding:'5px 8px',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700 }}>
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
