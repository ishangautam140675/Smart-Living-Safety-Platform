import { authService } from '../Module1-Authentication/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export const residentService = {
  async getResidents(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/residents${queryString}`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to fetch residents');
    }
    return result.data;
  },

  async getResidentSummary() {
    const response = await fetch(`${API_BASE_URL}/api/residents/summary`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to fetch resident summary');
    }
    return result.data;
  },

  async getCurrentResident() {
    const response = await fetch(`${API_BASE_URL}/api/residents/me`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to fetch your resident profile');
    }
    return result.data;
  },

  async updateCurrentResident(profileData) {
    const response = await fetch(`${API_BASE_URL}/api/residents/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to update profile');
    }
    return result.data;
  },

  async onboardResident(residentData) {
    const response = await fetch(`${API_BASE_URL}/api/residents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(residentData),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to onboard resident');
    }
    return result.data;
  },

  async allocateBed(residentId, bedId) {
    const response = await fetch(`${API_BASE_URL}/api/residents/${residentId}/allocate-bed`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bedId }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to allocate bed');
    }
    return result.data;
  },

  async checkoutResident(residentId) {
    const response = await fetch(`${API_BASE_URL}/api/residents/${residentId}/checkout`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to checkout resident');
    }
    return result.data;
  },

  async deleteResident(id) {
    const response = await fetch(`${API_BASE_URL}/api/residents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Delete failed');
    }
    return result.data;
  },
};
