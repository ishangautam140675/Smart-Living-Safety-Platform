import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { paymentService } from './paymentService';
import { residentService } from '../Module3-Resident-Management/residentService';
import { syncHub } from '../utils/syncHub';

export default function PaymentsPage() {
  const { user } = useAuth();

  const isResident = user?.roles?.includes('ROLE_RESIDENT');
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isStaff = user?.roles?.some((r) => ['ROLE_ADMIN', 'ROLE_STAFF'].includes(r));

  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create Invoice Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    residentId: '',
    title: 'Monthly Rent & Maintenance',
    description: 'Includes accommodation, WiFi, electricity up to allowance, and housekeeping',
    amount: '',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billingMonth: 'OCT-2026'
  });
  const [creating, setCreating] = useState(false);

  // Pay Modal
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    paymentMethod: 'UPI',
    notes: 'Direct online payment'
  });
  const [paying, setPaying] = useState(false);

  // Invoice Receipt / Detail Modal
  const [viewInvoice, setViewInvoice] = useState(null);

  const loadData = useCallback(async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    setError('');
    try {
      if (isResident) {
        const data = await paymentService.getMyInvoices().catch(() => []);
        setInvoices(data || []);
      } else {
        const [invData, statsData] = await Promise.all([
          paymentService.searchInvoices(keyword, statusFilter).catch(() => []),
          isAdmin ? paymentService.getSummary().catch(() => null) : null
        ]);
        setInvoices(invData || []);
        if (statsData) setSummary(statsData);
      }
    } catch (err) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user, isResident, isAdmin, keyword, statusFilter]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Instant cross-tab sync listener
  useEffect(() => {
    const unsubscribe = syncHub.subscribe((evt) => {
      if (evt.module === 'PAYMENTS') {
        loadData(false);
      }
    });
    return unsubscribe;
  }, [loadData]);

  // Periodic background sync fallback every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (isAdmin && showCreateModal) {
      residentService.getResidents().then((res) => {
        const list = res.data || res;
        setResidents(list);
        if (list.length > 0 && !createForm.residentId) {
          setCreateForm((f) => ({ ...f, residentId: list[0].id }));
        }
      }).catch(() => {});
    }
  }, [isAdmin, showCreateModal]);

  // Handle Create Invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccessMsg('');
    try {
      const created = await paymentService.createInvoice({
        ...createForm,
        residentId: Number(createForm.residentId),
        amount: Number(createForm.amount)
      });
      setSuccessMsg(`Invoice ${created.invoiceNumber} created successfully for ₹${created.amount}!`);
      setShowCreateModal(false);
      syncHub.emit('PAYMENTS', 'CREATED', { invoiceNumber: created.invoiceNumber });
      loadData();
    } catch (err) {
      setError(err.message || 'Invoice generation failed');
    } finally {
      setCreating(false);
    }
  };

  // Open Payment Modal
  const openPayModal = (inv) => {
    setActiveInvoice(inv);
    setPayForm({
      amount: inv.balanceAmount,
      paymentMethod: 'UPI',
      notes: isResident ? 'Online self payment' : 'Cash/counter received'
    });
  };

  // Handle Payment Submit
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaying(true);
    setError('');
    setSuccessMsg('');
    try {
      const updated = await paymentService.recordPayment(activeInvoice.invoiceNumber, {
        amount: Number(payForm.amount),
        paymentMethod: payForm.paymentMethod,
        notes: payForm.notes
      });
      setSuccessMsg(`Payment of ₹${payForm.amount} recorded! Invoice status is now ${updated.status}.`);
      setActiveInvoice(null);
      if (viewInvoice && viewInvoice.invoiceNumber === updated.invoiceNumber) {
        setViewInvoice(updated);
      }
      syncHub.emit('PAYMENTS', 'PAID', { invoiceNumber: updated.invoiceNumber });
      loadData();
    } catch (err) {
      setError(err.message || 'Payment recording failed');
    } finally {
      setPaying(false);
    }
  };

  // Cancel invoice (marks as CANCELLED)
  const handleCancelInvoice = async (inv) => {
    if (!window.confirm(`Cancel invoice ${inv.invoiceNumber} for ${inv.residentName || 'resident'}?\nThis marks it as CANCELLED (no refund, no deletion).`)) return;
    setError('');
    setSuccessMsg('');
    try {
      await paymentService.cancelInvoice(inv.invoiceNumber);
      setSuccessMsg(`Invoice ${inv.invoiceNumber} has been cancelled.`);
      syncHub.emit('PAYMENTS', 'CANCELLED', { invoiceNumber: inv.invoiceNumber });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to cancel invoice');
    }
  };

  // Permanently delete invoice
  const handleDeleteInvoice = async (inv) => {
    if (!window.confirm(`⚠️ PERMANENTLY DELETE invoice ${inv.invoiceNumber}?\nThis cannot be undone.`)) return;
    setError('');
    setSuccessMsg('');
    try {
      await paymentService.deleteInvoice(inv.invoiceNumber);
      setSuccessMsg(`Invoice ${inv.invoiceNumber} permanently deleted.`);
      syncHub.emit('PAYMENTS', 'DELETED', { invoiceNumber: inv.invoiceNumber });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete invoice');
    }
  };

  // Clear all PAID + CANCELLED invoices from ledger
  const handleClearPaid = async () => {
    if (!window.confirm('Clear ALL paid and cancelled invoices from the ledger?\nThis cannot be undone.')) return;
    setError('');
    setSuccessMsg('');
    try {
      const result = await paymentService.clearPaidInvoices();
      setSuccessMsg(`Cleared ${result.count} paid/cancelled invoice(s) from the ledger.`);
      syncHub.emit('PAYMENTS', 'CLEARED_PAID', { count: result.count });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to clear invoices');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="badge badge-success">✓ PAID</span>;
      case 'PARTIALLY_PAID':
        return <span className="badge badge-warm">PARTIAL</span>;
      case 'PENDING':
        return <span className="badge badge-warning">PENDING</span>;
      case 'OVERDUE':
        return <span className="badge badge-danger">OVERDUE</span>;
      case 'CANCELLED':
        return <span className="badge badge-neutral">CANCELLED</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (!user) {
    return (
      <div className="card" style={{ maxWidth: 580, margin: '3.5rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.6rem' }}>
          Payments &amp; Rent Invoicing Portal
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Please sign in with your Resident, Staff, or Admin account to review invoices, make payments, download receipts, and manage billing accounts.
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
            <span>💳</span> Payments &amp; Rent Invoicing
          </h1>
          <p className="page-subtitle">
            {isResident
              ? 'Review your room bills, rent dues, itemized stay receipts, and pay online.'
              : 'Generate monthly invoices, track collections, record payments, and audit ledger accounts.'}
          </p>
        </div>

        <div className="page-header-actions">
          <button
            className="btn btn-outline"
            onClick={() => loadData(true)}
            title="Refresh payments and invoices"
          >
            🔄 Refresh
          </button>
          {isAdmin && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <span>➕</span> Generate Invoice
              </button>
              <button
                className="btn btn-outline"
                onClick={handleClearPaid}
                style={{ borderColor: 'rgba(184, 58, 45, 0.4)', color: 'var(--danger)' }}
                title="Remove all PAID and CANCELLED invoices from the ledger"
              >
                🧹 Clear Paid
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem', background: 'var(--success-light)', color: 'var(--success)', border: '1px solid rgba(58, 122, 79, 0.3)' }}>
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards for Admin */}
      {isAdmin && summary && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'linear-gradient(90deg, #3a7a4f, #5ca072)' }} />
            <div>
              <div className="kpi-label">Total Collected</div>
              <div className="kpi-value" style={{ color: 'var(--success)' }}>
                ₹{Number(summary.totalCollected || 0).toLocaleString()}
              </div>
            </div>
            <div className="kpi-subtext">
              <span>✓</span> {summary.paidInvoices} settled invoices
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'linear-gradient(90deg, #c27a1e, #e4cba7)' }} />
            <div>
              <div className="kpi-label">Outstanding Dues</div>
              <div className="kpi-value" style={{ color: 'var(--warning)' }}>
                ₹{Number(summary.totalOutstanding || 0).toLocaleString()}
              </div>
            </div>
            <div className="kpi-subtext">
              <span>⏳</span> {summary.pendingInvoices} invoices pending
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'linear-gradient(90deg, #b83a2d, #df7164)' }} />
            <div>
              <div className="kpi-label">Overdue Invoices</div>
              <div className="kpi-value" style={{ color: 'var(--danger)' }}>
                {summary.overdueInvoices}
              </div>
            </div>
            <div className="kpi-subtext">
              <span>⚠️</span> Requires urgent follow-up
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-stripe" />
            <div>
              <div className="kpi-label">Total Invoices</div>
              <div className="kpi-value" style={{ color: 'var(--palette-1)' }}>
                {summary.totalInvoices}
              </div>
            </div>
            <div className="kpi-subtext">
              <span>📋</span> All billing cycles
            </div>
          </div>
        </div>
      )}

      {/* Staff Search Filters */}
      {!isResident && (
        <div className="toolbar-card">
          <div className="search-input-wrapper">
            <span className="search-icon-inside">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by invoice number, resident name, or email..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '160px' }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⏳</div>
            Loading invoices and billing ledger...
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-title">No bills or invoices found</div>
            <div className="empty-state-desc">
              {isResident
                ? 'You currently have no pending dues or generated invoices.'
                : 'No invoice records matched your search query or filters.'}
            </div>
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Bill Details</th>
                {!isResident && <th>Resident &amp; Room</th>}
                <th>Amount</th>
                <th>Paid / Balance</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--palette-1)', fontSize: '0.92rem' }}>
                    {inv.invoiceNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{inv.title}</div>
                    {inv.billingMonth && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Period: {inv.billingMonth}
                      </div>
                    )}
                  </td>
                  {!isResident && (
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.residentName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Room {inv.roomNumber || 'N/A'} {inv.buildingName ? `(${inv.buildingName})` : ''}
                      </div>
                    </td>
                  )}
                  <td style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                    ₹{Number(inv.amount).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.85rem' }}>
                      Paid: ₹{Number(inv.paidAmount).toLocaleString()}
                    </div>
                    <div style={{ color: inv.balanceAmount > 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1px' }}>
                      Due: ₹{Number(inv.balanceAmount).toLocaleString()}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {inv.dueDate}
                  </td>
                  <td>
                    {getStatusBadge(inv.status)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', background: 'linear-gradient(135deg, #3a7a4f, #2e633f)' }}
                          onClick={() => openPayModal(inv)}
                        >
                          Pay
                        </button>
                      )}
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        onClick={() => setViewInvoice(inv)}
                      >
                        Receipt
                      </button>
                      {isAdmin && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', borderColor: 'rgba(194, 122, 30, 0.4)', color: 'var(--warning)' }}
                          onClick={() => handleCancelInvoice(inv)}
                          title="Mark as Cancelled"
                        >
                          ✕ Cancel
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', borderColor: 'rgba(184, 58, 45, 0.35)', color: 'var(--danger)' }}
                          onClick={() => handleDeleteInvoice(inv)}
                          title="Permanently delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Generate Invoice (Admin) */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                📄 Generate Rent / Utility Invoice
              </h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Select Resident *
                </label>
                <select
                  required
                  className="form-control"
                  value={createForm.residentId}
                  onChange={(e) => setCreateForm({ ...createForm, residentId: e.target.value })}
                >
                  <option value="">Select a resident...</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fullName} ({r.email}) - Room {r.bedNumber || 'No bed'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Invoice Title *
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    className="form-control"
                    placeholder="8500"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Billing Month
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="OCT-2026"
                    value={createForm.billingMonth}
                    onChange={(e) => setCreateForm({ ...createForm, billingMonth: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Payment Due Date *
                </label>
                <input
                  type="date"
                  required
                  className="form-control"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Description / Breakdown
                </label>
                <textarea
                  rows="3"
                  className="form-control"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                ℹ️ <em>Food expenses are tracked separately in the Food &amp; Mess dining module.</em>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record / Process Payment */}
      {activeInvoice && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                💳 Pay Invoice: {activeInvoice.invoiceNumber}
              </h2>
              <button className="modal-close-btn" onClick={() => setActiveInvoice(null)}>✕</button>
            </div>

            <div style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border)', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Bill:</span>
                <strong>₹{Number(activeInvoice.amount).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Already Paid:</span>
                <strong style={{ color: 'var(--success)' }}>₹{Number(activeInvoice.paidAmount).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, color: 'var(--danger)' }}>Balance Due:</span>
                <strong style={{ color: 'var(--danger)', fontSize: '1.05rem' }}>₹{Number(activeInvoice.balanceAmount).toLocaleString()}</strong>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Amount to Pay (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={activeInvoice.balanceAmount}
                  step="0.01"
                  className="form-control"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Payment Method *
                </label>
                <select
                  className="form-control"
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="NET_BANKING">Net Banking / IMPS</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="CASH">Cash Deposit</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Reference Notes
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. UPI Ref / Bank Txn ID"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setActiveInvoice(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #3a7a4f, #2e633f)' }} disabled={paying}>
                  {paying ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Receipt / Invoice Ledger */}
      {viewInvoice && (() => {
        const netBase = Math.round(Number(viewInvoice.amount) / 1.18);
        const cgst = Math.round((Number(viewInvoice.amount) - netBase) / 2);
        const sgst = Number(viewInvoice.amount) - netBase - cgst;
        const stayDays = 30; // standard billing cycle month
        const dailyRate = Math.round(netBase / stayDays);

        return (
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '680px', background: 'var(--bg-surface)' }}>
              {/* Hotel / Living Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.6rem' }}>🏨</span>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                      TAX INVOICE &amp; STAY RECEIPT
                    </h2>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Greenwood Student Living &bull; GSTIN: 29AABCS1429B1Z8
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--palette-1)', fontSize: '1.1rem', marginTop: '6px' }}>
                    Receipt #{viewInvoice.invoiceNumber}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {getStatusBadge(viewInvoice.status)}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>Due Date: {viewInvoice.dueDate}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Cycle: {viewInvoice.billingMonth || 'Current Month'}</div>
                </div>
              </div>

              {/* Guest & Room Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', background: 'var(--bg-subtle)', padding: '1.2rem 1.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    GUEST / RESIDENT:
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '3px' }}>
                    {viewInvoice.residentName}
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.84rem' }}>
                    {viewInvoice.residentEmail}
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                    Room: <strong style={{ color: 'var(--text-main)' }}>{viewInvoice.roomNumber || '101'}</strong> &bull; {viewInvoice.buildingName || 'Block A'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    STAY DURATION:
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main)', marginTop: '3px' }}>
                    {stayDays} Days Stay Cycle
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.84rem' }}>
                    Rate: ₹{dailyRate.toLocaleString()} / day
                  </div>
                  <div style={{ color: 'var(--palette-1)', fontWeight: 700, marginTop: '3px', fontSize: '0.82rem' }}>
                    Amenities: Wi-Fi, Food &amp; Housekeeping Incl.
                  </div>
                </div>
              </div>

              {/* Hotel-Style Itemized Bill Breakdown with GST */}
              <div style={{ marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={{ padding: '8px 0' }}>Description</th>
                      <th style={{ padding: '8px 0', textAlign: 'center' }}>SAC Code</th>
                      <th style={{ padding: '8px 0', textAlign: 'right' }}>Taxable Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 0' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Accommodation &amp; Living Services ({stayDays} Days)</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Room #{viewInvoice.roomNumber || '101'}, Maintenance &amp; Electricity</div>
                      </td>
                      <td style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-muted)' }}>9963</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700 }}>₹{netBase.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <td style={{ padding: '8px 0' }}>CGST (Central Goods &amp; Service Tax @ 9%)</td>
                      <td style={{ padding: '8px 0', textAlign: 'center' }}>-</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>₹{cgst.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                      <td style={{ padding: '8px 0' }}>SGST (State Goods &amp; Service Tax @ 9%)</td>
                      <td style={{ padding: '8px 0', textAlign: 'center' }}>-</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>₹{sgst.toLocaleString()}</td>
                    </tr>
                    <tr style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                      <td style={{ padding: '14px 0' }}>TOTAL AMOUNT PAYABLE (INCL. GST)</td>
                      <td style={{ padding: '14px 0', textAlign: 'center' }}>-</td>
                      <td style={{ padding: '14px 0', textAlign: 'right', color: 'var(--palette-1)' }}>
                        ₹{Number(viewInvoice.amount).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Status Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                <div>Paid to Date: <strong style={{ color: 'var(--success)' }}>₹{Number(viewInvoice.paidAmount).toLocaleString()}</strong></div>
                <div>Outstanding Balance: <strong style={{ color: Number(viewInvoice.balanceAmount) > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{Number(viewInvoice.balanceAmount).toLocaleString()}</strong></div>
              </div>

              {/* Transaction History */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.1rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  💳 Payment Audit History ({viewInvoice.transactions?.length || 0})
                </h4>
                {(!viewInvoice.transactions || viewInvoice.transactions.length === 0) ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No payment transactions recorded yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {viewInvoice.transactions.map((t) => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--palette-1)' }}>{t.transactionReference}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>{t.paymentMethod} &bull; {new Date(t.transactionTime).toLocaleString()}</span>
                        </div>
                        <div style={{ fontWeight: 800, color: 'var(--success)' }}>
                          +₹{Number(t.amountPaid).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => window.print()}
                >
                  🖨️ Print Receipt
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setViewInvoice(null)}
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
