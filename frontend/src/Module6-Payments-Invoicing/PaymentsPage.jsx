import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { paymentService } from './paymentService';
import { residentService } from '../Module3-Resident-Management/residentService';

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

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
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
      setLoading(false);
    }
  }, [user, isResident, isAdmin, keyword, statusFilter]);

  useEffect(() => {
    loadData();
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
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to clear invoices');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="badge badge-success" style={{ backgroundColor: '#10b981', color: '#fff' }}>PAID</span>;
      case 'PARTIALLY_PAID':
        return <span className="badge badge-primary" style={{ backgroundColor: '#0284c7', color: '#fff' }}>PARTIAL</span>;
      case 'PENDING':
        return <span className="badge badge-warning" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>PENDING</span>;
      case 'OVERDUE':
        return <span className="badge badge-danger" style={{ backgroundColor: '#ef4444', color: '#fff' }}>OVERDUE</span>;
      case 'CANCELLED':
        return <span className="badge badge-neutral" style={{ backgroundColor: '#64748b', color: '#fff' }}>CANCELLED</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '60px 24px', maxWidth: 600, margin: '40px auto', textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Payments &amp; Rent Invoicing Portal</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Please sign in with your Resident, Staff, or Admin account to review invoices, make payments, download receipts, and manage billing accounts.
        </p>
        <a href="/login" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, backgroundColor: '#0d6efd', color: '#fff' }}>
          Sign In to Access
        </a>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            💳 Payments &amp; Rent Invoicing
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)' }}>
            {isResident
              ? 'Review your room bills, rent dues, transaction receipts, and pay online'
              : 'Generate monthly invoices, track collections, record payments, and audit ledger'}
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>➕</span> Generate Invoice
            </button>
            <button
              className="btn btn-outline"
              onClick={handleClearPaid}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#ef4444', color: '#ef4444' }}
              title="Remove all PAID and CANCELLED invoices from the ledger"
            >
              🧹 Clear Paid
            </button>
          </div>
        )}
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

      {/* KPI Cards for Admin */}
      {isAdmin && summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL COLLECTED</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', margin: '0.25rem 0' }}>
              ₹{Number(summary.totalCollected || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{summary.paidInvoices} invoices settled</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>OUTSTANDING DUES</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', margin: '0.25rem 0' }}>
              ₹{Number(summary.totalOutstanding || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{summary.pendingInvoices} invoices pending</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>OVERDUE INVOICES</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', margin: '0.25rem 0' }}>
              {summary.overdueInvoices}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Requires urgent notice</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #6366f1' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL INVOICES</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6366f1', margin: '0.25rem 0' }}>
              {summary.totalInvoices}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All billing cycles</div>
          </div>
        </div>
      )}

      {/* Staff Search Filters */}
      {!isResident && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by invoice number, resident name, or email..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ flex: 1, minWidth: '240px', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      )}

      {/* Invoices Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No bills or invoices found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Invoice #</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Bill Details</th>
                  {!isResident && <th style={{ padding: '0.75rem 1rem' }}>Resident &amp; Room</th>}
                  <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Paid / Balance</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Due Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{inv.title}</div>
                      {inv.billingMonth && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Period: {inv.billingMonth}</div>
                      )}
                    </td>
                    {!isResident && (
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600 }}>{inv.residentName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Room: {inv.roomNumber || 'N/A'} {inv.buildingName ? `(${inv.buildingName})` : ''}
                        </div>
                      </td>
                    )}
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                      ₹{Number(inv.amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ color: '#10b981', fontWeight: 600 }}>Paid: ₹{Number(inv.paidAmount).toLocaleString()}</div>
                      <div style={{ color: inv.balanceAmount > 0 ? '#ef4444' : '#64748b', fontSize: '0.8rem' }}>
                        Due: ₹{Number(inv.balanceAmount).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                      {inv.dueDate}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {getStatusBadge(inv.status)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', backgroundColor: '#10b981', border: 'none' }}
                            onClick={() => openPayModal(inv)}
                          >
                            Pay
                          </button>
                        )}
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                          onClick={() => setViewInvoice(inv)}
                        >
                          Receipt
                        </button>
                        {isAdmin && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', borderColor: '#f59e0b', color: '#f59e0b' }}
                            onClick={() => handleCancelInvoice(inv)}
                            title="Mark as Cancelled"
                          >
                            ✕ Cancel
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', borderColor: '#ef4444', color: '#ef4444' }}
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
          </div>
        )}
      </div>

      {/* Modal: Generate Invoice (Admin) */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem' }}>
              📄 Generate Rent / Utility Invoice
            </h2>

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Select Resident *</label>
                <select
                  required
                  value={createForm.residentId}
                  onChange={(e) => setCreateForm({ ...createForm, residentId: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
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
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Invoice Title *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="8500"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Billing Month</label>
                  <input
                    type="text"
                    placeholder="OCT-2026"
                    value={createForm.billingMonth}
                    onChange={(e) => setCreateForm({ ...createForm, billingMonth: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Payment Due Date *</label>
                <input
                  type="date"
                  required
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Description / Breakdown</label>
                <textarea
                  rows="2"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              💳 Pay Invoice: {activeInvoice.invoiceNumber}
            </h2>
            <div style={{ padding: '0.75rem', borderRadius: '6px', background: '#f8fafc', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <div>Total Bill: <strong>₹{Number(activeInvoice.amount).toLocaleString()}</strong></div>
              <div>Already Paid: <strong style={{ color: '#10b981' }}>₹{Number(activeInvoice.paidAmount).toLocaleString()}</strong></div>
              <div style={{ marginTop: '0.25rem', color: '#ef4444', fontWeight: 700 }}>
                Balance Dues: ₹{Number(activeInvoice.balanceAmount).toLocaleString()}
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Amount to Pay (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={activeInvoice.balanceAmount}
                  step="0.01"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Payment Method *</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
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
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Reference Notes</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Receipt No."
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setActiveInvoice(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10b981', border: 'none' }} disabled={paying}>
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
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }}>
            <div style={{ backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #cbd5e1' }}>
              
              {/* Hotel / Living Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🏨</span>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>TAX INVOICE &amp; STAY RECEIPT</h2>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    Greenwood Student Living &bull; GSTIN: 29AABCS1429B1Z8
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb', fontSize: '1.05rem', marginTop: '6px' }}>
                    Receipt #{viewInvoice.invoiceNumber}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {getStatusBadge(viewInvoice.status)}
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>Due Date: {viewInvoice.dueDate}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Cycle: {viewInvoice.billingMonth || 'Current Month'}</div>
                </div>
              </div>

              {/* Guest & Room Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>GUEST / RESIDENT:</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginTop: '2px' }}>{viewInvoice.residentName}</div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>{viewInvoice.residentEmail}</div>
                  <div style={{ color: '#64748b', marginTop: '2px' }}>Room: <strong>{viewInvoice.roomNumber || '101'}</strong> &bull; {viewInvoice.buildingName || 'Block A'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>STAY DURATION:</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginTop: '2px' }}>{stayDays} Days Stay Cycle</div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>Rate: ₹{dailyRate.toLocaleString()} / day</div>
                  <div style={{ color: '#059669', fontWeight: 700, marginTop: '2px' }}>Amenities: Wi-Fi, Food &amp; Housekeeping Incl.</div>
                </div>
              </div>

              {/* Hotel-Style Itemized Bill Breakdown with GST */}
              <div style={{ marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 0' }}>Description</th>
                      <th style={{ padding: '8px 0', textAlign: 'center' }}>SAC Code</th>
                      <th style={{ padding: '8px 0', textAlign: 'right' }}>Taxable Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 0' }}>
                        <div style={{ fontWeight: 600 }}>Accommodation &amp; Living Services ({stayDays} Days)</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Room #{viewInvoice.roomNumber || '101'}, Maintenance &amp; Electricity</div>
                      </td>
                      <td style={{ padding: '10px 0', textAlign: 'center', color: '#64748b' }}>9963</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600 }}>₹{netBase.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                      <td style={{ padding: '8px 0' }}>CGST (Central Goods &amp; Service Tax @ 9%)</td>
                      <td style={{ padding: '8px 0', textAlign: 'center' }}>-</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>₹{cgst.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569' }}>
                      <td style={{ padding: '8px 0' }}>SGST (State Goods &amp; Service Tax @ 9%)</td>
                      <td style={{ padding: '8px 0', textAlign: 'center' }}>-</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>₹{sgst.toLocaleString()}</td>
                    </tr>
                    <tr style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                      <td style={{ padding: '12px 0' }}>TOTAL AMOUNT PAYABLE (INCL. GST)</td>
                      <td style={{ padding: '12px 0', textAlign: 'center' }}>-</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', color: '#2563eb' }}>
                        ₹{Number(viewInvoice.amount).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Status Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div>Paid to Date: <strong style={{ color: '#16a34a' }}>₹{Number(viewInvoice.paidAmount).toLocaleString()}</strong></div>
                <div>Outstanding Balance: <strong style={{ color: Number(viewInvoice.balanceAmount) > 0 ? '#dc2626' : '#16a34a' }}>₹{Number(viewInvoice.balanceAmount).toLocaleString()}</strong></div>
              </div>

              {/* Transaction History */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#475569', textTransform: 'uppercase' }}>
                  💳 Payment Audit History ({viewInvoice.transactions?.length || 0})
                </h4>
                {(!viewInvoice.transactions || viewInvoice.transactions.length === 0) ? (
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', margin: 0 }}>No payment transactions completed yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {viewInvoice.transactions.map((t) => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{t.transactionReference}</span>
                          <span style={{ color: '#64748b', marginLeft: '8px' }}>{t.paymentMethod} &bull; {new Date(t.transactionTime).toLocaleString()}</span>
                        </div>
                        <div style={{ fontWeight: 800, color: '#16a34a' }}>
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
                  style={{ fontSize: '0.85rem' }}
                >
                  🖨️ Print Receipt
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setViewInvoice(null)}
                  style={{ fontSize: '0.85rem' }}
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
