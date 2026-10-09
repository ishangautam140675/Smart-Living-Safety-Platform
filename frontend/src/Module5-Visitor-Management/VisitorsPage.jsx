import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { visitorService } from './visitorService';
import { syncHub } from '../utils/syncHub';

export default function VisitorsPage() {
  const { user, isAuthenticated } = useAuth();

  const isResident = user?.roles?.includes('ROLE_RESIDENT');
  const isSecurityOrAdmin = user?.roles?.some((r) =>
    ['ROLE_ADMIN', 'ROLE_SECURITY', 'ROLE_STAFF'].includes(r)
  );

  const [passes, setPasses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter state
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Quick Pass Code Scanner / Lookup
  const [scanCode, setScanCode] = useState('');
  const [scannedPass, setScannedPass] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);

  // New Pass Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    visitorName: '',
    visitorPhone: '',
    purpose: '',
    expectedDate: new Date().toISOString().split('T')[0],
    expectedTime: '14:00',
    vehicleNumber: '',
    idProofType: '',
    idProofNumber: '',
    hostNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Gate check-in modal/details
  const [activeCheckInPass, setActiveCheckInPass] = useState(null);
  const [checkInForm, setCheckInForm] = useState({
    vehicleNumber: '',
    idProofType: 'Aadhar Card',
    idProofNumber: '',
    securityNotes: ''
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      if (isResident) {
        const data = await visitorService.getMyPasses().catch(() => []);
        setPasses(data || []);
      } else {
        const [data, stats] = await Promise.all([
          visitorService.searchPasses(keyword, statusFilter).catch(() => []),
          visitorService.getSummary().catch(() => null)
        ]);
        setPasses(data || []);
        if (stats) setSummary(stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to load visitor data');
    } finally {
      setLoading(false);
    }
  }, [user, isResident, keyword, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Instant cross-tab sync listener
  useEffect(() => {
    const unsubscribe = syncHub.subscribe((evt) => {
      if (evt.module === 'VISITORS') {
        loadData();
      }
    });
    return unsubscribe;
  }, [loadData]);

  // Auto-refresh fallback every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle Quick Scan / Lookup
  const handleScanLookup = async (e) => {
    e?.preventDefault();
    if (!scanCode.trim()) return;
    setScanLoading(true);
    setError('');
    setScannedPass(null);
    try {
      const pass = await visitorService.getPassByCode(scanCode.trim());
      setScannedPass(pass);
    } catch (err) {
      setError(err.message || 'Pass not found');
    } finally {
      setScanLoading(false);
    }
  };

  // Submit New Pass
  const handleCreatePass = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const created = await visitorService.createPass({
        ...form,
        expectedTime: form.expectedTime ? `${form.expectedTime}:00` : null
      });
      setSuccessMsg(`Visitor pass ${created.passCode} generated successfully!`);
      setShowModal(false);
      setForm({
        visitorName: '',
        visitorPhone: '',
        purpose: '',
        expectedDate: new Date().toISOString().split('T')[0],
        expectedTime: '14:00',
        vehicleNumber: '',
        idProofType: '',
        idProofNumber: '',
        hostNotes: ''
      });
      loadData();
      syncHub.emit('VISITORS', 'CREATED', { passCode: created.passCode });
    } catch (err) {
      setError(err.message || 'Failed to generate pass');
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Check-In
  const handleCheckIn = async (passCode) => {
    setError('');
    setSuccessMsg('');
    try {
      const updated = await visitorService.checkIn(passCode, checkInForm);
      setSuccessMsg(`Visitor ${updated.visitorName} successfully CHECKED IN at gate!`);
      setActiveCheckInPass(null);
      if (scannedPass && scannedPass.passCode === passCode) {
        setScannedPass(updated);
      }
      syncHub.emit('VISITORS', 'CHECKED_IN', { passCode });
      loadData();
    } catch (err) {
      setError(err.message || 'Check-in failed');
    }
  };

  // Execute Check-Out
  const handleCheckOut = async (passCode) => {
    if (!window.confirm(`Confirm check-out for visitor pass ${passCode}?`)) return;
    setError('');
    setSuccessMsg('');
    try {
      const updated = await visitorService.checkOut(passCode, { securityNotes: 'Checked out at main gate' });
      setSuccessMsg(`Visitor ${updated.visitorName} successfully CHECKED OUT!`);
      if (scannedPass && scannedPass.passCode === passCode) {
        setScannedPass(updated);
      }
      syncHub.emit('VISITORS', 'CHECKED_OUT', { passCode });
      loadData();
    } catch (err) {
      setError(err.message || 'Check-out failed');
    }
  };

  // Cancel visitor pass (marks as EXPIRED)
  const handleCancelPass = async (pass) => {
    if (!window.confirm(`Cancel visitor pass ${pass.passCode} for "${pass.visitorName}"?\nThis marks it as expired.`)) return;
    setError('');
    setSuccessMsg('');
    try {
      await visitorService.cancelPass(pass.passCode);
      setSuccessMsg(`Visitor pass ${pass.passCode} cancelled.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to cancel pass');
    }
  };

  // Permanently delete a visitor pass (Admin only)
  const handleDeletePass = async (pass) => {
    if (!window.confirm(`⚠️ Permanently DELETE pass ${pass.passCode} for "${pass.visitorName}"?\nThis cannot be undone.`)) return;
    setError('');
    setSuccessMsg('');
    try {
      await visitorService.deletePass(pass.passCode);
      setSuccessMsg(`Visitor pass ${pass.passCode} permanently deleted.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete pass');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':       return <span className="badge badge-success">APPROVED</span>;
      case 'CHECKED_IN':     return <span className="badge badge-mocha">INSIDE</span>;
      case 'CHECKED_OUT':    return <span className="badge badge-neutral">CHECKED OUT</span>;
      case 'PENDING_APPROVAL': return <span className="badge badge-warning">PENDING</span>;
      case 'REJECTED':       return <span className="badge badge-danger">REJECTED</span>;
      default:               return <span className="badge">{status}</span>;
    }
  };

  if (!user) {
    return (
      <div className="card" style={{ maxWidth: 580, margin: '3.5rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: 52, marginBottom: '1rem' }}>🚪</div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Visitor &amp; Gate Pass Management
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Please sign in with your Resident, Security, or Admin account to generate visitor passes, verify gate entries, and manage visitor logs.
        </p>
        <a href="/login" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
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
          <h1 className="page-title">🚪 Visitor &amp; Gate Pass</h1>
          <p className="page-subtitle">
            {isResident
              ? 'Pre-approve entry passes for your friends, family, and deliveries'
              : 'Real-time gate pass verification, security check-in, and visitor directory'}
          </p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-outline"
            onClick={() => loadData()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Refresh visitor passes"
          >
            🔄 Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>➕</span> New Visitor Pass
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          <span>⚠️</span><span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="alert" style={{ marginBottom: '1.25rem', background: 'var(--success-light)', color: 'var(--success)', border: '1px solid rgba(58,122,79,0.3)', display: 'flex', gap: '0.5rem', alignItems: 'center', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
          <span>✅</span><span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards (Admin/Security) */}
      {isSecurityOrAdmin && summary && (
        <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--palette-1)' }} />
            <div className="kpi-label">CURRENTLY INSIDE</div>
            <div className="kpi-value" style={{ color: 'var(--palette-1)' }}>{summary.activeInside}</div>
            <div className="kpi-subtext">Active checked-in visitors</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--success)' }} />
            <div className="kpi-label">EXPECTED TODAY</div>
            <div className="kpi-value" style={{ color: 'var(--success)' }}>{summary.expectedToday}</div>
            <div className="kpi-subtext">Scheduled arrivals</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--palette-2)' }} />
            <div className="kpi-label">CHECKED OUT TODAY</div>
            <div className="kpi-value" style={{ color: 'var(--palette-2)' }}>{summary.checkedOut}</div>
            <div className="kpi-subtext">Completed visits</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--text-muted)' }} />
            <div className="kpi-label">TOTAL PASSES</div>
            <div className="kpi-value">{summary.totalPasses}</div>
            <div className="kpi-subtext">All time records</div>
          </div>
        </div>
      )}

      {/* Security Gate Scanner Bar */}
      {isSecurityOrAdmin && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔍 Fast Gate Pass Verification &amp; Check-In Scanner
          </h3>
          <form onSubmit={handleScanLookup} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: '240px' }}>
              <span className="search-icon-inside">🔎</span>
              <input
                type="text"
                className="form-control"
                placeholder="Enter or scan pass code (e.g. VP-E7EE9BB9)..."
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={scanLoading}>
              {scanLoading ? 'Verifying...' : 'Verify Pass'}
            </button>
            {scannedPass && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setScannedPass(null); setScanCode(''); }}
              >
                Clear
              </button>
            )}
          </form>

          {/* Scanned Pass Spotlight Card */}
          {scannedPass && (
            <div style={{ marginTop: '1.25rem', padding: '1.25rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-main)', border: '2px solid var(--palette-1)', boxShadow: 'var(--shadow-warm-glow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', color: 'var(--palette-1)', letterSpacing: '0.04em' }}>
                    {scannedPass.passCode}
                  </span>
                  {getStatusBadge(scannedPass.status)}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {scannedPass.status === 'APPROVED' && (
                    <button
                      className="btn btn-primary"
                      style={{ background: 'var(--success)', border: 'none' }}
                      onClick={() => setActiveCheckInPass(scannedPass)}
                    >
                      ✅ Check-In Visitor
                    </button>
                  )}
                  {scannedPass.status === 'CHECKED_IN' && (
                    <button
                      className="btn btn-outline"
                      onClick={() => handleCheckOut(scannedPass.passCode)}
                    >
                      🚪 Check-Out Visitor
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <div><span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Visitor:</span> {scannedPass.visitorName} ({scannedPass.visitorPhone})</div>
                <div><span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Host:</span> {scannedPass.residentName} (Room {scannedPass.roomNumber || 'N/A'})</div>
                <div><span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Purpose:</span> {scannedPass.purpose}</div>
                <div><span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Expected:</span> {scannedPass.expectedDate} {scannedPass.expectedTime || ''}</div>
                {scannedPass.vehicleNumber && <div><span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Vehicle:</span> {scannedPass.vehicleNumber}</div>}
                {scannedPass.checkInTime && <div><span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Entry Time:</span> {new Date(scannedPass.checkInTime).toLocaleTimeString()}</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Filters */}
      {isSecurityOrAdmin && (
        <div className="toolbar-card" style={{ marginBottom: '1.5rem' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '220px' }}>
            <span className="search-icon-inside">🔎</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by visitor, phone, passcode or resident..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: '180px', width: 'auto' }}
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">Approved (Upcoming)</option>
            <option value="CHECKED_IN">Inside Premises</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      )}

      {/* Visitor Passes Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: '0.75rem' }}>⏳</div>
            Loading passes...
          </div>
        ) : passes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚪</div>
            <div className="empty-state-title">No visitor passes found</div>
            <div className="empty-state-desc">Click <strong>"New Visitor Pass"</strong> to pre-approve a visitor.</div>
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Pass Code</th>
                <th>Visitor Details</th>
                <th>Host Resident</th>
                <th>Purpose</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Timestamps</th>
                {isSecurityOrAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {passes.map((pass) => (
                <tr key={pass.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--palette-1)', fontSize: '0.9rem', letterSpacing: '0.03em' }}>
                      {pass.passCode}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pass.visitorName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pass.visitorPhone}</div>
                    {pass.vehicleNumber && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>🚗 {pass.vehicleNumber}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pass.residentName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Room: {pass.roomNumber || 'N/A'} {pass.buildingName ? `(${pass.buildingName})` : ''}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{pass.purpose}</td>
                  <td>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{pass.expectedDate}</div>
                    {pass.expectedTime && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pass.expectedTime}</div>
                    )}
                  </td>
                  <td>{getStatusBadge(pass.status)}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {pass.checkInTime && (
                      <div>🟢 In: {new Date(pass.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    )}
                    {pass.checkOutTime && (
                      <div>🔴 Out: {new Date(pass.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    )}
                    {!pass.checkInTime && <div>Created {new Date(pass.createdAt).toLocaleDateString()}</div>}
                  </td>
                  {isSecurityOrAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {pass.status === 'APPROVED' && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--success)', borderColor: 'rgba(58,122,79,0.4)' }}
                            onClick={() => setActiveCheckInPass(pass)}
                          >
                            Check-In
                          </button>
                        )}
                        {pass.status === 'CHECKED_IN' && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                            onClick={() => handleCheckOut(pass.passCode)}
                          >
                            Check-Out
                          </button>
                        )}
                        {pass.status !== 'CHECKED_IN' && pass.status !== 'CHECKED_OUT' && pass.status !== 'EXPIRED' && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--warning)', borderColor: 'rgba(176,120,30,0.4)' }}
                            onClick={() => handleCancelPass(pass)}
                            title="Cancel / expire this pass"
                          >
                            ✕
                          </button>
                        )}
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(184,58,45,0.35)' }}
                          onClick={() => handleDeletePass(pass)}
                          title="Permanently delete pass record"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create Visitor Pass */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🎫 Pre-Approve Visitor Gate Pass</h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreatePass} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Ramesh Verma"
                  value={form.visitorName}
                  onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Visitor Phone *</label>
                  <input
                    type="tel"
                    required
                    className="form-control"
                    placeholder="+91 9876543210"
                    value={form.visitorPhone}
                    onChange={(e) => setForm({ ...form, visitorPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Vehicle No. (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="DL-01-AB-1234"
                    value={form.vehicleNumber}
                    onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Purpose of Visit *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. College study group / Family visit / Delivery"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Expected Date *</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={form.expectedDate}
                    onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Expected Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={form.expectedTime}
                    onChange={(e) => setForm({ ...form, expectedTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Host / Security Notes</label>
                <textarea
                  rows="2"
                  className="form-control"
                  placeholder="Special instructions for guard or guest..."
                  value={form.hostNotes}
                  onChange={(e) => setForm({ ...form, hostNotes: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Generating...' : 'Generate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gate Check-In Extra Verification */}
      {activeCheckInPass && (
        <div className="modal-overlay" onClick={() => setActiveCheckInPass(null)}>
          <div className="modal-card" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🛡️ Gate Entry Verification</h2>
              <button className="modal-close-btn" onClick={() => setActiveCheckInPass(null)}>✕</button>
            </div>

            <div style={{ padding: '0.25rem 0 1rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: 'var(--palette-1)', marginBottom: '0.3rem' }}>
                {activeCheckInPass.passCode}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Visitor: <strong style={{ color: 'var(--text-main)' }}>{activeCheckInPass.visitorName}</strong> visiting resident <strong style={{ color: 'var(--text-main)' }}>{activeCheckInPass.residentName}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>ID Proof Type</label>
                <select
                  className="form-control"
                  value={checkInForm.idProofType}
                  onChange={(e) => setCheckInForm({ ...checkInForm, idProofType: e.target.value })}
                >
                  <option value="Aadhar Card">Aadhar Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Passport">Passport</option>
                  <option value="College/Company ID">College/Company ID</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>ID Proof Number (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Last 4 digits or ID number..."
                  value={checkInForm.idProofNumber}
                  onChange={(e) => setCheckInForm({ ...checkInForm, idProofNumber: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Gate / Security Notes</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Verified physically, visitor wearing mask"
                  value={checkInForm.securityNotes}
                  onChange={(e) => setCheckInForm({ ...checkInForm, securityNotes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setActiveCheckInPass(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: 'var(--success)', border: 'none' }}
                  onClick={() => handleCheckIn(activeCheckInPass.passCode)}
                >
                  ✅ Confirm Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
