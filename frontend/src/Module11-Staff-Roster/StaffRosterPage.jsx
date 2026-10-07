import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { rosterService } from './rosterService';

const SHIFT_COLORS = {
  MORNING:      { bg: '#fef9c3', border: '#fbbf24', text: '#92400e' },
  AFTERNOON:    { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
  NIGHT:        { bg: '#ede9fe', border: '#7c3aed', text: '#3b0764' },
  GUARD_PATROL: { bg: '#d1fae5', border: '#059669', text: '#064e3b' },
};

const STATUS_BADGE = {
  SCHEDULED:  { bg: '#e0f2fe', color: '#0369a1', label: '🕐 Scheduled' },
  ACTIVE:     { bg: '#dcfce7', color: '#15803d', label: '🟢 Active' },
  COMPLETED:  { bg: '#f0fdf4', color: '#166534', label: '✅ Completed' },
  ABSENT:     { bg: '#fee2e2', color: '#991b1b', label: '❌ Absent' },
  CANCELLED:  { bg: '#f3f4f6', color: '#374151', label: '🚫 Cancelled' },
};

function SummaryCard({ label, value, icon, color = '#3b82f6' }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '1.25rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      borderLeft: `4px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    }}>
      <span style={{ fontSize: '2rem' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{label}</div>
      </div>
    </div>
  );
}

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
      setShifts(shiftsData);
      setSummary(summaryData);
    } catch {
      setError('Failed to load roster data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!user) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 400, margin: '0 auto', background: '#fff', borderRadius: 16, padding: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Authentication Required</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Please sign in to access Staff Roster</p>
          <a href="/login" className="btn btn-primary">Sign In to Access</a>
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

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>
            👮 Module 11 — Staff & Guard Duty Roster
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280' }}>
            Manage shifts, clock-in/out, patrol checkpoints, and guard duty logs
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowScheduleForm(s => !s)}>
          {showScheduleForm ? '✕ Cancel' : '+ Schedule Shift'}
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}
      {success && <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem' }}>{success}</div>}

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <SummaryCard label="Shifts Today" value={summary.totalShiftsToday} icon="📋" color="#3b82f6" />
          <SummaryCard label="Active Now" value={summary.activeShifts} icon="🟢" color="#059669" />
          <SummaryCard label="Completed" value={summary.completedShifts} icon="✅" color="#16a34a" />
          <SummaryCard label="Absent" value={summary.absentShifts} icon="❌" color="#dc2626" />
          <SummaryCard label="Patrols Today" value={summary.patrolCheckpointsToday} icon="📍" color="#7c3aed" />
          <SummaryCard label="Incidents" value={summary.incidentsLogged} icon="⚠️" color="#f59e0b" />
        </div>
      )}

      {/* Schedule Form */}
      {showScheduleForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>📋 Schedule New Shift</h3>
          <form onSubmit={handleSchedule} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Staff User ID</label>
              <input type="number" className="form-control" value={form.staffUserId}
                onChange={e => setForm(f => ({ ...f, staffUserId: e.target.value }))} required min="1" />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Shift Type</label>
              <select className="form-control" value={form.shiftType} onChange={e => setForm(f => ({ ...f, shiftType: e.target.value }))}>
                <option value="MORNING">🌅 Morning</option>
                <option value="AFTERNOON">☀️ Afternoon</option>
                <option value="NIGHT">🌙 Night</option>
                <option value="GUARD_PATROL">🛡️ Guard Patrol</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Date</label>
              <input type="date" className="form-control" value={form.shiftDate}
                onChange={e => setForm(f => ({ ...f, shiftDate: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Location</label>
              <input type="text" className="form-control" placeholder="e.g. Main Gate, Block A"
                value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Notes (optional)</label>
              <input type="text" className="form-control" placeholder="Additional notes..."
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Schedule</button>
            </div>
          </form>
        </div>
      )}

      {/* Shifts Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading shifts...</div>
      ) : shifts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af', background: '#f9fafb', borderRadius: 12 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p>No shifts scheduled yet. Click <strong>+ Schedule Shift</strong> to begin.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {shifts.map(shift => {
            const colors = SHIFT_COLORS[shift.shiftType] || SHIFT_COLORS.MORNING;
            const badge = STATUS_BADGE[shift.status] || STATUS_BADGE.SCHEDULED;
            return (
              <div key={shift.id} style={{
                background: '#fff',
                border: `1px solid ${colors.border}`,
                borderLeft: `5px solid ${colors.border}`,
                borderRadius: 10,
                padding: '1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <span style={{ background: colors.bg, color: colors.text, padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>
                      {shift.shiftType.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{shift.staffName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{shift.staffEmail}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>📅 {shift.shiftDate}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>📍 {shift.location}</div>
                  </div>
                  {(shift.clockInTime || shift.clockOutTime) && (
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {shift.clockInTime && <div>🕐 In: {new Date(shift.clockInTime).toLocaleTimeString()}</div>}
                      {shift.clockOutTime && <div>🕔 Out: {new Date(shift.clockOutTime).toLocaleTimeString()}</div>}
                    </div>
                  )}
                  <span style={{ background: badge.bg, color: badge.color, padding: '0.2rem 0.65rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                    {badge.label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {shift.status === 'SCHEDULED' && (
                    <>
                      <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', background: '#dcfce7', border: '1px solid #6ee7b7', color: '#065f46' }}
                        onClick={() => handleClockIn(shift.id)}>
                        🟢 Clock In
                      </button>
                      <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b' }}
                        onClick={() => handleMarkAbsent(shift.id)}>
                        ❌ Absent
                      </button>
                    </>
                  )}
                  {shift.status === 'ACTIVE' && (
                    <>
                      <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', background: '#ede9fe', border: '1px solid #a78bfa', color: '#4c1d95' }}
                        onClick={() => openPatrolModal(shift.id)}>
                        📍 Log Patrol
                      </button>
                      <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', background: '#dbeafe', border: '1px solid #93c5fd', color: '#1e40af' }}
                        onClick={() => handleClockOut(shift.id)}>
                        🔵 Clock Out
                      </button>
                    </>
                  )}
                  {(shift.status === 'COMPLETED' || shift.status === 'ABSENT') && (
                    <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                      onClick={() => openPatrolModal(shift.id)}>
                      📋 View Logs
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patrol Log Modal */}
      {patrolModalShiftId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>📍 Patrol Logs — Shift #{patrolModalShiftId}</h3>
              <button onClick={() => setPatrolModalShiftId(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>

            {/* Log Patrol Form (only for ACTIVE shifts) */}
            {shifts.find(s => s.id === patrolModalShiftId)?.status === 'ACTIVE' && (
              <form onSubmit={handleLogPatrol} style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>+ Log New Checkpoint</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input type="text" className="form-control" placeholder="Checkpoint name (e.g. Gate A, Parking)" required
                    value={patrolForm.checkpointName} onChange={e => setPatrolForm(f => ({ ...f, checkpointName: e.target.value }))} />
                  <input type="text" className="form-control" placeholder="Observation remarks"
                    value={patrolForm.observationRemarks} onChange={e => setPatrolForm(f => ({ ...f, observationRemarks: e.target.value }))} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={patrolForm.incidentFlag} onChange={e => setPatrolForm(f => ({ ...f, incidentFlag: e.target.checked }))} />
                    ⚠️ Flag as Incident
                  </label>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Log Checkpoint</button>
                </div>
              </form>
            )}

            {/* Patrol log list */}
            {patrolLogs.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center' }}>No patrol logs yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {patrolLogs.map(log => (
                  <div key={log.id} style={{ background: log.incidentFlag ? '#fef2f2' : '#f8fafc', border: `1px solid ${log.incidentFlag ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 8, padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>📍 {log.checkpointName}</span>
                      {log.incidentFlag && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>⚠️ INCIDENT</span>}
                    </div>
                    {log.observationRemarks && <div style={{ fontSize: '0.85rem', color: '#374151' }}>{log.observationRemarks}</div>}
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      {new Date(log.verifiedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
