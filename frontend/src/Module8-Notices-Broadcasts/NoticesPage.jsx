import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { noticeService } from './noticeService';

export default function NoticesPage() {
  const { user } = useAuth();

  const isAdminOrStaff = user?.roles?.some((r) => ['ROLE_ADMIN', 'ROLE_STAFF'].includes(r));
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filter state
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 'NORMAL',
    targetAudience: 'ALL',
    pinned: false,
    expiresAt: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadNotices = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await noticeService.getNotices(keyword, categoryFilter).catch(() => []);
      setNotices(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, [user, keyword, categoryFilter]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  // Periodic background refresh every 20 seconds for community notices
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotices();
    }, 20000);
    return () => clearInterval(interval);
  }, [loadNotices]);

  // Handle Publish Notice
  const handlePublish = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const created = await noticeService.publishNotice({
        ...form,
        expiresAt: form.expiresAt || null
      });
      setSuccessMsg(`Notice "${created.title}" published to community board!`);
      setShowModal(false);
      setForm({
        title: '',
        content: '',
        category: 'GENERAL',
        priority: 'NORMAL',
        targetAudience: 'ALL',
        pinned: false,
        expiresAt: ''
      });
      loadNotices();
    } catch (err) {
      setError(err.message || 'Failed to publish notice');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Pin (Admin)
  const handleTogglePin = async (id) => {
    setError('');
    try {
      const updated = await noticeService.togglePin(id);
      setSuccessMsg(`Notice pin status updated to: ${updated.pinned ? 'Pinned' : 'Unpinned'}`);
      loadNotices();
    } catch (err) {
      setError(err.message || 'Failed to pin/unpin notice');
    }
  };

  // Delete Notice (Admin)
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete notice "${title}"? This cannot be undone.`)) return;
    setError('');
    try {
      await noticeService.deleteNotice(id);
      setSuccessMsg('Notice removed successfully.');
      loadNotices();
    } catch (err) {
      setError(err.message || 'Failed to delete notice');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="badge badge-danger">URGENT</span>;
      case 'HIGH':
        return <span className="badge badge-warning">HIGH</span>;
      case 'NORMAL':
        return <span className="badge badge-mocha">NORMAL</span>;
      case 'LOW':
        return <span className="badge badge-neutral">LOW</span>;
      default:
        return <span className="badge badge-neutral">{priority}</span>;
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'MAINTENANCE':
        return <span className="badge badge-sand">🛠️ Maintenance</span>;
      case 'SECURITY':
        return <span className="badge badge-danger">🛡️ Security</span>;
      case 'EVENT':
        return <span className="badge badge-cream">🎉 Event</span>;
      case 'RULES':
        return <span className="badge badge-warm">📋 Guidelines</span>;
      case 'EMERGENCY':
        return <span className="badge badge-danger">🚨 Emergency</span>;
      default:
        return <span className="badge badge-neutral">📢 General</span>;
    }
  };

  if (!user) {
    return (
      <div className="card" style={{ maxWidth: 580, margin: '3.5rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📢</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Community Notice Board
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Please sign in to read official notices, hostel circulars, event announcements, and maintenance alerts.
        </p>
        <div>
          <a href="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Sign In to Access
          </a>
        </div>
      </div>
    );
  }

  const pinnedCount = notices.filter(n => n.pinned).length;
  const urgentCount = notices.filter(n => n.priority === 'URGENT' || n.priority === 'HIGH').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            📢 Community Notice Board &amp; Broadcasts
          </h1>
          <p className="page-subtitle">
            Official hostel announcements, maintenance alerts, security notices, and campus updates
          </p>
        </div>

        <div className="page-header-actions">
          <button
            className="btn btn-outline"
            onClick={() => loadNotices()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            title="Refresh notice board"
          >
            <span>🔄</span> Refresh
          </button>
          {isAdminOrStaff && (
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>➕</span> Post Notice
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div className="kpi-card-stripe" style={{ background: 'var(--palette-1)' }} />
          <div className="kpi-label">Total Notices</div>
          <div className="kpi-value">{notices.length}</div>
          <div className="kpi-subtext">Active circulars on board</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-stripe" style={{ background: 'var(--palette-2)' }} />
          <div className="kpi-label">Pinned Bulletins</div>
          <div className="kpi-value">{pinnedCount}</div>
          <div className="kpi-subtext">Featured at top</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-stripe" style={{ background: 'var(--warning)' }} />
          <div className="kpi-label">Urgent / High Priority</div>
          <div className="kpi-value">{urgentCount}</div>
          <div className="kpi-subtext">Action required</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-stripe" style={{ background: 'var(--success)' }} />
          <div className="kpi-label">Broadcast Audience</div>
          <div className="kpi-value">Active</div>
          <div className="kpi-subtext">Hostel Residents &amp; Staff</div>
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

      {/* Filter Toolbar */}
      <div className="toolbar-card" style={{ marginBottom: '1.5rem' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 260 }}>
          <span className="search-icon-inside">🔍</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search notices by headline or content..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div style={{ minWidth: 200 }}>
          <select
            className="form-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="GENERAL">📢 General</option>
            <option value="MAINTENANCE">🛠️ Maintenance</option>
            <option value="SECURITY">🛡️ Security</option>
            <option value="EVENT">🎉 Event</option>
            <option value="RULES">📋 Guidelines &amp; Rules</option>
            <option value="EMERGENCY">🚨 Emergency</option>
          </select>
        </div>
      </div>

      {/* Notice Board Feed Cards */}
      {loading ? (
        <div className="card" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>⏳</div>
          Loading notice board...
        </div>
      ) : notices.length === 0 ? (
        <div className="card empty-state" style={{ padding: '3.5rem 1rem' }}>
          <div className="empty-state-icon">📢</div>
          <div className="empty-state-title">No announcements found</div>
          <div className="empty-state-desc">There are no notices matching your current search or category filter.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {notices.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{
                padding: '1.5rem 1.75rem',
                borderLeft: n.pinned ? '4px solid var(--palette-1)' : '1px solid var(--border)',
                background: n.pinned ? 'var(--palette-4)' : 'var(--bg-surface)',
                boxShadow: n.pinned ? 'var(--shadow-warm-glow)' : 'var(--shadow-sm)',
                transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  {n.pinned && (
                    <span className="badge badge-mocha" style={{ fontWeight: 800 }}>
                      📌 PINNED
                    </span>
                  )}
                  {getCategoryBadge(n.category)}
                  {getPriorityBadge(n.priority)}
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Posted by <strong style={{ color: 'var(--text-main)' }}>{n.publishedByName}</strong> • {new Date(n.createdAt).toLocaleDateString()}
                </div>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.6rem', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                {n.title}
              </h2>

              <p style={{ margin: '0 0 1.25rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.65, fontSize: '0.94rem', opacity: 0.9 }}>
                {n.content}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  Audience: <strong style={{ color: 'var(--text-main)' }}>{n.targetAudience}</strong> {n.expiresAt ? `• Valid until: ${n.expiresAt}` : ''}
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                      onClick={() => handleTogglePin(n.id)}
                    >
                      {n.pinned ? 'Unpin' : '📌 Pin to Top'}
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{
                        padding: '0.3rem 0.75rem',
                        fontSize: '0.78rem',
                        color: 'var(--danger)',
                        borderColor: 'rgba(184,58,45,0.35)'
                      }}
                      onClick={() => handleDelete(n.id, n.title)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Post Notice */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📢 Publish Community Notice</h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Notice Headline *
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. WiFi Upgrade Maintenance on Friday"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Category *
                  </label>
                  <select
                    className="form-control"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="GENERAL">📢 General</option>
                    <option value="MAINTENANCE">🛠️ Maintenance</option>
                    <option value="SECURITY">🛡️ Security</option>
                    <option value="EVENT">🎉 Event / Festival</option>
                    <option value="RULES">📋 House Rules</option>
                    <option value="EMERGENCY">🚨 Emergency Notice</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Priority
                  </label>
                  <select
                    className="form-control"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Alert</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Notice Body Content *
                </label>
                <textarea
                  rows="4"
                  required
                  className="form-control"
                  placeholder="Detailed announcement, timings, guidelines, and contact persons..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Target Audience
                  </label>
                  <select
                    className="form-control"
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  >
                    <option value="ALL">All Residents &amp; Staff</option>
                    <option value="RESIDENTS">Residents Only</option>
                    <option value="STAFF">Staff &amp; Security Only</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Expires On (optional)
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="pinnedCheck"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  style={{ accentColor: 'var(--palette-1)', cursor: 'pointer', width: 16, height: 16 }}
                />
                <label htmlFor="pinnedCheck" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                  📌 Pin this notice to top of community board
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
