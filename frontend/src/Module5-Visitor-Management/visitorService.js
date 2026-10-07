/**
 * Module 5: Visitor Management Service
 * API client for managing visitor passes, check-in, and check-out
 */

import { authService } from '../Module1-Authentication/authService';

const BASE_URL = '/api/visitors';

function authHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const visitorService = {
  // Create a new visitor pass (pre-approve visit)
  async createPass(data) {
    const res = await fetch(`${BASE_URL}/passes`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create visitor pass');
    }
    return res.json();
  },

  // Get current resident's passes
  async getMyPasses() {
    const res = await fetch(`${BASE_URL}/my-passes`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch your visitor passes');
    }
    return res.json();
  },

  // Search/list all visitor passes (Security/Admin)
  async searchPasses(keyword = '', status = '') {
    const params = new URLSearchParams();
    if (keyword && keyword.trim()) params.append('keyword', keyword.trim());
    if (status && status.trim() && status !== 'ALL') params.append('status', status.trim());

    const url = params.toString() ? `${BASE_URL}/passes?${params.toString()}` : `${BASE_URL}/passes`;
    const res = await fetch(url, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch visitor passes');
    }
    return res.json();
  },

  // Look up a pass by code
  async getPassByCode(passCode) {
    const res = await fetch(`${BASE_URL}/passes/${encodeURIComponent(passCode)}`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Visitor pass ${passCode} not found`);
    }
    return res.json();
  },

  // Check-in visitor (Security/Admin)
  async checkIn(passCode, data = {}) {
    const res = await fetch(`${BASE_URL}/passes/${encodeURIComponent(passCode)}/check-in`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to check in visitor');
    }
    return res.json();
  },

  // Check-out visitor (Security/Admin)
  async checkOut(passCode, data = {}) {
    const res = await fetch(`${BASE_URL}/passes/${encodeURIComponent(passCode)}/check-out`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to check out visitor');
    }
    return res.json();
  },

  // Summary statistics (Security/Admin)
  async getSummary() {
    const res = await fetch(`${BASE_URL}/summary`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch visitor statistics');
    }
    return res.json();
  }
};
