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
      setSosForm({
        type: 'MEDICAL',
        severity: 'CRITICAL',
        locationDetails: '',
        description: ''
      });
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

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="badge badge-danger" style={{ backgroundColor: '#dc2626', color: '#fff', animation: 'pulse 1.5s infinite' }}>CRITICAL</span>;
      case 'HIGH':
        return <span className="badge badge-danger" style={{ backgroundColor: '#ea580c', color: '#fff' }}>HIGH</span>;
      case 'MEDIUM':
        return <span className="badge badge-warning" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>MEDIUM</span>;
      case 'LOW':
        return <span className="badge badge-neutral" style={{ backgroundColor: '#64748b', color: '#fff' }}>LOW</span>;
      default:
        return <span className="badge">{severity}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge badge-danger" style={{ backgroundColor: '#dc2626', color: '#fff' }}>🚨 ACTIVE</span>;
      case 'ACKNOWLEDGED':
        return <span className="badge badge-warning" style={{ backgroundColor: '#0284c7', color: '#fff' }}>👀 ACKNOWLEDGED</span>;
      case 'RESOLVED':
        return <span className="badge badge-success" style={{ backgroundColor: '#10b981', color: '#fff' }}>✅ RESOLVED</span>;
      case 'FALSE_ALARM':
        return <span className="badge badge-neutral" style={{ backgroundColor: '#64748b', color: '#fff' }}>⚪ FALSE ALARM</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '60px 24px', maxWidth: 600, margin: '40px auto', textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚨</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>Emergency &amp; SOS Center</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Please sign in to trigger panic distress alerts, view active emergency incidents, or dispatch security responders.
        </p>
        <a href="/login" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, backgroundColor: '#dc2626', color: '#fff' }}>
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
            🚨 SOS &amp; Emergency Command Center
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)' }}>
            {isResident
              ? 'Instant panic alarm, medical dispatch, fire warnings, and security alerts'
              : 'Real-time emergency broadcast monitoring, responder dispatch, and incident logs'}
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ backgroundColor: '#dc2626', borderColor: '#b91c1c', fontWeight: 700, padding: '0.6rem 1.25rem', fontSize: '1rem' }}
          onClick={() => setShowSosModal(true)}
        >
          🆘 Trigger Custom SOS
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
          {successMsg}
        </div>
      )}

      {/* Instant 1-Click Panic Bar (for Residents & Campus users) */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem', border: '2px solid #fecaca', background: '#fff5f5' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#991b1b' }}>
          ⚡ 1-Click Fast Emergency Dispatch
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#7f1d1d', margin: '0 0 1rem' }}>
          Pressing any button below auto-detects your room/bed location and alerts on-duty security and campus responders immediately.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
          <button
            className="btn btn-primary"
            style={{ backgroundColor: '#dc2626', border: 'none', padding: '0.75rem', fontWeight: 700 }}
            disabled={triggering}
            onClick={() => handleInstantPanic('MEDICAL')}
          >
            🚑 Medical Emergency
          </button>
          <button
            className="btn btn-primary"
            style={{ backgroundColor: '#ea580c', border: 'none', padding: '0.75rem', fontWeight: 700 }}
            disabled={triggering}
            onClick={() => handleInstantPanic('FIRE')}
          >
            🔥 Fire Hazard
          </button>
          <button
            className="btn btn-primary"
            style={{ backgroundColor: '#4338ca', border: 'none', padding: '0.75rem', fontWeight: 700 }}
            disabled={triggering}
            onClick={() => handleInstantPanic('SECURITY_THREAT')}
          >
            🛡️ Security / Intruder
          </button>
          <button
            className="btn btn-primary"
            style={{ backgroundColor: '#b45309', border: 'none', padding: '0.75rem', fontWeight: 700 }}
            disabled={triggering}
            onClick={() => handleInstantPanic('GAS_LEAK')}
          >
            ⚠️ Gas / Chemical Leak
          </button>
        </div>
      </div>

      {/* Security Summary Cards */}
      {isSecurity && summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #dc2626', background: summary.activeAlerts > 0 ? '#fff1f2' : '#fff' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE ALERTS</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626', margin: '0.25rem 0' }}>
              {summary.activeAlerts}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Require immediate response</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ea580c' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>CRITICAL SEVERITY</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ea580c', margin: '0.25rem 0' }}>
              {summary.criticalAlerts}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highest priority</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #0284c7' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACKNOWLEDGED</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0284c7', margin: '0.25rem 0' }}>
              {summary.acknowledgedAlerts}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Responders en route</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>RESOLVED TODAY</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', margin: '0.25rem 0' }}>
              {summary.resolvedAlerts}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completed incidents</div>
          </div>
        </div>
      )}

      {/* Security Filter Bar */}
      {isSecurity && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by code, resident name, or location..."
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
            <option value="ACTIVE">Active (Unresolved)</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_ALARM">False Alarm</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      )}

      {/* Emergency Alerts Feed Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading live feed...</div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            🟢 No emergency alerts logged. Campus premises are secure.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Alert Code</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Emergency Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Location / Unit</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Caller / Resident</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Severity &amp; Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                  {isSecurity && <th style={{ padding: '0.75rem 1rem' }}>Command Actions</th>}
                </tr>
              </thead>
              <tbody>
                {alerts.map((alt) => (
                  <tr key={alt.id} style={{ borderBottom: '1px solid #f1f5f9', background: alt.status === 'ACTIVE' ? '#fff1f2' : 'transparent' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>
                      {alt.alertCode}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{alt.type}</div>
                      {alt.description && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {alt.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{alt.locationDetails}</div>
                      {alt.roomNumber && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Room: {alt.roomNumber} ({alt.buildingName})</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{alt.residentName || 'Campus Staff'}</div>
                      {alt.residentPhone && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>📞 {alt.residentPhone}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {getSeverityBadge(alt.severity)}
                        {getStatusBadge(alt.status)}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>
                      <div>{new Date(alt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                      <div style={{ fontSize: '0.75rem' }}>{new Date(alt.createdAt).toLocaleDateString()}</div>
                    </td>
                    {isSecurity && (
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {alt.status === 'ACTIVE' && (
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderColor: '#0284c7', color: '#0284c7' }}
                              onClick={() => handleAcknowledge(alt.alertCode)}
                            >
                              Acknowledge
                            </button>
                          )}
                          {(alt.status === 'ACTIVE' || alt.status === 'ACKNOWLEDGED') && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#10b981', border: 'none' }}
                              onClick={() => {
                                setActiveAlertToResolve(alt);
                                setResolveForm({ status: 'RESOLVED', notes: '' });
                              }}
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Custom SOS Trigger */}
      {showSosModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '1.75rem', border: '2px solid #ef4444' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#dc2626' }}>
              🆘 Dispatch Emergency Alert
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem' }}>
              This broadcasts an immediate alert to central security and on-duty supervisors.
            </p>

            <form onSubmit={handleTriggerSos} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Emergency Type *</label>
                <select
                  required
                  value={sosForm.type}
                  onChange={(e) => setSosForm({ ...sosForm, type: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="MEDICAL">🚑 Medical Emergency</option>
                  <option value="FIRE">🔥 Fire Hazard</option>
                  <option value="SECURITY_THREAT">🛡️ Security Threat / Intruder</option>
                  <option value="GAS_LEAK">⚠️ Gas / Chemical Leak</option>
                  <option value="ELEVATOR_TRAP">🛗 Elevator Trapped</option>
                  <option value="NATURAL_DISASTER">🌪️ Natural Disaster</option>
                  <option value="OTHER">❗ Other Critical Incident</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Severity Level</label>
                <select
                  value={sosForm.severity}
                  onChange={(e) => setSosForm({ ...sosForm, severity: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="CRITICAL">🔴 Critical (Life/Property Immediate Hazard)</option>
                  <option value="HIGH">🟠 High Priority</option>
                  <option value="MEDIUM">🟡 Medium Priority</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Location (leave blank to auto-detect your room)</label>
                <input
                  type="text"
                  placeholder="e.g. Block A 2nd Floor Corridor / Cafeteria"
                  value={sosForm.locationDetails}
                  onChange={(e) => setSosForm({ ...sosForm, locationDetails: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Situation Details</label>
                <textarea
                  rows="2"
                  placeholder="Describe patient condition, fire scale, or suspicious person..."
                  value={sosForm.description}
                  onChange={(e) => setSosForm({ ...sosForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowSosModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#dc2626', border: 'none' }} disabled={triggering}>
                  {triggering ? 'Broadcasting...' : 'DISPATCH SOS NOW'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Incident */}
      {activeAlertToResolve && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              🛡️ Resolve Incident: {activeAlertToResolve.alertCode}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem' }}>
              Type: <strong>{activeAlertToResolve.type}</strong> at <strong>{activeAlertToResolve.locationDetails}</strong>
            </p>

            <form onSubmit={handleResolveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Outcome Status *</label>
                <select
                  value={resolveForm.status}
                  onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="RESOLVED">Resolved (Responders handled situation)</option>
                  <option value="FALSE_ALARM">False Alarm / Accidental Trigger</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Resolution Notes / Action Taken *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Summarize paramedic intervention, security check, or site clearing..."
                  value={resolveForm.notes}
                  onChange={(e) => setResolveForm({ ...resolveForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setActiveAlertToResolve(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10b981', border: 'none' }} disabled={resolving}>
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
