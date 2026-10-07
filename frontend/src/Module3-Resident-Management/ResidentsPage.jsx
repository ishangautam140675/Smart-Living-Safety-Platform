import React, { useState, useEffect } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { residentService } from './residentService';
import { roomService } from '../Module2-Property-And-Rooms/roomService';
import { sanitizeMobileInput, getEmailFeedback, getPhoneFeedback } from '../utils/validation';


export default function ResidentsPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isSecurity = user?.roles?.includes('ROLE_SECURITY');
  const isStaff = user?.roles?.includes('ROLE_STAFF');
  const isResident = user?.roles?.includes('ROLE_RESIDENT');
  const canViewDirectory = isAdmin || isSecurity || isStaff;

  const [summary, setSummary] = useState(null);
  const [residents, setResidents] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Directory Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Onboard Resident Form
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'Resident@12345',
    bedId: '',
    admissionNumber: '',
    idProofType: 'AADHAAR',
    idProofNumber: '',
    emergencyContactName: '',
    emergencyContactRelation: 'Parent',
    emergencyContactPhone: '',
    monthlyRent: '7500',
    depositAmount: '15000',
    permanentAddress: '',
  });
  const [submittingOnboard, setSubmittingOnboard] = useState(false);

  // Edit My Profile State
  const [editingMyProfile, setEditingMyProfile] = useState(false);
  const [myProfileForm, setMyProfileForm] = useState({
    phone: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    permanentAddress: '',
  });

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter]);

  // Auto-refresh every 20 seconds so changes by resident or admin sync seamlessly
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false);
    }, 20000);
    return () => clearInterval(interval);
  }, [searchQuery, statusFilter]);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      // If resident, fetch own profile
      if (isResident) {
        residentService.getCurrentResident()
          .then((res) => {
            setMyProfile(res);
            setMyProfileForm({
              phone: res.phone || '',
              emergencyContactName: res.emergencyContactName || '',
              emergencyContactRelation: res.emergencyContactRelation || '',
              emergencyContactPhone: res.emergencyContactPhone || '',
              permanentAddress: res.permanentAddress || '',
            });
          })
          .catch(() => {});
      }

      // If authorized for directory/summary
      if (canViewDirectory || !isAuthenticated) {
        const [sumData, resList, roomsList] = await Promise.all([
          residentService.getResidentSummary().catch(() => null),
          residentService.getResidents({ search: searchQuery, status: statusFilter }).catch(() => []),
          roomService.getRooms().catch(() => []),
        ]);

        if (sumData) setSummary(sumData);
        setResidents(resList || []);

        // Flatten available beds for onboarding dropdown
        const freeBeds = [];
        roomsList.forEach((r) => {
          r.beds?.forEach((b) => {
            if (b.status === 'AVAILABLE') {
              freeBeds.push({
                id: b.id,
                label: `Room ${r.roomNumber} - Bed ${b.bedNumber} (₹${r.baseRent}/mo)`,
              });
            }
          });
        });
        setAvailableBeds(freeBeds);
      }
    } catch (err) {
      setError(err.message || 'Failed to load resident data');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setSubmittingOnboard(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        ...onboardForm,
        bedId: onboardForm.bedId ? Number(onboardForm.bedId) : null,
        monthlyRent: Number(onboardForm.monthlyRent),
        depositAmount: Number(onboardForm.depositAmount),
      };
      const created = await residentService.onboardResident(payload);
      setSuccessMsg(`Resident ${created.fullName} onboarded successfully!`);
      setShowOnboard(false);
      setOnboardForm({
        fullName: '',
        email: '',
        phone: '',
        password: 'Resident@12345',
        bedId: '',
        admissionNumber: '',
        idProofType: 'AADHAAR',
        idProofNumber: '',
        emergencyContactName: '',
        emergencyContactRelation: 'Parent',
        emergencyContactPhone: '',
        monthlyRent: '7500',
        depositAmount: '15000',
        permanentAddress: '',
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Onboarding failed');
    } finally {
      setSubmittingOnboard(false);
    }
  };

  const handleCheckout = async (residentId, residentName) => {
    if (!window.confirm(`Are you sure you want to check out ${residentName}? This will free their assigned bed.`)) {
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      await residentService.checkoutResident(residentId);
      setSuccessMsg(`Resident ${residentName} checked out successfully`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Checkout failed');
    }
  };

  const handleSaveMyProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const updated = await residentService.updateCurrentResident(myProfileForm);
      setMyProfile(updated);
      setEditingMyProfile(false);
      setSuccessMsg('Your emergency contact information has been updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '60px 24px', maxWidth: 600, margin: '40px auto', textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Resident Management Directory</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Please sign in with your Resident, Staff, or Admin account to view resident allocations, access your resident profile, or onboard residents.
        </p>
        <a href="/login" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, backgroundColor: '#0d6efd', color: '#fff' }}>
          Sign In to Access
        </a>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Resident Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Resident onboarding, room/bed mapping, emergency contacts and verification lifecycle.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => loadData(true)}
            className="btn btn-outline"
            style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            title="Refresh latest data from database"
          >
            🔄 Refresh
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowOnboard(!showOnboard)}
              className="btn btn-primary"
              style={{ fontWeight: 600 }}
            >
              {showOnboard ? '✕ Close Form' : '＋ Onboard New Resident'}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: 'var(--danger)',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: 'var(--success)',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
        }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Self-Service Card for Logged In Resident */}
      {isResident && myProfile && (
        <div className="card" style={{
          marginBottom: '2.5rem',
          border: '2px solid #93c5fd',
          backgroundColor: '#f8fafc',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span style={{
                background: '#dbeafe',
                color: '#1e40af',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                textTransform: 'uppercase',
              }}>
                My Resident Profile
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.35rem' }}>
                {myProfile.fullName}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Admission #{myProfile.admissionNumber} &bull; Check-in: {myProfile.checkInDate}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{
                background: myProfile.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                color: myProfile.status === 'ACTIVE' ? '#166534' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
              }}>
                {myProfile.status}
              </span>

              <button
                onClick={() => setEditingMyProfile(!editingMyProfile)}
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
              >
                {editingMyProfile ? 'Cancel Edit' : '✏️ Edit Contacts'}
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0',
            fontSize: '0.9rem',
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Allocated Room &amp; Bed</span>
              <strong style={{ fontSize: '1rem', color: '#1d4ed8' }}>
                {myProfile.roomNumber ? `Room ${myProfile.roomNumber} (Bed ${myProfile.bedNumber})` : 'Unassigned'}
              </strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {myProfile.buildingName} &bull; {myProfile.propertyName}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Monthly Rent</span>
              <strong>₹{myProfile.monthlyRent?.toLocaleString()}</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Deposit: ₹{myProfile.depositAmount?.toLocaleString()}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Emergency Contact</span>
              <strong>{myProfile.emergencyContactName} ({myProfile.emergencyContactRelation})</strong>
              <div style={{ fontSize: '0.8rem', color: '#047857' }}>
                📞 {myProfile.emergencyContactPhone}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem' }}>Personal Contact</span>
              <strong>{myProfile.phone}</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ✉️ {myProfile.email}
              </div>
            </div>
          </div>

          {editingMyProfile && (
            <form onSubmit={handleSaveMyProfile} style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>My Phone</label>
                <input
                  type="text"
                  value={myProfileForm.phone}
                  onChange={(e) => setMyProfileForm({ ...myProfileForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border)', borderRadius: '0.375rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Emergency Contact Name</label>
                <input
                  type="text"
                  value={myProfileForm.emergencyContactName}
                  onChange={(e) => setMyProfileForm({ ...myProfileForm, emergencyContactName: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border)', borderRadius: '0.375rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Relationship</label>
                <input
                  type="text"
                  value={myProfileForm.emergencyContactRelation}
                  onChange={(e) => setMyProfileForm({ ...myProfileForm, emergencyContactRelation: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border)', borderRadius: '0.375rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Emergency Contact Phone</label>
                <input
                  type="text"
                  value={myProfileForm.emergencyContactPhone}
                  onChange={(e) => setMyProfileForm({ ...myProfileForm, emergencyContactPhone: e.target.value })}
                  style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--border)', borderRadius: '0.375rem' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  Save Contact Updates
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* KPI Metrics */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Residents
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem' }}>
              {summary.totalResidents}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered accounts</span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Residents
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
              {summary.activeResidents}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Currently staying</span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, textTransform: 'uppercase' }}>
              Beds Allocated
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
              {summary.allocatedBedsCount}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Occupied beds</span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Checked Out
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#64748b', marginTop: '0.25rem' }}>
              {summary.checkedOutResidents}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Past admissions</span>
          </div>
        </div>
      )}

      {/* Onboard Form Modal / Collapsible */}
      {showOnboard && (
        <div className="card" style={{
          marginBottom: '2rem',
          border: '1px solid #bfdbfe',
          backgroundColor: '#f8fafc',
          padding: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
            Onboard New Resident
          </h3>

          <form onSubmit={handleOnboardSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={onboardForm.fullName}
                onChange={(e) => setOnboardForm({ ...onboardForm, fullName: e.target.value })}
                placeholder="e.g. Priya Patel"
                style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--border)', borderRadius: '0.375rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Email *
              </label>
              <input
                type="email"
                required
                value={onboardForm.email}
                onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                placeholder="priya.patel@example.com"
                style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--border)', borderRadius: '0.375rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Phone * <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem' }}>(10-digit mobile)</span>
              </label>
              <input
                type="tel"
                required
                value={onboardForm.phone}
                onChange={(e) => {
                  const digits = sanitizeMobileInput(e.target.value);
                  setOnboardForm({ ...onboardForm, phone: digits });
                }}
                placeholder="9876543210"
                maxLength={10}
                pattern="[6-9][0-9]{9}"
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  letterSpacing: onboardForm.phone.length > 0 ? '0.08em' : 'normal',
                }}
              />
              {onboardForm.phone && (
                <span style={{ fontSize: '0.75rem', color: /^[6-9]\d{9}$/.test(onboardForm.phone) ? '#10b981' : '#ef4444', marginTop: '0.2rem', display: 'block' }}>
                  {/^[6-9]\d{9}$/.test(onboardForm.phone) ? `✓ Valid mobile (${onboardForm.phone.length}/10)` : `⚠️ ${onboardForm.phone.length}/10 digits — must start with 6-9`}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Allocate Bed (Optional)
              </label>
              <select
                value={onboardForm.bedId}
                onChange={(e) => setOnboardForm({ ...onboardForm, bedId: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--border)', borderRadius: '0.375rem', background: 'white' }}
              >
                <option value="">-- No Bed (Assign Later) --</option>
                {availableBeds.map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Emergency Contact Name *
              </label>
              <input
                type="text"
                required
                value={onboardForm.emergencyContactName}
                onChange={(e) => setOnboardForm({ ...onboardForm, emergencyContactName: e.target.value })}
                placeholder="Parent or Guardian name"
                style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--border)', borderRadius: '0.375rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Emergency Contact Phone * <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.78rem' }}>(10-digit)</span>
              </label>
              <input
                type="tel"
                required
                value={onboardForm.emergencyContactPhone}
                onChange={(e) => {
                  const digits = sanitizeMobileInput(e.target.value);
                  setOnboardForm({ ...onboardForm, emergencyContactPhone: digits });
                }}
                placeholder="9871100000"
                maxLength={10}
                pattern="[6-9][0-9]{9}"
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  letterSpacing: onboardForm.emergencyContactPhone.length > 0 ? '0.08em' : 'normal',
                }}
              />
              {onboardForm.emergencyContactPhone && (
                <span style={{ fontSize: '0.75rem', color: /^[6-9]\d{9}$/.test(onboardForm.emergencyContactPhone) ? '#10b981' : '#ef4444', marginTop: '0.2rem', display: 'block' }}>
                  {/^[6-9]\d{9}$/.test(onboardForm.emergencyContactPhone) ? '✓ Valid' : `⚠️ ${onboardForm.emergencyContactPhone.length}/10 digits`}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Monthly Rent (₹)
              </label>
              <input
                type="number"
                value={onboardForm.monthlyRent}
                onChange={(e) => setOnboardForm({ ...onboardForm, monthlyRent: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--border)', borderRadius: '0.375rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                ID Proof Number (Aadhaar / ID)
              </label>
              <input
                type="text"
                value={onboardForm.idProofNumber}
                onChange={(e) => setOnboardForm({ ...onboardForm, idProofNumber: e.target.value })}
                placeholder="e.g. 1234-5678-9012"
                style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--border)', borderRadius: '0.375rem' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowOnboard(false)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingOnboard}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', fontWeight: 600 }}
              >
                {submittingOnboard ? 'Onboarding...' : 'Enroll & Allocate Bed'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Section */}
      {canViewDirectory && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
          }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
              <input
                type="text"
                placeholder="🔍 Search resident by name, email, admission #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  minWidth: '260px',
                  flex: 1,
                  padding: '0.45rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  fontSize: '0.85rem',
                }}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  fontSize: '0.85rem',
                  background: 'white',
                }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="CHECKED_OUT">Checked Out</option>
              </select>
            </div>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total: <strong>{residents.length}</strong> residents
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading resident records...
            </div>
          ) : residents.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <h4>No residents found.</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Use the "Onboard New Resident" button above to add residents.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}>
              {residents.map((r) => {
                const isActive = r.status === 'ACTIVE';
                const statusColor = isActive ? '#16a34a' : '#64748b';
                const statusBg = isActive ? '#f0fdf4' : '#f1f5f9';

                return (
                  <div
                    key={r.id}
                    className="card"
                    style={{
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{r.fullName}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Admission #{r.admissionNumber}
                          </span>
                        </div>

                        <span style={{
                          backgroundColor: statusBg,
                          color: statusColor,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}>
                          {r.status}
                        </span>
                      </div>

                      <div style={{
                        padding: '0.6rem 0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '0.375rem',
                        marginBottom: '0.75rem',
                        fontSize: '0.85rem',
                        border: '1px solid #e2e8f0',
                      }}>
                        <div style={{ color: '#1d4ed8', fontWeight: 700 }}>
                          🛏️ {r.roomNumber ? `Room ${r.roomNumber} - Bed ${r.bedNumber}` : 'No Bed Assigned'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {r.buildingName || 'Main Block'} &bull; Rent: ₹{r.monthlyRent?.toLocaleString()}/mo
                        </div>
                      </div>

                      <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: '#334155' }}>
                        <div>✉️ {r.email}</div>
                        <div>📞 {r.phone}</div>
                        <div>🚨 Emergency: <strong>{r.emergencyContactName}</strong> ({r.emergencyContactPhone})</div>
                      </div>
                    </div>

                    {isAdmin && isActive && (
                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleCheckout(r.id, r.fullName)}
                          className="btn btn-outline"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.6rem',
                            color: 'var(--danger)',
                            borderColor: '#fca5a5',
                          }}
                        >
                          Checkout Resident
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
