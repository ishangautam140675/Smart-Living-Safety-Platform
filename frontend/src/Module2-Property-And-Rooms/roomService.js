const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('smart_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export const roomService = {
  async getRooms(filters = {}) {
    const params = new URLSearchParams();
    if (filters.floorId) params.append('floorId', filters.floorId);
    if (filters.buildingId) params.append('buildingId', filters.buildingId);
    if (filters.propertyId) params.append('propertyId', filters.propertyId);
    if (filters.status) params.append('status', filters.status);
    if (filters.roomType) params.append('roomType', filters.roomType);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/rooms${queryString}`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to fetch rooms');
    }
    return result.data;
  },

  async getRoomSummary() {
    const response = await fetch(`${API_BASE_URL}/api/rooms/summary`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to fetch room summary');
    }
    return result.data;
  },

  async getRoomById(id) {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${id}`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to fetch room');
    }
    return result.data;
  },

  async createRoom(roomData) {
    const response = await fetch(`${API_BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(roomData),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to create room');
    }
    return result.data;
  },

  async updateRoom(id, roomData) {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(roomData),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to update room');
    }
    return result.data;
  },

  async deleteRoom(id) {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete room');
    }
    return result.data;
  },

  async updateBedStatus(roomId, bedId, statusData) {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/beds/${bedId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(statusData),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to update bed status');
    }
    return result.data;
  },
};
