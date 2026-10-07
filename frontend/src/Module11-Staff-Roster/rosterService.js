import { authService } from '../Module1-Authentication/authService';

const BASE = '/api/roster';

function authHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const rosterService = {
  // Schedule a new shift
  async scheduleShift(data) {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to schedule shift');
    }
    return res.json();
  },

  // Get all shifts
  async getAllShifts() {
    const res = await fetch(BASE, { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch shifts');
    }
    return res.json();
  },

  // Get shifts for a specific date (YYYY-MM-DD)
  async getShiftsByDate(date) {
    const res = await fetch(`${BASE}/date/${date}`, { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch shifts for date');
    }
    return res.json();
  },

  // Get shifts in a date range
  async getShiftsInRange(from, to) {
    const res = await fetch(`${BASE}/range?from=${from}&to=${to}`, { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch shifts in range');
    }
    return res.json();
  },

  // Clock in a shift
  async clockIn(id) {
    const res = await fetch(`${BASE}/${id}/clock-in`, {
      method: 'PATCH',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to clock in');
    }
    return res.json();
  },

  // Clock out a shift
  async clockOut(id) {
    const res = await fetch(`${BASE}/${id}/clock-out`, {
      method: 'PATCH',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to clock out');
    }
    return res.json();
  },

  // Mark shift as absent
  async markAbsent(id) {
    const res = await fetch(`${BASE}/${id}/absent`, {
      method: 'PATCH',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to mark shift absent');
    }
    return res.json();
  },

  // Log patrol checkpoint
  async logPatrol(data) {
    const res = await fetch(`${BASE}/patrol`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to log patrol checkpoint');
    }
    return res.json();
  },

  // Get patrol logs for a shift
  async getPatrolLogs(shiftId) {
    const res = await fetch(`${BASE}/${shiftId}/patrol-logs`, { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch patrol logs');
    }
    return res.json();
  },

  // Today's roster summary
  async getSummary() {
    const res = await fetch(`${BASE}/summary`, { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch roster summary');
    }
    return res.json();
  },
};
