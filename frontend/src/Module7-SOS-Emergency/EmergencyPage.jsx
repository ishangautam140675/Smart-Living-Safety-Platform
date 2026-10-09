import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { emergencyService } from './emergencyService';

export default function EmergencyPage() {
  const { user } = useAuth();

  const isResident = user?.roles?.includes('ROLE_RESIDENT');
  const isSecurity = user?.roles?.some((r) => ['ROLE_ADMIN', 'ROLE_SECURITY', 'ROLE_STAFF'].includes(r));

  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Panic Button / Trigger SOS Modal
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosForm, setSosForm] = useState({
    type: 'MEDICAL',
    severity: 'CRITICAL',
    locationDetails: '',
    description: ''
  });
  const [triggering, setTriggering] = useState(false);

  // Resolve Modal
  const [activeAlertToResolve, setActiveAlertToResolve] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    status: 'RESOLVED',
    notes: 'Incident handled and site secured by responders'
  });
  const [resolving, setResolving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      if (isResident) {
        const myAlerts = await emergencyService.getMyAlerts().catch(() => []);
        setAlerts(myAlerts || []);
      } else {
        const [alertList, stats] = await Promise.all([
          emergencyService.searchAlerts(keyword, statusFilter, severityFilter).catch(() => []),
          emergencyService.getSummary().catch(() => null)
        ]);
        setAlerts(alertList || []);
        if (stats) setSummary(stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to load emergency alerts');
    } finally {
      setLoading(false);
    }
  }, [user, isResident, keyword, statusFilter, severityFilter]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadData();
    // Auto-refresh feed every 15s for security guard monitoring
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [user, loadData]);

  // Handle Trigger SOS
  const handleTriggerSos = async (e) => {
    e?.preventDefault();
    setTriggering(true);
    setError('');
    setSuccessMsg('');
    try {
      const created = await emergencyService.triggerSos(sosForm);
      setSuccessMsg(`🚨 EMERGENCY SOS DISPATCHED! Alert Code: ${created.alertCode}. Guards alerted immediately.`);
      setShowSosModal(false);
      setSosForm({ type: 'MEDICAL', severity: 'CRITICAL', locationDetails: '', description: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to dispatch SOS alert');
    } finally {
      setTriggering(false);
    }
  };

  // Instant 1-Click SOS for extreme emergencies
  const handleInstantPanic = async (emergencyType) => {
    if (!window.confirm(`⚠️ TRIGGER EMERGENCY BROADCAST FOR ${emergencyType}? Security will be dispatched instantly!`)) return;
    setTriggering(true);
    setError('');
    setSuccessMsg('');
    try {
      const created = await emergencyService.triggerSos({
        type: emergencyType,
        severity: 'CRITICAL',
        locationDetails: '',
        description: `Instant 1-Click Panic Button Pressed by ${user?.fullName}`
      });
      setSuccessMsg(`🚨 CRITICAL ${emergencyType} SOS DISPATCHED! Alert Code: ${created.alertCode}`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to trigger emergency');
    } finally {
      setTriggering(false);
    }
  };

  // Acknowledge Alert (Security)
  const handleAcknowledge = async (alertCode) => {
    setError('');
    setSuccessMsg('');
    try {
      await emergencyService.acknowledgeAlert(alertCode);
      setSuccessMsg(`Alert ${alertCode} acknowledged. Response dispatched.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Acknowledgement failed');
    }
  };

  // Resolve Alert Submit
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setResolving(true);
    setError('');
    setSuccessMsg('');
    try {
      await emergencyService.resolveAlert(activeAlertToResolve.alertCode, resolveForm);
      setSuccessMsg(`Emergency alert ${activeAlertToResolve.alertCode} marked as ${resolveForm.status}.`);
      setActiveAlertToResolve(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to resolve alert');
    } finally {
      setResolving(false);
    }
  };

  // Delete Alert
  const handleDeleteAlert = async (alertCode) => {
    if (!window.confirm(`Are you sure you want to permanently delete alert ${alertCode}?`)) return;
    setError('');
    setSuccessMsg('');
    try {
      await emergencyService.deleteAlert(alertCode);
      setSuccessMsg(`Alert ${alertCode} deleted successfully.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete alert');
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <span className="badge badge-danger">CRITICAL</span>;
      case 'HIGH':     return <span className="badge badge-danger" style={{ background: '#ea580c' }}>HIGH</span>;
      case 'MEDIUM':   return <span className="badge badge-warning">MEDIUM</span>;
      case 'LOW':      return <span className="badge badge-neutral">LOW</span>;
      default:         return <span className="badge">{severity}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':       return <span className="badge badge-danger">🚨 ACTIVE</span>;
      case 'ACKNOWLEDGED': return <span className="badge badge-mocha">👀 ACKNOWLEDGED</span>;
      case 'RESOLVED':     return <span className="badge badge-success">✅ RESOLVED</span>;
      case 'FALSE_ALARM':  return <span className="badge badge-neutral">⚪ FALSE ALARM</span>;
      default:             return <span className="badge">{status}</span>;
    }
  };

  if (!user) {
    return (
      <div className="card" style={{ maxWidth: 580, margin: '3.5rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: 52, marginBottom: '1rem' }}>🚨</div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem' }}>
          Emergency &amp; SOS Center
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Please sign in to trigger panic distress alerts, view active emergency incidents, or dispatch security responders.
        </p>
        <a href="/login" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none', background: 'var(--danger)', borderColor: 'var(--danger)' }}>
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
          <h1 className="page-title">🚨 SOS &amp; Emergency Command</h1>
          <p className="page-subtitle">
            {isResident
              ? 'Instant panic alarm, medical dispatch, fire warnings, and security alerts'
              : 'Real-time emergency broadcast monitoring, responder dispatch, and incident logs'}
          </p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)', fontWeight: 700 }}
            onClick={() => setShowSosModal(true)}
          >
            🆘 Trigger Custom SOS
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
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1-Click Panic Bar */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'var(--danger-light)', border: '1.5px solid rgba(184,58,45,0.25)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.4rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚡ 1-Click Fast Emergency Dispatch
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.1rem', lineHeight: 1.5 }}>
          Pressing any button auto-detects your room/bed location and alerts on-duty security and campus responders immediately.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
          {[
            { type: 'MEDICAL',         label: '🚑 Medical Emergency',    bg: 'var(--danger)' },
            { type: 'FIRE',            label: '🔥 Fire Hazard',          bg: '#ea580c' },
            { type: 'SECURITY_THREAT', label: '🛡️ Security / Intruder',  bg: '#4338ca' },
            { type: 'SILENT_SOS',      label: '🤫 Silent / Discreet SOS', bg: '#0f172a' },
            { type: 'HARASSMENT',      label: '✋ Incident / Harassment', bg: '#be123c' },
            { type: 'GAS_LEAK',        label: '⚠️ Gas / Chemical Leak',  bg: '#b45309' },
          ].map(({ type, label, bg }) => (
            <button
              key={type}
              className="btn btn-primary"
              style={{ background: bg, border: 'none', padding: '0.75rem', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)' }}
              disabled={triggering}
              onClick={() => handleInstantPanic(type)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Security Summary Cards */}
      {isSecurity && summary && (
        <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--danger)' }} />
            <div className="kpi-label">ACTIVE ALERTS</div>
            <div className="kpi-value" style={{ color: 'var(--danger)' }}>{summary.activeAlerts}</div>
            <div className="kpi-subtext">Require immediate response</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: '#ea580c' }} />
            <div className="kpi-label">CRITICAL SEVERITY</div>
            <div className="kpi-value" style={{ color: '#ea580c' }}>{summary.criticalAlerts}</div>
            <div className="kpi-subtext">Highest priority</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--palette-1)' }} />
            <div className="kpi-label">ACKNOWLEDGED</div>
            <div className="kpi-value" style={{ color: 'var(--palette-1)' }}>{summary.acknowledgedAlerts}</div>
            <div className="kpi-subtext">Responders en route</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--success)' }} />
            <div className="kpi-label">RESOLVED TODAY</div>
            <div className="kpi-value" style={{ color: 'var(--success)' }}>{summary.resolvedAlerts}</div>
            <div className="kpi-subtext">Completed incidents</div>
          </div>
        </div>
      )}

      {/* Security Filter Bar */}
      {isSecurity && (
        <div className="toolbar-card" style={{ marginBottom: '1.5rem' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '220px' }}>
            <span className="search-icon-inside">🔎</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by code, resident name, or location..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ minWidth: '160px', width: 'auto' }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active (Unresolved)</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_ALARM">False Alarm</option>
          </select>
          <select className="form-control" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} style={{ minWidth: '150px', width: 'auto' }}>
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      )}

      {/* Emergency Alerts Feed Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: '0.75rem' }}>⏳</div>
            Loading live feed...
          </div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🟢</div>
            <div className="empty-state-title">No emergency alerts logged</div>
            <div className="empty-state-desc">Campus premises are secure.</div>
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Alert Code</th>
                <th>Emergency Type</th>
                <th>Location / Unit</th>
                <th>Caller / Resident</th>
                <th>Severity &amp; Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alt) => (
                <tr
                  key={alt.id}
                  style={{
                    background: alt.status === 'ACTIVE' ? 'var(--danger-light)' : 'transparent'
                  }}
                >
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--danger)', fontSize: '0.9rem', letterSpacing: '0.03em' }}>
                      {alt.alertCode}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{alt.type}</div>
                    {alt.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {alt.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{alt.locationDetails}</div>
                    {alt.roomNumber && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room: {alt.roomNumber} ({alt.buildingName})</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{alt.residentName || 'Campus Staff'}</div>
                    {alt.residentPhone && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📞 {alt.residentPhone}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {getSeverityBadge(alt.severity)}
                      {getStatusBadge(alt.status)}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 600 }}>{new Date(alt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    <div style={{ fontSize: '0.75rem' }}>{new Date(alt.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {isSecurity && alt.status === 'ACTIVE' && (
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--palette-1)', borderColor: 'var(--palette-2)' }}
                          onClick={() => handleAcknowledge(alt.alertCode)}
                        >
                          Acknowledge
                        </button>
                      )}
                      {isSecurity && (alt.status === 'ACTIVE' || alt.status === 'ACKNOWLEDGED') && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: 'var(--success)', border: 'none' }}
                          onClick={() => {
                            setActiveAlertToResolve(alt);
                            setResolveForm({ status: 'RESOLVED', notes: '' });
                          }}
                        >
                          Resolve
                        </button>
                      )}
                      {alt.status === 'RESOLVED' && (
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(184,58,45,0.35)' }}
                          onClick={() => handleDeleteAlert(alt.alertCode)}
                        >
                          🗑 Delete
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

      {/* Modal: Custom SOS Trigger */}
      {showSosModal && (
        <div className="modal-overlay" onClick={() => setShowSosModal(false)}>
          <div className="modal-card" style={{ maxWidth: '500px', borderTop: '3px solid var(--danger)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--danger)' }}>🆘 Dispatch Emergency Alert</h2>
              <button className="modal-close-btn" onClick={() => setShowSosModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              This broadcasts an immediate alert to central security and on-duty supervisors.
            </p>

            <form onSubmit={handleTriggerSos} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Emergency Type *</label>
                <select required className="form-control" value={sosForm.type} onChange={(e) => setSosForm({ ...sosForm, type: e.target.value })}>
                  <option value="MEDICAL">🚑 Medical Emergency</option>
                  <option value="FIRE">🔥 Fire Hazard</option>
                  <option value="SECURITY_THREAT">🛡️ Security Threat / Intruder</option>
                  <option value="SILENT_SOS">🤫 Silent / Discreet SOS</option>
                  <option value="HARASSMENT">✋ Harassment / Safety Violation</option>
                  <option value="THREAT">⚠️ Threat / Extortion</option>
                  <option value="ASSAULT">🚨 Assault / Physical Harm</option>
                  <option value="GAS_LEAK">⚠️ Gas / Chemical Leak</option>
                  <option value="ELEVATOR_TRAP">🛗 Elevator Trapped</option>
                  <option value="NATURAL_DISASTER">🌪️ Natural Disaster</option>
                  <option value="OTHER">❗ Other Critical Incident</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Severity Level</label>
                <select className="form-control" value={sosForm.severity} onChange={(e) => setSosForm({ ...sosForm, severity: e.target.value })}>
                  <option value="CRITICAL">🔴 Critical (Life/Property Immediate Hazard)</option>
                  <option value="HIGH">🟠 High Priority</option>
                  <option value="MEDIUM">🟡 Medium Priority</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Location (leave blank to auto-detect your room)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Block A 2nd Floor Corridor / Cafeteria"
                  value={sosForm.locationDetails}
                  onChange={(e) => setSosForm({ ...sosForm, locationDetails: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Situation Details</label>
                <textarea
                  rows="2"
                  className="form-control"
                  placeholder="Describe patient condition, fire scale, or suspicious person..."
                  value={sosForm.description}
                  onChange={(e) => setSosForm({ ...sosForm, description: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowSosModal(false)}>Cancel</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'var(--danger)', border: 'none', fontWeight: 700 }}
                  disabled={triggering}
                >
                  {triggering ? 'Broadcasting...' : 'DISPATCH SOS NOW'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Incident */}
      {activeAlertToResolve && (
        <div className="modal-overlay" onClick={() => setActiveAlertToResolve(null)}>
          <div className="modal-card" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🛡️ Resolve Incident</h2>
              <button className="modal-close-btn" onClick={() => setActiveAlertToResolve(null)}>✕</button>
            </div>

            <div style={{ padding: '0.25rem 0 1rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: 'var(--danger)', marginBottom: '0.3rem' }}>
                {activeAlertToResolve.alertCode}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Type: <strong style={{ color: 'var(--text-main)' }}>{activeAlertToResolve.type}</strong> at <strong style={{ color: 'var(--text-main)' }}>{activeAlertToResolve.locationDetails}</strong>
              </div>
            </div>

            <form onSubmit={handleResolveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Outcome Status *</label>
                <select className="form-control" value={resolveForm.status} onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}>
                  <option value="RESOLVED">Resolved (Responders handled situation)</option>
                  <option value="FALSE_ALARM">False Alarm / Accidental Trigger</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-main)' }}>Resolution Notes / Action Taken *</label>
                <textarea
                  rows="3"
                  required
                  className="form-control"
                  placeholder="Summarize paramedic intervention, security check, or site clearing..."
                  value={resolveForm.notes}
                  onChange={(e) => setResolveForm({ ...resolveForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setActiveAlertToResolve(null)}>Cancel</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'var(--success)', border: 'none' }}
                  disabled={resolving}
                >
                  {resolving ? 'Submitting...' : 'Complete & Close Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
