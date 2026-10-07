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
        return <span className="badge badge-danger" style={{ backgroundColor: '#dc2626', color: '#fff' }}>URGENT</span>;
      case 'HIGH':
        return <span className="badge badge-warning" style={{ backgroundColor: '#ea580c', color: '#fff' }}>HIGH</span>;
      case 'NORMAL':
        return <span className="badge badge-primary" style={{ backgroundColor: '#2563eb', color: '#fff' }}>NORMAL</span>;
      case 'LOW':
        return <span className="badge badge-neutral" style={{ backgroundColor: '#64748b', color: '#fff' }}>LOW</span>;
      default:
        return <span className="badge">{priority}</span>;
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'MAINTENANCE':
        return <span style={{ color: '#d97706', fontWeight: 600 }}>🛠️ Maintenance</span>;
      case 'SECURITY':
        return <span style={{ color: '#dc2626', fontWeight: 600 }}>🛡️ Security</span>;
      case 'EVENT':
        return <span style={{ color: '#7c3aed', fontWeight: 600 }}>🎉 Event</span>;
      case 'RULES':
        return <span style={{ color: '#0284c7', fontWeight: 600 }}>📋 Guidelines</span>;
      case 'EMERGENCY':
        return <span style={{ color: '#b91c1c', fontWeight: 700 }}>🚨 Emergency</span>;
      default:
        return <span style={{ color: '#475569', fontWeight: 600 }}>📢 General</span>;
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '60px 24px', maxWidth: 600, margin: '40px auto', textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📢</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Community Notice Board</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Please sign in to read official notices, hostel circulars, event announcements, and maintenance alerts.
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
            📢 Community Notice Board &amp; Broadcasts
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)' }}>
            Official hostel announcements, maintenance alerts, security notices, and campus updates
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            onClick={() => loadNotices()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Refresh notice board"
          >
            🔄 Refresh
          </button>
          {isAdminOrStaff && (
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>➕</span> Post Notice
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

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search notices by keywords..."
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
          <option value="GENERAL">General</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="SECURITY">Security</option>
          <option value="EVENT">Event</option>
          <option value="RULES">Rules &amp; Guidelines</option>
          <option value="EMERGENCY">Emergency</option>
        </select>
      </div>

      {/* Notice Board Feed Cards */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading notice board...</div>
      ) : notices.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No announcements found matching your criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notices.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{
                padding: '1.5rem',
                borderLeft: n.pinned ? '5px solid #2563eb' : '1px solid #e2e8f0',
                background: n.pinned ? '#f8faff' : '#ffffff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {n.pinned && (
                    <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                      📌 PINNED
                    </span>
                  )}
                  {getCategoryBadge(n.category)}
                  {getPriorityBadge(n.priority)}
                </div>

                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Posted by <strong>{n.publishedByName}</strong> • {new Date(n.createdAt).toLocaleDateString()}
                </div>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#0f172a' }}>
                {n.title}
              </h2>

              <p style={{ margin: '0 0 1rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {n.content}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                <div>Audience: <strong>{n.targetAudience}</strong> {n.expiresAt ? `• Valid until: ${n.expiresAt}` : ''}</div>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => handleTogglePin(n.id)}
                    >
                      {n.pinned ? 'Unpin' : 'Pin to Top'}
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#ef4444', borderColor: '#ef4444' }}
                      onClick={() => handleDelete(n.id, n.title)}
                    >
                      Delete
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem' }}>
              📢 Publish Community Notice
            </h2>

            <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Notice Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WiFi Upgrade Maintenance on Friday"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Alert</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Notice Body Content *</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Detailed announcement, timings, guidelines, and contact persons..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Target Audience</label>
                  <select
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="ALL">All Residents &amp; Staff</option>
                    <option value="RESIDENTS">Residents Only</option>
                    <option value="STAFF">Staff &amp; Security Only</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Expires On (optional)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="pinnedCheck"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                />
                <label htmlFor="pinnedCheck" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  📌 Pin this notice to top of community board
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
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
