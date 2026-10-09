import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { inventoryService } from './inventoryService';
import { roomService } from '../Module2-Property-And-Rooms/roomService';

const CATEGORIES = [
  'APPLIANCE',
  'ELECTRONICS',
  'FURNITURE',
  'BEDDING',
  'PLUMBING_FIXTURE',
  'SAFETY_EQUIPMENT',
  'OTHER'
];

const CONDITIONS = [
  'FUNCTIONAL',
  'UNDER_REPAIR',
  'DAMAGED',
  'REPLACED',
  'DECOMMISSIONED'
];

export default function InventoryPage() {
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isStaffOrAdmin = user?.roles?.some((r) => ['ROLE_ADMIN', 'ROLE_STAFF'].includes(r));
  const isResident = user?.roles?.includes('ROLE_RESIDENT');

  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');

  // Add / Edit Asset Modal
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [assetForm, setAssetForm] = useState({
    assetTag: '',
    name: '',
    category: 'APPLIANCE',
    condition: 'FUNCTIONAL',
    roomId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    warrantyExpiry: '',
    cost: '',
    notes: ''
  });
  const [savingAsset, setSavingAsset] = useState(false);

  // Audit Condition Modal
  const [auditAsset, setAuditAsset] = useState(null);
  const [auditForm, setAuditForm] = useState({
    newCondition: 'UNDER_REPAIR',
    remarks: ''
  });
  const [submittingAudit, setSubmittingAudit] = useState(false);

  // Audit History Modal
  const [viewHistoryAsset, setViewHistoryAsset] = useState(null);
  const [auditHistory, setAuditHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [assetList, stats, roomList] = await Promise.all([
        inventoryService.searchAssets({
          keyword,
          category: categoryFilter,
          condition: conditionFilter
        }).catch(() => []),
        isStaffOrAdmin ? inventoryService.getSummary().catch(() => null) : null,
        roomService.getRooms().catch(() => [])
      ]);
      setAssets(assetList || []);
      if (stats) setSummary(stats);
      if (roomList) setRooms(roomList);
    } catch (err) {
      setError(err.message || 'Failed to load inventory assets');
    } finally {
      setLoading(false);
    }
  }, [user, keyword, categoryFilter, conditionFilter, isStaffOrAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic background refresh every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 20000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAssetId(null);
    setAssetForm({
      assetTag: 'AST-' + Math.floor(1000 + Math.random() * 9000),
      name: '',
      category: 'APPLIANCE',
      condition: 'FUNCTIONAL',
      roomId: rooms.length > 0 ? rooms[0].id : '',
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyExpiry: '',
      cost: '',
      notes: ''
    });
    setShowAssetModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (a) => {
    setEditingAssetId(a.id);
    setAssetForm({
      assetTag: a.assetTag,
      name: a.name,
      category: a.category,
      condition: a.condition,
      roomId: a.roomId || '',
      purchaseDate: a.purchaseDate || '',
      warrantyExpiry: a.warrantyExpiry || '',
      cost: a.cost || '',
      notes: a.notes || ''
    });
    setShowAssetModal(true);
  };

  // Handle Save Asset
  const handleSaveAsset = async (e) => {
    e.preventDefault();
    setSavingAsset(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        ...assetForm,
        roomId: assetForm.roomId ? Number(assetForm.roomId) : null,
        cost: assetForm.cost ? Number(assetForm.cost) : null,
        warrantyExpiry: assetForm.warrantyExpiry || null
      };

      if (editingAssetId) {
        await inventoryService.updateAsset(editingAssetId, payload);
        setSuccessMsg(`Asset ${payload.assetTag} updated successfully!`);
      } else {
        await inventoryService.createAsset(payload);
        setSuccessMsg(`Asset ${payload.assetTag} registered successfully!`);
      }
      setShowAssetModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save asset');
    } finally {
      setSavingAsset(false);
    }
  };

  // Handle Submit Condition Audit
  const handleAuditSubmit = async (e) => {
    e.preventDefault();
    if (!auditAsset) return;
    setSubmittingAudit(true);
    setError('');
    setSuccessMsg('');
    try {
      await inventoryService.auditCondition(auditAsset.id, auditForm);
      setSuccessMsg(`Asset ${auditAsset.assetTag} condition updated to ${auditForm.newCondition}!`);
      setAuditAsset(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Audit failed');
    } finally {
      setSubmittingAudit(false);
    }
  };

  // View Audit History
  const handleViewHistory = async (a) => {
    setViewHistoryAsset(a);
    setLoadingHistory(true);
    try {
      const history = await inventoryService.getAuditHistory(a.id);
      setAuditHistory(history);
    } catch (err) {
      setAuditHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Delete Asset permanently
  const handleDeleteAsset = async (a) => {
    if (!window.confirm(`⚠️ Permanently DELETE asset [${a.assetTag}] "${a.name}"?\nThis removes its audit history too.`)) return;
    setError('');
    setSuccessMsg('');
    try {
      await inventoryService.deleteAsset(a.id);
      setSuccessMsg(`Asset ${a.assetTag} (${a.name}) permanently deleted.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete asset');
    }
  };

  const getConditionBadge = (cond) => {
    switch (cond) {
      case 'FUNCTIONAL':
        return <span className="badge badge-success">✓ FUNCTIONAL</span>;
      case 'UNDER_REPAIR':
        return <span className="badge badge-warning">🛠️ UNDER REPAIR</span>;
      case 'DAMAGED':
        return <span className="badge badge-danger">⚠️ DAMAGED</span>;
      case 'REPLACED':
        return <span className="badge badge-mocha">🔄 REPLACED</span>;
      case 'DECOMMISSIONED':
        return <span className="badge badge-neutral">📦 RETIRED</span>;
      default:
        return <span className="badge badge-neutral">{cond}</span>;
    }
  };

  // Unauthenticated Guard
  if (!user) {
    return (
      <div className="card" style={{ maxWidth: 580, margin: '3.5rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Inventory &amp; Asset Management
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Please sign in to track room equipment, inspect furniture and appliances, and conduct asset audits.
        </p>
        <div>
          <a href="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Sign In to Access
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            📦 Inventory &amp; Room Asset Management
          </h1>
          <p className="page-subtitle">
            Track hostel appliances, room furniture, condition audit inspections, and lifecycle warranties
          </p>
        </div>

        <div className="page-header-actions">
          <button
            className="btn btn-outline"
            onClick={() => loadData()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            title="Refresh assets directory"
          >
            <span>🔄</span> Refresh
          </button>
          {isStaffOrAdmin && (
            <button
              className="btn btn-primary"
              onClick={handleOpenCreate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>➕</span> Register New Asset
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div
          className="alert"
          style={{
            background: 'var(--success-light)',
            color: 'var(--success)',
            border: '1px solid rgba(58,122,79,0.3)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem'
          }}
        >
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      {isStaffOrAdmin && summary && (
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--palette-1)' }} />
            <div className="kpi-label">TOTAL ASSETS</div>
            <div className="kpi-value">{summary.totalAssets}</div>
            <div className="kpi-subtext">Valued at ₹{Number(summary.totalAssetValue || 0).toLocaleString()}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--success)' }} />
            <div className="kpi-label">FUNCTIONAL</div>
            <div className="kpi-value">{summary.functionalAssets}</div>
            <div className="kpi-subtext">Active &amp; operational</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--warning)' }} />
            <div className="kpi-label">UNDER REPAIR</div>
            <div className="kpi-value">{summary.underRepairAssets}</div>
            <div className="kpi-subtext">Technician assigned</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--danger)' }} />
            <div className="kpi-label">DAMAGED / AUDIT DUE</div>
            <div className="kpi-value">{summary.damagedAssets}</div>
            <div className="kpi-subtext">Requires inspection</div>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="toolbar-card" style={{ marginBottom: '1.5rem' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 240 }}>
          <span className="search-icon-inside">🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by asset tag, name, or room number..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <select
            className="form-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 180 }}>
          <select
            className="form-control"
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
          >
            <option value="">All Conditions</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>⏳</div>
            Loading inventory assets...
          </div>
        ) : assets.length === 0 ? (
          <div className="empty-state" style={{ padding: '3.5rem 1rem' }}>
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">No Inventory Assets Found</div>
            <div className="empty-state-desc">No equipment or room assets match the selected filters.</div>
            {isStaffOrAdmin && (
              <div style={{ marginTop: '1.25rem' }}>
                <button onClick={handleOpenCreate} className="btn btn-primary">
                  ➕ Register Asset
                </button>
              </div>
            )}
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Room Location</th>
                <th>Condition</th>
                <th>Cost</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--palette-1)' }}>
                    {a.assetTag}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{a.name}</div>
                    {a.notes && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{a.notes}</div>}
                  </td>
                  <td>
                    <span className="badge badge-sand">
                      {a.category?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {a.roomNumber ? (
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Room {a.roomNumber}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          {a.buildingName}
                        </span>
                      </div>
                    ) : (
                      <span className="badge badge-neutral">Common Store</span>
                    )}
                  </td>
                  <td>
                    {getConditionBadge(a.condition)}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {a.cost ? `₹${Number(a.cost).toLocaleString()}` : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {isStaffOrAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setAuditAsset(a);
                              setAuditForm({ newCondition: a.condition, remarks: '' });
                            }}
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem' }}
                          >
                            🔍 Audit
                          </button>
                          <button
                            onClick={() => handleOpenEdit(a)}
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem' }}
                          >
                            ✏️ Edit
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleViewHistory(a)}
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem' }}
                      >
                        📜 History
                      </button>
                      {isStaffOrAdmin && (
                        <button
                          onClick={() => handleDeleteAsset(a)}
                          className="btn btn-outline"
                          style={{
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.76rem',
                            borderColor: 'rgba(184,58,45,0.35)',
                            color: 'var(--danger)'
                          }}
                          title="Permanently delete asset"
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

      {/* MODAL 1: Add / Edit Asset */}
      {showAssetModal && (
        <div className="modal-overlay" onClick={() => setShowAssetModal(false)}>
          <div className="modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingAssetId ? '✏️ Edit Asset' : '➕ Register New Asset'}
              </h2>
              <button className="modal-close-btn" onClick={() => setShowAssetModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveAsset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Asset Tag Code *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. AST-AC-101"
                    value={assetForm.assetTag}
                    onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Category *
                  </label>
                  <select
                    className="form-control"
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Item Name / Model *
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Daikin 1.5 Ton Inverter AC / Study Table"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Assigned Room
                  </label>
                  <select
                    className="form-control"
                    value={assetForm.roomId}
                    onChange={(e) => setAssetForm({ ...assetForm, roomId: e.target.value })}
                  >
                    <option value="">Common Store / Unallocated</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Purchase Cost (₹)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 15000"
                    value={assetForm.cost}
                    onChange={(e) => setAssetForm({ ...assetForm, cost: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={assetForm.purchaseDate}
                    onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Warranty Expiry
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={assetForm.warrantyExpiry}
                    onChange={(e) => setAssetForm({ ...assetForm, warrantyExpiry: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Notes / Serial Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Serial #SN-98124501, 5-year compressor warranty"
                  value={assetForm.notes}
                  onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setShowAssetModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={savingAsset} className="btn btn-primary">
                  {savingAsset ? 'Saving...' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Audit Condition */}
      {auditAsset && (
        <div className="modal-overlay" onClick={() => setAuditAsset(null)}>
          <div className="modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔍 Audit Asset Condition</h3>
              <button className="modal-close-btn" onClick={() => setAuditAsset(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.5rem 0 1rem' }}>
              Auditing <strong style={{ color: 'var(--text-main)' }}>{auditAsset.assetTag}</strong> — {auditAsset.name}
            </p>

            <form onSubmit={handleAuditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  New Condition Status *
                </label>
                <select
                  className="form-control"
                  value={auditForm.newCondition}
                  onChange={(e) => setAuditForm({ ...auditForm, newCondition: e.target.value })}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Audit Inspection Remarks *
                </label>
                <textarea
                  rows="3"
                  required
                  className="form-control"
                  placeholder="e.g. Regular inspection, cooling performance checked and normal"
                  value={auditForm.remarks}
                  onChange={(e) => setAuditForm({ ...auditForm, remarks: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setAuditAsset(null)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={submittingAudit} className="btn btn-primary">
                  {submittingAudit ? 'Saving...' : 'Record Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Audit History Log */}
      {viewHistoryAsset && (
        <div className="modal-overlay" onClick={() => setViewHistoryAsset(null)}>
          <div className="modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📜 Condition Audit Trail</h3>
              <button className="modal-close-btn" onClick={() => setViewHistoryAsset(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.5rem 0 1rem' }}>
              Historical trail for <strong style={{ color: 'var(--text-main)' }}>{viewHistoryAsset.assetTag}</strong> ({viewHistoryAsset.name})
            </p>

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                Loading audit records...
              </div>
            ) : auditHistory.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No Audit Records</div>
                <div className="empty-state-desc">
                  No condition changes recorded yet. Initial state: {viewHistoryAsset.condition}.
                </div>
              </div>
            ) : (
              <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {auditHistory.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      padding: '0.85rem 1rem',
                      borderLeft: '3px solid var(--palette-1)',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: '0 var(--radius-md) var(--radius-md) 0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>👤 {h.auditedByName || h.auditedBy}</span>
                      <span>{new Date(h.auditedAt).toLocaleString()}</span>
                    </div>
                    <div style={{ margin: '0.35rem 0', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      Transition: {h.previousCondition} ➔ <span style={{ color: 'var(--palette-1)' }}>{h.newCondition}</span>
                    </div>
                    {h.remarks && <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>💬 {h.remarks}</div>}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <button onClick={() => setViewHistoryAsset(null)} className="btn btn-outline">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
