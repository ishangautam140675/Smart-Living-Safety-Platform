/**
 * Module 6: Payments & Invoicing Service
 * API client for billing, invoices, payments, and receipts
 */

import { authService } from '../Module1-Authentication/authService';

const BASE_URL = '/api/payments';

function authHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const paymentService = {
  // Admin creates invoice
  async createInvoice(data) {
    const res = await fetch(`${BASE_URL}/invoices`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to generate invoice');
    }
    return res.json();
  },

  // Resident views own invoices
  async getMyInvoices() {
    const res = await fetch(`${BASE_URL}/my-invoices`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch your bills');
    }
    return res.json();
  },

  // Search/list all invoices (Admin/Staff)
  async searchInvoices(keyword = '', status = '') {
    const params = new URLSearchParams();
    if (keyword && keyword.trim()) params.append('keyword', keyword.trim());
    if (status && status.trim() && status !== 'ALL') params.append('status', status.trim());

    const url = params.toString() ? `${BASE_URL}/invoices?${params.toString()}` : `${BASE_URL}/invoices`;
    const res = await fetch(url, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch invoices');
    }
    return res.json();
  },

  // Get invoice details by invoice number
  async getInvoiceByNumber(invoiceNumber) {
    const res = await fetch(`${BASE_URL}/invoices/${encodeURIComponent(invoiceNumber)}`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Invoice ${invoiceNumber} not found`);
    }
    return res.json();
  },

  // Record payment against invoice
  async recordPayment(invoiceNumber, data) {
    const res = await fetch(`${BASE_URL}/invoices/${encodeURIComponent(invoiceNumber)}/pay`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Payment processing failed');
    }
    return res.json();
  },

  // Summary statistics (Admin)
  async getSummary() {
    const res = await fetch(`${BASE_URL}/summary`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch payment summary');
    }
    return res.json();
  },

  // Cancel invoice (Admin) - marks as CANCELLED
  async cancelInvoice(invoiceNumber) {
    const res = await fetch(`${BASE_URL}/invoices/${encodeURIComponent(invoiceNumber)}/cancel`, {
      method: 'PUT',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to cancel invoice');
    }
    return res.json();
  },

  // Delete invoice permanently (Admin)
  async deleteInvoice(invoiceNumber) {
    const res = await fetch(`${BASE_URL}/invoices/${encodeURIComponent(invoiceNumber)}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete invoice');
    }
  },

  // Clear all paid/cancelled invoices (Admin)
  async clearPaidInvoices() {
    const res = await fetch(`${BASE_URL}/invoices/clear-paid`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to clear paid invoices');
    }
    return res.json();
  }
};
