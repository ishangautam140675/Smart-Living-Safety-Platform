import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { visitorService } from './visitorService';

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
      loadData();
    } catch (err) {
      setError(err.message || 'Check-out failed');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-success" style={{ backgroundColor: '#10b981', color: '#fff' }}>APPROVED</span>;
      case 'CHECKED_IN':
        return <span className="badge badge-primary" style={{ backgroundColor: '#2563eb', color: '#fff' }}>INSIDE PREMISES</span>;
      case 'CHECKED_OUT':
        return <span className="badge badge-neutral" style={{ backgroundColor: '#64748b', color: '#fff' }}>CHECKED OUT</span>;
      case 'PENDING_APPROVAL':
        return <span className="badge badge-warning" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>PENDING</span>;
      case 'REJECTED':
        return <span className="badge badge-danger" style={{ backgroundColor: '#ef4444', color: '#fff' }}>REJECTED</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '60px 24px', maxWidth: 600, margin: '40px auto', textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚪</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Visitor &amp; Gate Pass Management</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Please sign in with your Resident, Security, or Admin account to generate visitor passes, verify gate entries, and manage visitor logs.
        </p>
        <a href="/login" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, backgroundColor: '#0d6efd', color: '#fff' }}>
          Sign In to Access
        </a>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            🚪 Visitor &amp; Gate Pass Management
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)' }}>
            {isResident
              ? 'Pre-approve entry passes for your friends, family, and deliveries'
              : 'Real-time gate pass verification, security check-in, and visitor directory'}
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>➕</span> New Visitor Pass
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b' }}>
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#166534' }}>
          ✅ {successMsg}
        </div>
      )}

      {/* KPI Cards (for Admin/Security) */}
      {isSecurityOrAdmin && summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENTLY INSIDE</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb', margin: '0.25rem 0' }}>{summary.activeInside}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active checked-in visitors</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>EXPECTED TODAY</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', margin: '0.25rem 0' }}>{summary.expectedToday}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scheduled arrivals</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #64748b' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>CHECKED OUT TODAY</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#64748b', margin: '0.25rem 0' }}>{summary.checkedOut}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completed visits</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366f1' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL PASSES</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6366f1', margin: '0.25rem 0' }}>{summary.totalPasses}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All time records</div>
          </div>
        </div>
      )}

      {/* Security Gate Scanner Bar (for Security/Admin) */}
      {isSecurityOrAdmin && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem', color: '#1e293b' }}>
            🔍 Fast Gate Pass Verification &amp; Check-In Scanner
          </h3>
          <form onSubmit={handleScanLookup} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Enter or scan pass code (e.g. VP-E7EE9BB9)..."
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              style={{ flex: 1, minWidth: '240px', padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
            />
            <button type="submit" className="btn btn-primary" disabled={scanLoading} style={{ padding: '0.6rem 1.5rem' }}>
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
            <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '8px', background: '#fff', border: '2px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
                    {scannedPass.passCode}
                  </span>
                  <span style={{ marginLeft: '0.75rem' }}>{getStatusBadge(scannedPass.status)}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {scannedPass.status === 'APPROVED' && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 1rem', backgroundColor: '#10b981', border: 'none' }}
                      onClick={() => setActiveCheckInPass(scannedPass)}
                    >
                      ✅ Check-In Visitor
                    </button>
                  )}
                  {scannedPass.status === 'CHECKED_IN' && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 1rem', backgroundColor: '#64748b', border: 'none' }}
                      onClick={() => handleCheckOut(scannedPass.passCode)}
                    >
                      🚪 Check-Out Visitor
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div><strong>Visitor:</strong> {scannedPass.visitorName} ({scannedPass.visitorPhone})</div>
                <div><strong>Host Resident:</strong> {scannedPass.residentName} (Room {scannedPass.roomNumber || 'N/A'})</div>
                <div><strong>Purpose:</strong> {scannedPass.purpose}</div>
                <div><strong>Expected:</strong> {scannedPass.expectedDate} {scannedPass.expectedTime || ''}</div>
                {scannedPass.vehicleNumber && <div><strong>Vehicle:</strong> {scannedPass.vehicleNumber}</div>}
                {scannedPass.checkInTime && <div><strong>Entry Time:</strong> {new Date(scannedPass.checkInTime).toLocaleTimeString()}</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Filters */}
      {isSecurityOrAdmin && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by visitor, phone, passcode or resident..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ flex: 1, minWidth: '220px', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
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
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading passes...</div>
        ) : passes.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No visitor passes found. Click <strong>"New Visitor Pass"</strong> to pre-approve a visitor.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Pass Code</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Visitor Details</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Host Resident</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Purpose</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Scheduled</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Timestamps</th>
                  {isSecurityOrAdmin && <th style={{ padding: '0.75rem 1rem' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {passes.map((pass) => (
                  <tr key={pass.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                      {pass.passCode}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{pass.visitorName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{pass.visitorPhone}</div>
                      {pass.vehicleNumber && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>🚗 {pass.vehicleNumber}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{pass.residentName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Room: {pass.roomNumber || 'N/A'} {pass.buildingName ? `(${pass.buildingName})` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{pass.purpose}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div>{pass.expectedDate}</div>
                      {pass.expectedTime && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{pass.expectedTime}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{getStatusBadge(pass.status)}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>
                      {pass.checkInTime && (
                        <div>🟢 In: {new Date(pass.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      )}
                      {pass.checkOutTime && (
                        <div>🔴 Out: {new Date(pass.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      )}
                      {!pass.checkInTime && <div>Created {new Date(pass.createdAt).toLocaleDateString()}</div>}
                    </td>
                    {isSecurityOrAdmin && (
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {pass.status === 'APPROVED' && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#10b981', borderColor: '#10b981' }}
                            onClick={() => setActiveCheckInPass(pass)}
                          >
                            Check-In
                          </button>
                        )}
                        {pass.status === 'CHECKED_IN' && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#64748b', borderColor: '#64748b' }}
                            onClick={() => handleCheckOut(pass.passCode)}
                          >
                            Check-Out
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Visitor Pass */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem' }}>
              🎫 Pre-Approve Visitor Gate Pass
            </h2>

            <form onSubmit={handleCreatePass} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Verma"
                  value={form.visitorName}
                  onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Visitor Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={form.visitorPhone}
                    onChange={(e) => setForm({ ...form, visitorPhone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Vehicle No. (optional)</label>
                  <input
                    type="text"
                    placeholder="DL-01-AB-1234"
                    value={form.vehicleNumber}
                    onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Purpose of Visit *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. College study group / Family visit / Delivery"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Expected Date *</label>
                  <input
                    type="date"
                    required
                    value={form.expectedDate}
                    onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Expected Time</label>
                  <input
                    type="time"
                    value={form.expectedTime}
                    onChange={(e) => setForm({ ...form, expectedTime: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Host / Security Notes</label>
                <textarea
                  rows="2"
                  placeholder="Special instructions for guard or guest..."
                  value={form.hostNotes}
                  onChange={(e) => setForm({ ...form, hostNotes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Generating...' : 'Generate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gate Check-In Extra Verification */}
      {activeCheckInPass && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              🛡️ Gate Entry Verification: {activeCheckInPass.passCode}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem' }}>
              Visitor: <strong>{activeCheckInPass.visitorName}</strong> visiting resident <strong>{activeCheckInPass.residentName}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>ID Proof Type</label>
                <select
                  value={checkInForm.idProofType}
                  onChange={(e) => setCheckInForm({ ...checkInForm, idProofType: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="Aadhar Card">Aadhar Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Passport">Passport</option>
                  <option value="College/Company ID">College/Company ID</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>ID Proof Number (optional)</label>
                <input
                  type="text"
                  placeholder="Last 4 digits or ID number..."
                  value={checkInForm.idProofNumber}
                  onChange={(e) => setCheckInForm({ ...checkInForm, idProofNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Gate / Security Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Verified physically, visitor wearing mask"
                  value={checkInForm.securityNotes}
                  onChange={(e) => setCheckInForm({ ...checkInForm, securityNotes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveCheckInPass(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#10b981', border: 'none' }}
                  onClick={() => handleCheckIn(activeCheckInPass.passCode)}
                >
                  Confirm Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
