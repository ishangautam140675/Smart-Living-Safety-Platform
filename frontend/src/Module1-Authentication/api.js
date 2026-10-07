const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Backend health check error:', error);
    throw error;
  }
}
