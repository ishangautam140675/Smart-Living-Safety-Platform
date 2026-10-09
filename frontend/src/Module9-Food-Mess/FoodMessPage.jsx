import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { foodService } from './foodService';

import { syncHub } from '../utils/syncHub';

const MEAL_TIMES = {
  BREAKFAST: { label: 'Breakfast', icon: '🍳', time: '07:30 AM – 09:30 AM', color: '#f59e0b' },
  LUNCH:     { label: 'Lunch',     icon: '🍛', time: '12:30 PM – 02:30 PM', color: '#10b981' },
  SNACKS:    { label: 'Evening Snacks', icon: '☕', time: '05:00 PM – 06:30 PM', color: '#8b5cf6' },
  DINNER:    { label: 'Dinner',    icon: '🍲', time: '07:30 PM – 09:45 PM', color: '#0284c7' }
};

export default function FoodMessPage() {
  const { user } = useAuth();

  const isResident = user?.roles?.includes('ROLE_RESIDENT');
  const isAdminOrStaff = user?.roles?.some((r) => ['ROLE_ADMIN', 'ROLE_STAFF'].includes(r));
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyMenus, setDailyMenus] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [foodCatalog, setFoodCatalog] = useState([]);

  // Admin Create/Edit Menu Modal
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuForm, setMenuForm] = useState({
    menuDate: new Date().toISOString().split('T')[0],
    mealType: 'BREAKFAST',
    title: '',
    items: '',
    isVeg: true,
    dietaryNotes: '',
    calories: '450 kcal',
    imageUrl: '',
    price: 0
  });
  const [savingMenu, setSavingMenu] = useState(false);

  // Resident Rating Modal
  const [activeMenuForFeedback, setActiveMenuForFeedback] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Resident Opt-Out Modal
  const [activeMenuForOptOut, setActiveMenuForOptOut] = useState(null);
  const [optOutReason, setOptOutReason] = useState('Eating out / travelling');
  const [submittingOptOut, setSubmittingOptOut] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [menuList, stats, catalog] = await Promise.all([
        foodService.getDailyMenu(selectedDate).catch(() => []),
        isAdminOrStaff ? foodService.getMessSummary(selectedDate).catch(() => null) : null,
        foodService.getFoodCatalog().catch(() => [])
      ]);
      setDailyMenus(menuList || []);
      if (stats) setSummary(stats);
      if (catalog) setFoodCatalog(catalog);
    } catch (err) {
      setError(err.message || 'Failed to load meal data');
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate, isAdminOrStaff]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Instant cross-tab sync listener
  useEffect(() => {
    const unsubscribe = syncHub.subscribe((evt) => {
      if (evt.module === 'FOOD') {
        loadData();
      }
    });
    return unsubscribe;
  }, [loadData]);

  // Periodic background refresh every 10 seconds for opt-outs and menu changes
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle Save Menu (Admin/Staff)
  const handleSaveMenu = async (e) => {
    e.preventDefault();
    setSavingMenu(true);
    setError('');
    setSuccessMsg('');
    try {
      await foodService.createOrUpdateMenu(menuForm);
      setSuccessMsg(`Menu for ${menuForm.mealType} on ${menuForm.menuDate} saved successfully!`);
      setShowMenuModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save menu');
    } finally {
      setSavingMenu(false);
    }
  };

  // Handle Submit Feedback (Resident)
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!activeMenuForFeedback) return;
    setSubmittingFeedback(true);
    setError('');
    setSuccessMsg('');
    try {
      await foodService.recordFeedback({
        menuId: activeMenuForFeedback.id,
        rating: Number(feedbackForm.rating),
        comment: feedbackForm.comment
      });
      setSuccessMsg(`Thank you for rating today's ${activeMenuForFeedback.mealType}!`);
      setActiveMenuForFeedback(null);
      setFeedbackForm({ rating: 5, comment: '' });
      syncHub.emit('FOOD', 'RATED');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to record feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Handle Opt Out (Resident)
  const handleConfirmOptOut = async (e) => {
    e.preventDefault();
    if (!activeMenuForOptOut) return;
    setSubmittingOptOut(true);
    setError('');
    setSuccessMsg('');
    try {
      await foodService.optOutMeal({
        optOutDate: activeMenuForOptOut.menuDate,
        mealType: activeMenuForOptOut.mealType,
        reason: optOutReason
      });
      setSuccessMsg(`You have opted out of ${activeMenuForOptOut.mealType} on ${activeMenuForOptOut.menuDate}. Food waste prevented!`);
      setActiveMenuForOptOut(null);
      syncHub.emit('FOOD', 'OPT_OUT');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to opt out');
    } finally {
      setSubmittingOptOut(false);
    }
  };

  // Handle Cancel Opt Out (Resident)
  const handleCancelOptOut = async (menu) => {
    setError('');
    setSuccessMsg('');
    try {
      await foodService.cancelOptOut(menu.menuDate, menu.mealType);
      setSuccessMsg(`Meal opt-out cancelled for ${menu.mealType}. Your meal will be served!`);
      syncHub.emit('FOOD', 'CANCEL_OPT_OUT');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to cancel opt-out');
    }
  };

  const openEditModal = (menu) => {
    setMenuForm({
      menuDate: menu.menuDate,
      mealType: menu.mealType,
      title: menu.title,
      items: menu.items,
      isVeg: menu.veg,
      dietaryNotes: menu.dietaryNotes || '',
      calories: menu.calories || '',
      imageUrl: menu.imageUrl || '',
      price: menu.price || 0
    });
    setShowMenuModal(true);
  };

  // Delete a single menu entry (Admin/Staff)
  const handleDeleteMenu = async (menu) => {
    if (!window.confirm(`Delete ${menu.mealType} menu for ${menu.menuDate}?\nThis also removes related opt-outs and ratings.`)) return;
    setError('');
    setSuccessMsg('');
    try {
      await foodService.deleteMenu(menu.id);
      setSuccessMsg(`${menu.mealType} menu for ${menu.menuDate} deleted.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete menu');
    }
  };

  // Clear all old menus (Admin/Staff)
  const handleClearOldMenus = async () => {
    if (!window.confirm('Clear ALL meal menu entries older than 7 days?\nThis removes related opt-outs and ratings too.')) return;
    setError('');
    setSuccessMsg('');
    try {
      const result = await foodService.clearOldMenus();
      setSuccessMsg(`Cleared ${result.count} old menu entries from the database.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to clear old menus');
    }
  };

  // Unauthenticated Guard Screen
  if (!user) {
    return (
      <div className="card" style={{ maxWidth: 580, margin: '3.5rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.6rem' }}>
          Food &amp; Mess Dining Portal
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Please sign in to view daily dining menus, notify the mess of skipped meals, and submit food quality ratings.
        </p>
        <a href="/login" className="btn btn-primary" style={{ padding: '0.65rem 1.75rem' }}>
          Sign In to Access
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>🍽️</span> Food &amp; Mess Dining
          </h1>
          <p className="page-subtitle">
            Daily hostel meal schedule, nutritional information, food quality reviews, and zero-waste meal opt-outs.
          </p>
        </div>

        <div className="page-header-actions">
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: 'auto', fontWeight: 600 }}
          />

          <button
            className="btn btn-outline"
            onClick={() => loadData()}
            title="Refresh menu and opt-outs"
          >
            🔄 Refresh
          </button>

          {isAdminOrStaff && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setMenuForm({
                    menuDate: selectedDate,
                    mealType: 'BREAKFAST',
                    title: '',
                    items: '',
                    isVeg: true,
                    dietaryNotes: '',
                    calories: '450 kcal',
                    imageUrl: '',
                    price: 0
                  });
                  setShowMenuModal(true);
                }}
              >
                <span>➕</span> Add / Update Menu
              </button>
              <button
                className="btn btn-outline"
                onClick={handleClearOldMenus}
                style={{ borderColor: 'rgba(184, 58, 45, 0.35)', color: 'var(--danger)' }}
                title="Remove all menu entries older than 7 days"
              >
                🧹 Clear Old
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem', background: 'var(--success-light)', color: 'var(--success)', border: '1px solid rgba(58, 122, 79, 0.3)' }}>
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards for Staff */}
      {isAdminOrStaff && summary && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'linear-gradient(90deg, #3a7a4f, #5ca072)' }} />
            <div>
              <div className="kpi-label">Today's Menu Slots</div>
              <div className="kpi-value" style={{ color: 'var(--success)' }}>
                {summary.totalMenusToday} / 4
              </div>
            </div>
            <div className="kpi-subtext">Configured for {selectedDate}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'linear-gradient(90deg, #c27a1e, #e4cba7)' }} />
            <div>
              <div className="kpi-label">Meal Opt-Outs</div>
              <div className="kpi-value" style={{ color: 'var(--warning)' }}>
                {summary.totalOptOutsToday}
              </div>
            </div>
            <div className="kpi-subtext">Portions saved from waste</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-stripe" style={{ background: 'linear-gradient(90deg, var(--palette-1), #8d674f)' }} />
            <div>
              <div className="kpi-label">Community Rating</div>
              <div className="kpi-value" style={{ color: 'var(--palette-1)' }}>
                ★ {summary.averageRating}
              </div>
            </div>
            <div className="kpi-subtext">From {summary.totalFeedbacks} reviews</div>
          </div>
        </div>
      )}

      {/* Daily Meals Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading dining menu...
        </div>
      ) : dailyMenus.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍱</div>
          <div className="empty-state-title">No Meal Menu Published for {selectedDate}</div>
          <p className="empty-state-desc">
            {isAdminOrStaff
              ? 'Click "Add / Update Menu" above to configure Breakfast, Lunch, Snacks, or Dinner for this date.'
              : 'The kitchen team has not yet uploaded the meal schedule for this date. Please check back shortly.'}
          </p>
          {isAdminOrStaff && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setMenuForm({
                  menuDate: selectedDate,
                  mealType: 'BREAKFAST',
                  title: '',
                  items: '',
                  isVeg: true,
                  dietaryNotes: '',
                  calories: '450 kcal',
                  imageUrl: '',
                  price: 0
                });
                setShowMenuModal(true);
              }}
            >
              ➕ Publish Menu for Today
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {dailyMenus.map((menu) => {
            const mealConfig = MEAL_TIMES[menu.mealType] || { label: menu.mealType, icon: '🍽️', time: '', color: 'var(--palette-1)' };
            return (
              <div
                key={menu.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '1.5rem 1.6rem',
                  borderTop: `4px solid ${mealConfig.color}`,
                  position: 'relative',
                  marginBottom: 0
                }}
              >
                {/* Image */}
                {menu.imageUrl && (
                  <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem', height: '160px', background: 'var(--bg-subtle)' }}>
                    <img
                      src={menu.imageUrl}
                      alt={menu.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* Meal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                  <div>
                    <span style={{ fontSize: '1.3rem', marginRight: '0.4rem' }}>{mealConfig.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: mealConfig.color }}>
                      {mealConfig.label}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      ⏱️ {mealConfig.time}
                    </div>
                  </div>

                  <span className={`badge ${menu.veg ? 'badge-success' : 'badge-danger'}`}>
                    {menu.veg ? '🥦 VEG' : '🍗 NON-VEG'}
                  </span>
                </div>

                {/* Title & Items */}
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.35rem 0 0.65rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  {menu.title}
                  {menu.price > 0 && (
                    <span style={{ color: 'var(--palette-1)', fontSize: '0.95rem', marginLeft: '0.5rem', fontWeight: 700 }}>
                      ₹{menu.price}
                    </span>
                  )}
                </h3>

                <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, flex: 1, backgroundColor: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  {menu.items}
                </div>

                {/* Dietary & Calories */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.85rem 0 0.5rem' }}>
                  <span>🔥 {menu.calories || 'Balanced'}</span>
                  {menu.dietaryNotes && <span>ℹ️ {menu.dietaryNotes}</span>}
                </div>

                {/* Rating & Opt-out counter */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
                  <span style={{ color: 'var(--warning)', fontWeight: 800 }}>
                    ★ {menu.averageRating > 0 ? menu.averageRating : 'New'}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> ({menu.totalFeedbacks})</span>
                  </span>

                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    🚫 {menu.optOutCount} opt-outs
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  {isResident && (
                    <>
                      {menu.userOptedOut ? (
                        <button
                          onClick={() => handleCancelOptOut(menu)}
                          className="btn btn-outline"
                          style={{ flex: 1, fontSize: '0.85rem', borderColor: 'rgba(58, 122, 79, 0.4)', color: 'var(--success)' }}
                        >
                          ✅ Re-join Meal
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveMenuForOptOut(menu)}
                          className="btn btn-outline"
                          style={{ flex: 1, fontSize: '0.85rem', borderColor: 'rgba(184, 58, 45, 0.35)', color: 'var(--danger)' }}
                        >
                          🚫 Skip Meal
                        </button>
                      )}

                      <button
                        onClick={() => setActiveMenuForFeedback(menu)}
                        className="btn btn-outline"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                      >
                        ⭐ Rate
                      </button>
                    </>
                  )}

                  {isAdminOrStaff && (
                    <>
                      <button
                        onClick={() => openEditModal(menu)}
                        className="btn btn-outline"
                        style={{ flex: 1, fontSize: '0.85rem' }}
                      >
                        ✏️ Edit Menu
                      </button>
                      <button
                        onClick={() => handleDeleteMenu(menu)}
                        className="btn btn-outline"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', borderColor: 'rgba(184, 58, 45, 0.35)', color: 'var(--danger)' }}
                        title="Delete this menu entry"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Admin Add / Edit Menu */}
      {showMenuModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2 className="modal-title">🍽️ Publish / Edit Meal Menu</h2>
              <button className="modal-close-btn" onClick={() => setShowMenuModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveMenu} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>Menu Date</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={menuForm.menuDate}
                    onChange={(e) => setMenuForm({ ...menuForm, menuDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>Meal Slot</label>
                  <select
                    className="form-control"
                    value={menuForm.mealType}
                    onChange={(e) => setMenuForm({ ...menuForm, mealType: e.target.value })}
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="SNACKS">Evening Snacks</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>Main Dish / Title *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. North Indian Deluxe Thali / Masala Dosa Feast"
                  value={menuForm.title}
                  onChange={(e) => setMenuForm({ ...menuForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>Included Items *</label>
                <textarea
                  required
                  rows="3"
                  className="form-control"
                  placeholder="e.g. Paneer Butter Masala, Dal Makhani, Jeera Rice, Butter Naan, Gulab Jamun, Salad"
                  value={menuForm.items}
                  onChange={(e) => setMenuForm({ ...menuForm, items: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>Food Category</label>
                  <select
                    className="form-control"
                    value={menuForm.isVeg ? 'VEG' : 'NON_VEG'}
                    onChange={(e) => setMenuForm({ ...menuForm, isVeg: e.target.value === 'VEG' })}
                  >
                    <option value="VEG">Pure Vegetarian 🥦</option>
                    <option value="NON_VEG">Non-Vegetarian 🍗</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>Calories / Nutrition</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 550 kcal"
                    value={menuForm.calories}
                    onChange={(e) => setMenuForm({ ...menuForm, calories: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>Image URL</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://images.unsplash..."
                    value={menuForm.imageUrl}
                    onChange={(e) => setMenuForm({ ...menuForm, imageUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>Price (₹) (0 for Mess)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {foodCatalog.length > 0 && (
                <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                    Pick from Food Catalog ({foodCatalog.length} Items)
                  </label>
                  <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {foodCatalog.map((cat, idx) => (
                      <div
                        key={idx}
                        onClick={() => setMenuForm({ ...menuForm, title: cat.name, price: cat.price, imageUrl: cat.imageUrl, isVeg: cat.veg })}
                        style={{ flexShrink: 0, width: '130px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-surface)' }}
                      >
                        <img src={cat.imageUrl} alt={cat.name} style={{ width: '100%', height: '75px', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        <div style={{ padding: '0.45rem', fontSize: '0.78rem', fontWeight: 600, textAlign: 'center' }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</div>
                          <span style={{ color: 'var(--palette-1)', fontWeight: 700 }}>₹{cat.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>Dietary / Allergen Notes</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Nut-free, Jain option available upon request"
                  value={menuForm.dietaryNotes}
                  onChange={(e) => setMenuForm({ ...menuForm, dietaryNotes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowMenuModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={savingMenu} className="btn btn-primary">
                  {savingMenu ? 'Saving...' : 'Save & Publish Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Resident Opt-Out Modal */}
      {activeMenuForOptOut && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger)' }}>
                🚫 Opt Out of {activeMenuForOptOut.mealType}
              </h3>
              <button className="modal-close-btn" onClick={() => setActiveMenuForOptOut(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Notifying the kitchen in advance helps prevent meal preparation waste. You can re-join before kitchen prep starts.
            </p>

            <form onSubmit={handleConfirmOptOut} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Reason for Skipping
                </label>
                <select
                  className="form-control"
                  value={optOutReason}
                  onChange={(e) => setOptOutReason(e.target.value)}
                >
                  <option value="Eating out / social event">Eating out / social event</option>
                  <option value="Travelling out of town">Travelling out of town</option>
                  <option value="Fasting / dietary restriction">Fasting / dietary restriction</option>
                  <option value="Late office / university project">Late office / university project</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setActiveMenuForOptOut(null)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={submittingOptOut} className="btn btn-primary" style={{ background: 'var(--danger)' }}>
                  {submittingOptOut ? 'Submitting...' : 'Confirm Opt-Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Resident Feedback Modal */}
      {activeMenuForFeedback && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">⭐ Rate {activeMenuForFeedback.mealType}</h3>
              <button className="modal-close-btn" onClick={() => setActiveMenuForFeedback(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {activeMenuForFeedback.title}
            </p>

            <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Star Rating
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.9rem', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      style={{ color: star <= feedbackForm.rating ? '#f59e0b' : 'var(--border)' }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Comments / Suggestions (Optional)
                </label>
                <textarea
                  rows="3"
                  className="form-control"
                  placeholder="e.g. Taste was great, would love more chutney!"
                  value={feedbackForm.comment}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setActiveMenuForFeedback(null)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={submittingFeedback} className="btn btn-primary">
                  {submittingFeedback ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
