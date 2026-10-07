/**
 * Module 7: SOS & Emergency Alerts Service
 * API client for panic buttons, emergency response, and security feed
 */

import { authService } from '../Module1-Authentication/authService';

const BASE_URL = '/api/emergency';

function authHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const emergencyService = {
  // Trigger SOS alert (Resident or Staff)
  async triggerSos(data) {
    const res = await fetch(`${BASE_URL}/sos`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to trigger SOS alert');
    }
    return res.json();
  },

  // Get current resident's emergency alerts
  async getMyAlerts() {
    const res = await fetch(`${BASE_URL}/my-alerts`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch personal emergency alerts');
    }
    return res.json();
  },

  // Search/list all active and historical alerts (Security/Admin)
  async searchAlerts(keyword = '', status = '', severity = '') {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);

    const res = await fetch(`${BASE_URL}/alerts?${params.toString()}`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch emergency alerts');
    }
    return res.json();
  },

  // Acknowledge alert (Security/Admin)
  async acknowledgeAlert(alertCode) {
    const res = await fetch(`${BASE_URL}/alerts/${encodeURIComponent(alertCode)}/acknowledge`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to acknowledge alert');
    }
    return res.json();
  },

  // Resolve alert (Security/Admin)
  async resolveAlert(alertCode, data) {
    const res = await fetch(`${BASE_URL}/alerts/${encodeURIComponent(alertCode)}/resolve`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to resolve emergency alert');
    }
    return res.json();
  },

  // Emergency summary KPI stats
  async getSummary() {
    const res = await fetch(`${BASE_URL}/summary`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch emergency stats');
    }
    return res.json();
  }
};
