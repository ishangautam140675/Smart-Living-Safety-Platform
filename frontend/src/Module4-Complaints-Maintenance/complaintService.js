/**
 * complaintService.js
 * ---------------------
 * API service for the Complaints & Maintenance module.
 *
 * Base URL: /api/complaints
 *
 * Endpoints used:
 *  POST   /api/complaints              → submit a complaint (resident)
 *  GET    /api/complaints/my           → my complaints (resident)
 *  GET    /api/complaints              → all complaints with filters (admin/staff)
 *  GET    /api/complaints/summary      → KPI counts (admin)
 *  GET    /api/complaints/:id          → complaint detail (admin/staff)
 *  PUT    /api/complaints/:id/status   → update status (admin/staff)
 */

import { authService } from '../Module1-Authentication/authService';

const BASE_URL = '/api/complaints';

/**
 * Returns the standard Authorization header using the stored JWT.
 */
function authHeader() {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Submit a new complaint (Resident only).
 *
 * @param {{ category: string, title: string, description: string, priority?: string, roomId?: number }} data
 */
async function submitComplaint(data) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to submit complaint');
  }
  return res.json();
}

/**
 * Get the logged-in resident's own complaints (newest first).
 */
async function getMyComplaints() {
  const res = await fetch(`${BASE_URL}/my`, {
    headers: authHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch your complaints');
  }
  return res.json();
}

/**
 * Get all complaints (Admin / Staff / Security).
 *
 * @param {{ keyword?: string, status?: string }} filters
 */
async function getComplaints({ keyword = '', status = '' } = {}) {
  const params = new URLSearchParams();
  if (keyword && keyword.trim()) params.set('keyword', keyword.trim());
  if (status && status.trim() && status !== 'ALL') params.set('status', status.trim());

  const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;
  const res = await fetch(url, { headers: authHeader() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch complaints');
  }
  return res.json();
}

/**
 * Get KPI summary counts (Admin only).
 */
async function getComplaintSummary() {
  const res = await fetch(`${BASE_URL}/summary`, { headers: authHeader() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch complaint summary');
  }
  return res.json();
}

/**
 * Get a single complaint by ID (Admin / Staff / Security).
 *
 * @param {number} id
 */
async function getComplaintById(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Complaint ${id} not found`);
  return res.json();
}

/**
 * Update the status of a complaint (Admin / Staff).
 *
 * @param {number} id
 * @param {{ newStatus: string, resolutionNote?: string, assignedStaffId?: number }} data
 */
async function updateComplaintStatus(id, data) {
  const res = await fetch(`${BASE_URL}/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update complaint status');
  }
  return res.json();
}

async function deleteComplaint(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete complaint');
  }
  return true;
}

async function clearCompletedComplaints() {
  const res = await fetch(`${BASE_URL}/clear-completed`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to clear completed complaints');
  }
  return res.json();
}

export const complaintService = {
  submitComplaint,
  getMyComplaints,
  getComplaints,
  getComplaintSummary,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  clearCompletedComplaints,
};
