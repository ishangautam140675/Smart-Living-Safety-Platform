const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('smart_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export const propertyService = {
  async getProperties() {
    const response = await fetch(`${API_BASE_URL}/api/properties`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to fetch properties');
    }
    return result.data;
  },

  async createProperty(propertyData) {
    const response = await fetch(`${API_BASE_URL}/api/properties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(propertyData),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to create property');
    }
    return result.data;
  },

  async getBuildings(propertyId) {
    const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/buildings`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to fetch buildings');
    }
    return result.data;
  },

  async addBuilding(propertyId, buildingData) {
    const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/buildings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(buildingData),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to add building');
    }
    return result.data;
  },

  async getFloors(buildingId) {
    const response = await fetch(`${API_BASE_URL}/api/buildings/${buildingId}/floors`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to fetch floors');
    }
    return result.data;
  },

  async addFloor(buildingId, floorData) {
    const response = await fetch(`${API_BASE_URL}/api/buildings/${buildingId}/floors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(floorData),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to add floor');
    }
    return result.data;
  },
};
