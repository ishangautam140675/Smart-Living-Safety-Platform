import { authService } from '../Module1-Authentication/authService';

const BASE_URL = '/api/analytics';

function authHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const analyticsService = {
  async getAnalytics() {
    const res = await fetch(BASE_URL, {
      method: 'GET',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch platform analytics');
    }
    return res.json();
  },
};
