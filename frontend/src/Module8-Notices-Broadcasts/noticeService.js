/**
 * Module 8: Notice Board & Broadcast Service
 * API client for reading and publishing community announcements
 */

import { authService } from '../Module1-Authentication/authService';

const BASE_URL = '/api/notices';

function authHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const noticeService = {
  // Get all notices (with optional category and search filters)
  async getNotices(keyword = '', category = '') {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (category) params.append('category', category);

    const res = await fetch(`${BASE_URL}?${params.toString()}`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch notice board');
    }
    return res.json();
  },

  // Get notice details
  async getNoticeById(id) {
    const res = await fetch(`${BASE_URL}/${id}`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Notice #${id} not found`);
    }
    return res.json();
  },

  // Publish a new notice (Admin / Staff)
  async publishNotice(data) {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to publish notice');
    }
    return res.json();
  },

  // Toggle pin on a notice (Admin)
  async togglePin(id) {
    const res = await fetch(`${BASE_URL}/${id}/pin`, {
      method: 'PUT',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to toggle pin');
    }
    return res.json();
  },

  // Delete a notice (Admin)
  async deleteNotice(id) {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete notice');
    }
    return true;
  }
};
