const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const authService = {
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Login failed');
    }

    const { token, id, email: userEmail, fullName, roles } = result.data;
    const user = { id, email: userEmail, fullName, roles };

    sessionStorage.setItem('smart_token', token);
    sessionStorage.setItem('smart_user', JSON.stringify(user));
    localStorage.setItem('smart_token', token);
    localStorage.setItem('smart_user', JSON.stringify(user));

    return { token, user };
  },

  async register(fullName, email, password, phone, role) {
    const payload = { fullName, email, password, phone };
    if (role) {
      payload.role = role;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Registration failed');
    }

    const { token, id, email: userEmail, fullName: userFullName, roles } = result.data;
    const user = { id, email: userEmail, fullName: userFullName, roles };

    sessionStorage.setItem('smart_token', token);
    sessionStorage.setItem('smart_user', JSON.stringify(user));
    localStorage.setItem('smart_token', token);
    localStorage.setItem('smart_user', JSON.stringify(user));

    return { token, user };
  },

  async fetchProfile() {
    const token = this.getToken();
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      this.logout();
      throw new Error('Session expired');
    }
    if (!response.ok) {
      throw new Error('Backend unavailable, please wait...');
    }
    const result = await response.json();
    if (!result.success) {
      this.logout();
      throw new Error(result.message || 'Session expired');
    }

    return result.data;
  },

  logout() {
    sessionStorage.removeItem('smart_token');
    sessionStorage.removeItem('smart_user');
    localStorage.removeItem('smart_token');
    localStorage.removeItem('smart_user');
  },

  getToken() {
    return sessionStorage.getItem('smart_token') || localStorage.getItem('smart_token');
  },

  getUser() {
    const userStr = sessionStorage.getItem('smart_user') || localStorage.getItem('smart_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};
