/**
 * Module 9: Food & Mess Management Service
 * API client for daily meals, weekly schedule, opt-out meal skipping, and ratings
 */

import { authService } from '../Module1-Authentication/authService';

const BASE_URL = '/api/food';

function authHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const foodService = {
  // Admin creates or updates a meal menu
  async createOrUpdateMenu(data) {
    const res = await fetch(`${BASE_URL}/menu`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to save meal menu');
    }
    return res.json();
  },

  // Get daily menu for a specific date (or today)
  async getDailyMenu(date = '') {
    const params = new URLSearchParams();
    if (date) params.append('date', date);

    const url = params.toString() ? `${BASE_URL}/menu/daily?${params.toString()}` : `${BASE_URL}/menu/daily`;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch daily menu');
    }
    return res.json();
  },

  // Get weekly menu starting from a date
  async getWeeklyMenu(startDate = '') {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);

    const url = params.toString() ? `${BASE_URL}/menu/weekly?${params.toString()}` : `${BASE_URL}/menu/weekly`;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch weekly menu');
    }
    return res.json();
  },

  // Resident submits rating and review
  async recordFeedback(data) {
    const res = await fetch(`${BASE_URL}/feedback`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to submit feedback');
    }
    return res.json();
  },

  // Resident opts out of a meal (anti-waste notification)
  async optOutMeal(data) {
    const res = await fetch(`${BASE_URL}/opt-out`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to opt out of meal');
    }
    return res.json();
  },

  // Resident cancels meal opt-out
  async cancelOptOut(date, mealType) {
    const params = new URLSearchParams();
    params.append('date', date);
    params.append('mealType', mealType);

    const res = await fetch(`${BASE_URL}/opt-out?${params.toString()}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to cancel meal opt-out');
    }
    return true;
  },

  // Get resident's own opt-outs
  async getMyOptOuts() {
    const res = await fetch(`${BASE_URL}/opt-out/my`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch your opt-outs');
    }
    return res.json();
  },

  // Admin gets mess statistics
  async getMessSummary(date = '') {
    const params = new URLSearchParams();
    if (date) params.append('date', date);

    const url = params.toString() ? `${BASE_URL}/summary?${params.toString()}` : `${BASE_URL}/summary`;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch mess summary');
    }
    return res.json();
  }
};
