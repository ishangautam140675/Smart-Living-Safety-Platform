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
        return <span className="badge badge-success" style={{ backgroundColor: '#10b981', color: '#fff' }}>✓ FUNCTIONAL</span>;
      case 'UNDER_REPAIR':
        return <span className="badge badge-warning" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>🛠️ UNDER REPAIR</span>;
      case 'DAMAGED':
        return <span className="badge badge-danger" style={{ backgroundColor: '#ef4444', color: '#fff' }}>⚠️ DAMAGED</span>;
      case 'REPLACED':
        return <span className="badge badge-primary" style={{ backgroundColor: '#6366f1', color: '#fff' }}>🔄 REPLACED</span>;
      case 'DECOMMISSIONED':
        return <span className="badge badge-neutral" style={{ backgroundColor: '#64748b', color: '#fff' }}>📦 RETIRED</span>;
      default:
        return <span className="badge">{cond}</span>;
    }
  };

  // Unauthenticated Guard
  if (!user) {
    return (
      <div style={{ padding: '60px 24px', maxWidth: 600, margin: '40px auto', textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Inventory &amp; Asset Management</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Please sign in to track room equipment, inspect furniture and appliances, and conduct asset audits.
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
            📦 Inventory &amp; Room Asset Management
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)' }}>
            Track hostel appliances, room furniture, condition audit inspections, and lifecycle warranties
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            onClick={() => loadData()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Refresh assets directory"
          >
            🔄 Refresh
          </button>
          {isStaffOrAdmin && (
            <button
              className="btn btn-primary"
              onClick={handleOpenCreate}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>➕</span> Register New Asset
            </button>
          )}
        </div>
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

      {/* KPI Cards */}
      {isStaffOrAdmin && summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ASSETS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', margin: '0.25rem 0' }}>
              {summary.totalAssets}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Valued at ₹{Number(summary.totalAssetValue || 0).toLocaleString()}</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>FUNCTIONAL</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', margin: '0.25rem 0' }}>
              {summary.functionalAssets}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active &amp; operational</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>UNDER REPAIR</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', margin: '0.25rem 0' }}>
              {summary.underRepairAssets}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Technician assigned</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>DAMAGED / AUDIT DUE</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', margin: '0.25rem 0' }}>
              {summary.damagedAssets}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Requires inspection</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by asset tag, name, or room number..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ flex: 1, minWidth: '220px', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
        >
          <option value="">All Conditions</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{c.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Assets Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading inventory...</div>
        ) : assets.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
            <h4>No Inventory Assets Found</h4>
            <p style={{ margin: '0.25rem 0 1rem' }}>No equipment matches the selected filters.</p>
            {isStaffOrAdmin && (
              <button onClick={handleOpenCreate} className="btn btn-primary">➕ Register Asset</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Asset Tag</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Item Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Room Location</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Condition</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Cost</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, fontFamily: 'monospace' }}>
                      {a.assetTag}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{a.name}</div>
                      {a.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.notes}</div>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                        {a.category?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {a.roomNumber ? (
                        <div>
                          <span style={{ fontWeight: 600 }}>Room {a.roomNumber}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                            {a.buildingName}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Common Store</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {getConditionBadge(a.condition)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                      {a.cost ? `₹${Number(a.cost).toLocaleString()}` : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {isStaffOrAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setAuditAsset(a);
                                setAuditForm({ newCondition: a.condition, remarks: '' });
                              }}
                              className="btn btn-outline"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              🔍 Audit
                            </button>
                            <button
                              onClick={() => handleOpenEdit(a)}
                              className="btn btn-outline"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              ✏️ Edit
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleViewHistory(a)}
                          className="btn btn-outline"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          📜 History
                        </button>
                        {isStaffOrAdmin && (
                          <button
                            onClick={() => handleDeleteAsset(a)}
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }}
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
          </div>
        )}
      </div>

      {/* MODAL 1: Add / Edit Asset */}
      {showAssetModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>
                {editingAssetId ? '✏️ Edit Asset' : '➕ Register New Asset'}
              </h2>
              <button onClick={() => setShowAssetModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveAsset}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Asset Tag Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AST-AC-101"
                    value={assetForm.assetTag}
                    onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Category</label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Item Name / Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daikin 1.5 Ton Inverter AC / Study Table"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Assigned Room</label>
                  <select
                    value={assetForm.roomId}
                    onChange={(e) => setAssetForm({ ...assetForm, roomId: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                  >
                    <option value="">Common Store / Unallocated</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Purchase Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={assetForm.cost}
                    onChange={(e) => setAssetForm({ ...assetForm, cost: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Purchase Date</label>
                  <input
                    type="date"
                    value={assetForm.purchaseDate}
                    onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Warranty Expiry</label>
                  <input
                    type="date"
                    value={assetForm.warrantyExpiry}
                    onChange={(e) => setAssetForm({ ...assetForm, warrantyExpiry: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Notes / Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. Serial #SN-98124501, 5-year compressor warranty"
                  value={assetForm.notes}
                  onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <h3 style={{ margin: '0 0 0.5rem' }}>🔍 Audit Asset Condition</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <strong>{auditAsset.assetTag}</strong> — {auditAsset.name}
            </p>

            <form onSubmit={handleAuditSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>New Condition</label>
                <select
                  value={auditForm.newCondition}
                  onChange={(e) => setAuditForm({ ...auditForm, newCondition: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Audit Inspection Remarks</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Regular inspection, cooling performance checked and normal"
                  value={auditForm.remarks}
                  onChange={(e) => setAuditForm({ ...auditForm, remarks: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>📜 Condition Audit Trail</h3>
              <button onClick={() => setViewHistoryAsset(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              History for <strong>{viewHistoryAsset.assetTag}</strong> ({viewHistoryAsset.name})
            </p>

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading audit records...</div>
            ) : auditHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No condition changes recorded yet. Initial state: {viewHistoryAsset.condition}.
              </div>
            ) : (
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {auditHistory.map((h) => (
                  <div key={h.id} style={{ padding: '0.75rem 1rem', borderLeft: '3px solid #3b82f6', backgroundColor: '#f8fafc', marginBottom: '0.75rem', borderRadius: '0 6px 6px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>👤 {h.auditedByName || h.auditedBy}</span>
                      <span>{new Date(h.auditedAt).toLocaleString()}</span>
                    </div>
                    <div style={{ margin: '0.35rem 0', fontWeight: 600 }}>
                      Transition: {h.previousCondition} ➔ <span style={{ color: '#2563eb' }}>{h.newCondition}</span>
                    </div>
                    {h.remarks && <div style={{ fontSize: '0.85rem', color: '#475569' }}>💬 {h.remarks}</div>}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setViewHistoryAsset(null)} className="btn btn-outline">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
