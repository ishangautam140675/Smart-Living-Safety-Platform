/**
 * Module 10: Inventory & Asset Management Service
 * API client for managing equipment, assets, and condition audits
 */

import { authService } from '../Module1-Authentication/authService';

const BASE_URL = '/api/inventory';

function authHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const inventoryService = {
  // Admin/Staff registers a new asset
  async createAsset(data) {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to register asset');
    }
    return res.json();
  },

  // Admin/Staff updates an existing asset
  async updateAsset(id, data) {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update asset');
    }
    return res.json();
  },

  // Staff audits condition
  async auditCondition(id, data) {
    const res = await fetch(`${BASE_URL}/${id}/audit`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to audit condition');
    }
    return res.json();
  },

  // Search/list all assets with filters
  async searchAssets({ keyword = '', category = '', condition = '', roomId = '' } = {}) {
    const params = new URLSearchParams();
    if (keyword && keyword.trim()) params.append('keyword', keyword.trim());
    if (category && category.trim() && category !== 'ALL') params.append('category', category.trim());
    if (condition && condition.trim() && condition !== 'ALL') params.append('condition', condition.trim());
    if (roomId) params.append('roomId', roomId);

    const url = params.toString() ? `${BASE_URL}?${params.toString()}` : BASE_URL;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch inventory assets');
    }
    return res.json();
  },

  // Get assets allocated to a specific room
  async getRoomAssets(roomId) {
    const res = await fetch(`${BASE_URL}/room/${roomId}`, { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch room assets');
    }
    return res.json();
  },

  // Get audit log history of an asset
  async getAuditHistory(id) {
    const res = await fetch(`${BASE_URL}/${id}/audit-history`, { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch audit history');
    }
    return res.json();
  },

  // Get inventory metrics summary
  async getSummary() {
    const res = await fetch(`${BASE_URL}/summary`, { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch inventory summary');
    }
    return res.json();
  }
};
