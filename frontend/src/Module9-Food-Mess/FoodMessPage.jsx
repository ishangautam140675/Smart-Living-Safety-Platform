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

  // Admin Create/Edit Menu Modal
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuForm, setMenuForm] = useState({
    menuDate: new Date().toISOString().split('T')[0],
    mealType: 'BREAKFAST',
    title: '',
    items: '',
    isVeg: true,
    dietaryNotes: '',
    calories: '450 kcal'
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
      const [menuList, stats] = await Promise.all([
        foodService.getDailyMenu(selectedDate).catch(() => []),
        isAdminOrStaff ? foodService.getMessSummary(selectedDate).catch(() => null) : null
      ]);
      setDailyMenus(menuList || []);
      if (stats) setSummary(stats);
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
      calories: menu.calories || ''
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
      <div style={{ padding: '60px 24px', maxWidth: 600, margin: '40px auto', textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Food &amp; Mess Management</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Please sign in to view daily dining menus, notify the mess of skipped meals, and submit food quality ratings.
        </p>
        <a href="/login" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, backgroundColor: '#0d6efd', color: '#fff' }}>
          Sign In to Access
        </a>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            🍽️ Food &amp; Mess Management
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)' }}>
            Daily hostel meal schedule, dietary nutrition, anti-waste meal opt-outs, and food quality ratings
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 600 }}
          />

          {isAdminOrStaff && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline"
                onClick={() => loadData()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                title="Refresh menu and opt-outs"
              >
                🔄 Refresh
              </button>
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
                    calories: '450 kcal'
                  });
                  setShowMenuModal(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>➕</span> Add / Update Menu
              </button>
              <button
                className="btn btn-outline"
                onClick={handleClearOldMenus}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#ef4444', color: '#ef4444' }}
                title="Remove all menu entries older than 7 days"
              >
                🧹 Clear Old
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b' }}>
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#166534' }}>
          ✅ {successMsg}
        </div>
      )}

      {/* KPI Cards for Staff */}
      {isAdminOrStaff && summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TODAY'S MENU SLOTS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', margin: '0.25rem 0' }}>
              {summary.totalMenusToday} / 4
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configured for {selectedDate}</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>MEAL OPT-OUTS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', margin: '0.25rem 0' }}>
              {summary.totalOptOutsToday}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Portions saved today</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f43f5e' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMMUNITY RATING</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e', margin: '0.25rem 0' }}>
              ★ {summary.averageRating}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From {summary.totalFeedbacks} resident reviews</div>
          </div>
        </div>
      )}

      {/* Daily Meals Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading dining menu...</div>
      ) : dailyMenus.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍱</div>
          <h3>No Meal Menu Published for {selectedDate}</h3>
          <p style={{ maxWidth: 450, margin: '0.5rem auto 1.5rem' }}>
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
                  calories: '450 kcal'
                });
                setShowMenuModal(true);
              }}
            >
              ➕ Publish Menu for Today
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {dailyMenus.map((menu) => {
            const mealConfig = MEAL_TIMES[menu.mealType] || { label: menu.mealType, icon: '🍽️', time: '', color: '#475569' };
            return (
              <div
                key={menu.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '1.5rem',
                  borderTop: `4px solid ${mealConfig.color}`,
                  position: 'relative'
                }}
              >
                {/* Meal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '1.3rem', marginRight: '0.35rem' }}>{mealConfig.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: mealConfig.color }}>
                      {mealConfig.label}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      ⏱️ {mealConfig.time}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: menu.veg ? '#dcfce7' : '#fee2e2',
                      color: menu.veg ? '#166534' : '#991b1b',
                      border: `1px solid ${menu.veg ? '#86efac' : '#fca5a5'}`
                    }}
                  >
                    {menu.veg ? '🟢 VEG' : '🔴 NON-VEG'}
                  </span>
                </div>

                {/* Title & Items */}
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--text-main)' }}>
                  {menu.title}
                </h3>
                <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, flex: 1, backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {menu.items}
                </div>

                {/* Dietary & Calories */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.85rem 0 0.5rem' }}>
                  <span>🔥 {menu.calories || 'Balanced'}</span>
                  {menu.dietaryNotes && <span>ℹ️ {menu.dietaryNotes}</span>}
                </div>

                {/* Rating & Opt-out counter */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', marginTop: 'auto' }}>
                  <span style={{ color: '#e11d48', fontWeight: 700 }}>
                    ★ {menu.averageRating > 0 ? menu.averageRating : 'New'}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> ({menu.totalFeedbacks})</span>
                  </span>

                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
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
                          style={{ flex: 1, fontSize: '0.85rem', borderColor: '#10b981', color: '#10b981' }}
                        >
                          ✅ Re-join Meal
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveMenuForOptOut(menu)}
                          className="btn btn-outline"
                          style={{ flex: 1, fontSize: '0.85rem', borderColor: '#ef4444', color: '#ef4444' }}
                        >
                          🚫 Skip Meal
                        </button>
                      )}

                      <button
                        onClick={() => setActiveMenuForFeedback(menu)}
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
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
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', borderColor: '#ef4444', color: '#ef4444' }}
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>🍽️ Publish / Edit Meal Menu</h2>
              <button onClick={() => setShowMenuModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveMenu}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Menu Date</label>
                  <input
                    type="date"
                    required
                    value={menuForm.menuDate}
                    onChange={(e) => setMenuForm({ ...menuForm, menuDate: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Meal Slot</label>
                  <select
                    value={menuForm.mealType}
                    onChange={(e) => setMenuForm({ ...menuForm, mealType: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="SNACKS">Evening Snacks</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Main Dish / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Indian Deluxe Thali / Masala Dosa Feast"
                  value={menuForm.title}
                  onChange={(e) => setMenuForm({ ...menuForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Included Items</label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Paneer Butter Masala, Dal Makhani, Jeera Rice, Butter Naan, Gulab Jamun, Salad"
                  value={menuForm.items}
                  onChange={(e) => setMenuForm({ ...menuForm, items: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Food Category</label>
                  <select
                    value={menuForm.isVeg ? 'VEG' : 'NON_VEG'}
                    onChange={(e) => setMenuForm({ ...menuForm, isVeg: e.target.value === 'VEG' })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                  >
                    <option value="VEG">Pure Vegetarian 🟢</option>
                    <option value="NON_VEG">Non-Vegetarian 🔴</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Calories / Nutrition</label>
                  <input
                    type="text"
                    placeholder="e.g. 550 kcal"
                    value={menuForm.calories}
                    onChange={(e) => setMenuForm({ ...menuForm, calories: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Dietary / Allergen Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Nut-free, Jain option available upon request"
                  value={menuForm.dietaryNotes}
                  onChange={(e) => setMenuForm({ ...menuForm, dietaryNotes: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#ef4444' }}>🚫 Opt Out of {activeMenuForOptOut.mealType}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Notifying the kitchen in advance helps prevent meal preparation waste. You can re-join before kitchen prep starts.
            </p>

            <form onSubmit={handleConfirmOptOut}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Reason for Skipping</label>
                <select
                  value={optOutReason}
                  onChange={(e) => setOptOutReason(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
                >
                  <option value="Eating out / social event">Eating out / social event</option>
                  <option value="Travelling out of town">Travelling out of town</option>
                  <option value="Fasting / dietary restriction">Fasting / dietary restriction</option>
                  <option value="Late office / university project">Late office / university project</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setActiveMenuForOptOut(null)} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={submittingOptOut} className="btn btn-primary" style={{ backgroundColor: '#ef4444' }}>
                  {submittingOptOut ? 'Submitting...' : 'Confirm Opt-Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Resident Feedback Modal */}
      {activeMenuForFeedback && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
            <h3 style={{ margin: '0 0 0.5rem' }}>⭐ Rate {activeMenuForFeedback.mealType}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {activeMenuForFeedback.title}
            </p>

            <form onSubmit={handleSubmitFeedback}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Star Rating</label>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.8rem', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      style={{ color: star <= feedbackForm.rating ? '#f59e0b' : '#cbd5e1' }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Comments / Suggestions (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Taste was great, would love more chutney!"
                  value={feedbackForm.comment}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
