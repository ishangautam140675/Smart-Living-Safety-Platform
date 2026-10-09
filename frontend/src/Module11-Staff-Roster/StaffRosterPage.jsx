import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { rosterService } from './rosterService';

export default function StaffRosterPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patrolModalShiftId, setPatrolModalShiftId] = useState(null);
  const [patrolLogs, setPatrolLogs] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const [form, setForm] = useState({
    staffUserId: 1,
    shiftType: 'MORNING',
    shiftDate: new Date().toISOString().split('T')[0],
    location: '',
    notes: '',
  });
  const [patrolForm, setPatrolForm] = useState({
    checkpointName: '',
    observationRemarks: '',
    incidentFlag: false,
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [shiftsData, summaryData] = await Promise.all([
        rosterService.getAllShifts().catch(() => []),
        rosterService.getSummary().catch(() => null),
      ]);
      setShifts(shiftsData || []);
      setSummary(summaryData);
    } catch {
      setError('Failed to load roster data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // Periodic background refresh every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 20000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (!user) {
    return (
      <div className="card" style={{ maxWidth: 580, margin: '3.5rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👮</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Staff &amp; Guard Duty Roster
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Please sign in to manage shifts, clock-in/out records, patrol checkpoints, and security logs.
        </p>
        <div>
          <a href="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Sign In to Access
          </a>
        </div>
      </div>
    );
  }

  const flash = (msg, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(''), 5000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      await rosterService.scheduleShift({ ...form, staffUserId: Number(form.staffUserId) });
      flash('✅ Shift scheduled successfully!');
      setShowScheduleForm(false);
      setForm({ staffUserId: 1, shiftType: 'MORNING', shiftDate: new Date().toISOString().split('T')[0], location: '', notes: '' });
      loadData();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to schedule shift.', true);
    }
  };

  const handleClockIn = async (id) => {
    try {
      await rosterService.clockIn(id);
      flash('🟢 Clocked in successfully!');
      loadData();
    } catch (err) {
      flash(err.response?.data?.message || 'Clock-in failed.', true);
    }
  };

  const handleClockOut = async (id) => {
    try {
      await rosterService.clockOut(id);
      flash('✅ Clocked out successfully!');
      loadData();
    } catch (err) {
      flash(err.response?.data?.message || 'Clock-out failed.', true);
    }
  };

  const handleMarkAbsent = async (id) => {
    try {
      await rosterService.markAbsent(id);
      flash('❌ Marked as absent.');
      loadData();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed.', true);
    }
  };

  const openPatrolModal = async (shiftId) => {
    setPatrolModalShiftId(shiftId);
    const logs = await rosterService.getPatrolLogs(shiftId).catch(() => []);
    setPatrolLogs(logs);
  };

  const handleLogPatrol = async (e) => {
    e.preventDefault();
    try {
      await rosterService.logPatrol({ ...patrolForm, shiftId: patrolModalShiftId });
      flash('📍 Patrol checkpoint logged!');
      const logs = await rosterService.getPatrolLogs(patrolModalShiftId).catch(() => []);
      setPatrolLogs(logs);
      setPatrolForm({ checkpointName: '', observationRemarks: '', incidentFlag: false });
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to log patrol.', true);
    }
  };

  const getShiftBadge = (type) => {
    switch (type) {
      case 'MORNING':
        return <span className="badge badge-warm">🌅 MORNING</span>;
      case 'AFTERNOON':
        return <span className="badge badge-sand">☀️ AFTERNOON</span>;
      case 'NIGHT':
        return <span className="badge badge-mocha">🌙 NIGHT</span>;
      case 'GUARD_PATROL':
        return <span className="badge badge-success">🛡️ PATROL</span>;
      default:
        return <span className="badge badge-neutral">{type}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="badge badge-neutral">🕐 Scheduled</span>;
      case 'ACTIVE':
        return <span className="badge badge-success">🟢 Active</span>;
      case 'COMPLETED':
        return <span className="badge badge-cream">✅ Completed</span>;
      case 'ABSENT':
        return <span className="badge badge-danger">❌ Absent</span>;
      case 'CANCELLED':
        return <span className="badge badge-neutral">🚫 Cancelled</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            👮 Staff &amp; Guard Duty Roster
          </h1>
          <p className="page-subtitle">
            Manage personnel shifts, clock-in/out records, patrol checkpoints, and security logs
          </p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-outline"
            onClick={() => loadData()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            title="Refresh shifts and patrol checkpoints"
          >
            <span>🔄</span> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowScheduleForm((s) => !s)}>
            {showScheduleForm ? '✕ Close Form' : '➕ Schedule Shift'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
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
          <span>{success}</span>
        </div>
      )}

      {/* KPI Cards */}
      {summary && (
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--palette-1)' }} />
            <div className="kpi-label">Shifts Today</div>
            <div className="kpi-value">{summary.totalShiftsToday}</div>
            <div className="kpi-subtext">Total rostered</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--success)' }} />
            <div className="kpi-label">Active On Duty</div>
            <div className="kpi-value">{summary.activeShifts}</div>
            <div className="kpi-subtext">Clocked in right now</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--palette-2)' }} />
            <div className="kpi-label">Completed Shifts</div>
            <div className="kpi-value">{summary.completedShifts}</div>
            <div className="kpi-subtext">Finished today</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--danger)' }} />
            <div className="kpi-label">Absent / Missed</div>
            <div className="kpi-value">{summary.absentShifts}</div>
            <div className="kpi-subtext">Unfulfilled shifts</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--palette-3)' }} />
            <div className="kpi-label">Patrol Checkpoints</div>
            <div className="kpi-value">{summary.patrolCheckpointsToday}</div>
            <div className="kpi-subtext">Recorded today</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'var(--warning)' }} />
            <div className="kpi-label">Incident Flags</div>
            <div className="kpi-value">{summary.incidentsLogged}</div>
            <div className="kpi-subtext">Requires review</div>
          </div>
        </div>
      )}

      {/* Schedule Form */}
      {showScheduleForm && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem 1.75rem', border: '1px solid var(--border-focus)' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
            📋 Schedule New Staff Shift
          </h3>
          <form onSubmit={handleSchedule} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                Staff User ID
              </label>
              <input
                type="number"
                className="form-control"
                value={form.staffUserId}
                onChange={(e) => setForm((f) => ({ ...f, staffUserId: e.target.value }))}
                required
                min="1"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                Shift Type
              </label>
              <select
                className="form-control"
                value={form.shiftType}
                onChange={(e) => setForm((f) => ({ ...f, shiftType: e.target.value }))}
              >
                <option value="MORNING">🌅 Morning</option>
                <option value="AFTERNOON">☀️ Afternoon</option>
                <option value="NIGHT">🌙 Night</option>
                <option value="GUARD_PATROL">🛡️ Guard Patrol</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                Shift Date
              </label>
              <input
                type="date"
                className="form-control"
                value={form.shiftDate}
                onChange={(e) => setForm((f) => ({ ...f, shiftDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                Station / Location
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Main Gate, Block A, Dining Hall"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                Duty Notes (optional)
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Additional instructions..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 40 }}>
                Confirm Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shifts List Cards */}
      {loading ? (
        <div className="card" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>⏳</div>
          Loading shifts roster...
        </div>
      ) : shifts.length === 0 ? (
        <div className="empty-state" style={{ padding: '4rem 1rem' }}>
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No Shifts Scheduled</div>
          <div className="empty-state-desc">No duty shifts are scheduled yet. Click "+ Schedule Shift" above to assign personnel.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="card"
              style={{
                padding: '1.25rem 1.5rem',
                borderLeft: shift.status === 'ACTIVE' ? '4px solid var(--success)' : '1px solid var(--border)',
                background: shift.status === 'ACTIVE' ? 'var(--palette-4)' : 'var(--bg-surface)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: shift.status === 'ACTIVE' ? 'var(--shadow-warm-glow)' : 'var(--shadow-xs)'
              }}
            >
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  {getShiftBadge(shift.shiftType)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.98rem' }}>{shift.staffName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{shift.staffEmail}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>📅 {shift.shiftDate}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {shift.location}</div>
                </div>
                {(shift.clockInTime || shift.clockOutTime) && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {shift.clockInTime && <div>🕐 In: {new Date(shift.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                    {shift.clockOutTime && <div>🕔 Out: {new Date(shift.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                  </div>
                )}
                <div>
                  {getStatusBadge(shift.status)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {shift.status === 'SCHEDULED' && (
                  <>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', color: 'var(--success)', borderColor: 'rgba(58,122,79,0.35)' }}
                      onClick={() => handleClockIn(shift.id)}
                    >
                      🟢 Clock In
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', color: 'var(--danger)', borderColor: 'rgba(184,58,45,0.35)' }}
                      onClick={() => handleMarkAbsent(shift.id)}
                    >
                      ❌ Mark Absent
                    </button>
                  </>
                )}
                {shift.status === 'ACTIVE' && (
                  <>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', color: 'var(--palette-1)', borderColor: 'var(--palette-1)' }}
                      onClick={() => openPatrolModal(shift.id)}
                    >
                      📍 Log Checkpoint
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                      onClick={() => handleClockOut(shift.id)}
                    >
                      🔵 Clock Out
                    </button>
                  </>
                )}
                {(shift.status === 'COMPLETED' || shift.status === 'ABSENT') && (
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                    onClick={() => openPatrolModal(shift.id)}
                  >
                    📋 View Logs
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patrol Log Modal */}
      {patrolModalShiftId && (
        <div className="modal-overlay" onClick={() => setPatrolModalShiftId(null)}>
          <div className="modal-card" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📍 Patrol Logs — Shift #{patrolModalShiftId}</h3>
              <button className="modal-close-btn" onClick={() => setPatrolModalShiftId(null)}>✕</button>
            </div>

            {/* Log Patrol Form (only for ACTIVE shifts) */}
            {shifts.find((s) => s.id === patrolModalShiftId)?.status === 'ACTIVE' && (
              <form
                onSubmit={handleLogPatrol}
                style={{
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  marginTop: '1rem',
                  border: '1px solid var(--border)'
                }}
              >
                <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  + Record Patrol Checkpoint
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Checkpoint name (e.g. Gate A, West Wing, Parking)"
                    required
                    value={patrolForm.checkpointName}
                    onChange={(e) => setPatrolForm((f) => ({ ...f, checkpointName: e.target.value }))}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Observation remarks"
                    value={patrolForm.observationRemarks}
                    onChange={(e) => setPatrolForm((f) => ({ ...f, observationRemarks: e.target.value }))}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={patrolForm.incidentFlag}
                      onChange={(e) => setPatrolForm((f) => ({ ...f, incidentFlag: e.target.checked }))}
                      style={{ accentColor: 'var(--danger)', width: 16, height: 16 }}
                    />
                    ⚠️ Flag as Security Incident
                  </label>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>
                    Record Checkpoint
                  </button>
                </div>
              </form>
            )}

            {/* Patrol log list */}
            {patrolLogs.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <div className="empty-state-icon">📍</div>
                <div className="empty-state-title">No Patrol Logs Recorded</div>
                <div className="empty-state-desc">No checkpoint verifications have been logged for this shift yet.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '340px', overflowY: 'auto' }}>
                {patrolLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      background: log.incidentFlag ? 'var(--danger-light)' : 'var(--bg-subtle)',
                      border: `1px solid ${log.incidentFlag ? 'rgba(184,58,45,0.35)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>📍 {log.checkpointName}</span>
                      {log.incidentFlag && <span className="badge badge-danger">⚠️ INCIDENT</span>}
                    </div>
                    {log.observationRemarks && <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', opacity: 0.9 }}>{log.observationRemarks}</div>}
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {new Date(log.verifiedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <button onClick={() => setPatrolModalShiftId(null)} className="btn btn-outline">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
