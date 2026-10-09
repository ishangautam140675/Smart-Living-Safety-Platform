import React, { useState, useEffect } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { roomService } from './roomService';
import { propertyService } from './propertyService';
import { ROOM_IMAGE_DATASET, ROOM_DATASET_CATEGORIES } from '../utils/roomImageDataset';
import { getCustomPhotosForRoom, saveCustomPhotosForRoom } from '../utils/roomDatasetManager';
import { syncHub } from '../utils/syncHub';

// ─── Default fallback photo per room type ──────────────────────────────────
const ROOM_PHOTOS = {
  SINGLE: [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&auto=format&fit=crop&q=80',
  ],
  DOUBLE: [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
  ],
  TRIPLE: [
    'https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop&q=80',
  ],
  FOUR_SHARING: [
    'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&auto=format&fit=crop&q=80',
  ],
  DORMITORY: [
    'https://images.unsplash.com/photo-1455587734955-081b22074882?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80',
  ],
};

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80';

const ROOM_AMENITIES = {
  SINGLE: ['🌡️ AC', '🚿 Attached Bath', '📶 Hi-Speed Wi-Fi', '🪑 Study Desk', '🪟 Balcony View', '🔒 Digital Lock'],
  DOUBLE: ['🌡️ AC', '🚿 Attached Bath', '📶 Wi-Fi', '🛏️ Bunk Beds', '👕 Wardrobe', '💡 LED Lighting'],
  TRIPLE: ['🌡️ AC', '🚿 Common Bath', '📶 Wi-Fi', '🛏️ 3 Beds', '🪑 Study Desks x3', '🔌 Power Backup'],
  FOUR_SHARING: ['🌡️ Fans', '🚿 Common Bath', '📶 Wi-Fi', '🛏️ 4 Bunks', '👕 Wardrobes', '🔌 Power Backup'],
  DORMITORY: ['🌡️ Fans', '🚿 Shared Bath', '📶 Wi-Fi', '🛏️ 6 Bunks', '🔒 Lockers', '🧹 Daily Cleaning'],
};

const ROOM_TYPE_LABEL = {
  SINGLE: 'Premium Single',
  DOUBLE: 'Double Sharing',
  TRIPLE: 'Triple Sharing',
  FOUR_SHARING: 'Four Sharing',
  DORMITORY: 'Dormitory',
};

export default function RoomsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isStaffOrAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_STAFF');
  const isResident = user?.roles?.includes('ROLE_RESIDENT');

  const [summary, setSummary] = useState(null);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Add Room Modal State
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('DOUBLE');
  const [baseRent, setBaseRent] = useState('7500');
  const [description, setDescription] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Selected Photos for Newly Created / Edited Room
  const [selectedPhotosForNewRoom, setSelectedPhotosForNewRoom] = useState([]);

  // Photo gallery modal
  const [galleryRoom, setGalleryRoom] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Book room modal
  const [bookingRoom, setBookingRoom] = useState(null);
  const [bookingBedId, setBookingBedId] = useState('');
  const [bookingMsg, setBookingMsg] = useState('');

  // ── Image Dataset Selector Modal State ────────────────────────────────────
  const [showDatasetPicker, setShowDatasetPicker] = useState(false);
  const [datasetTargetRoom, setDatasetTargetRoom] = useState(null); // null means "New Room Form", or room object
  const [datasetCategory, setDatasetCategory] = useState('all');
  const [datasetSearch, setDatasetSearch] = useState('');
  const [tempSelectedPhotos, setTempSelectedPhotos] = useState([]);

  // Local assigned photos map: roomId/key -> array of photos
  const [roomCustomPhotos, setRoomCustomPhotos] = useState({});

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    fetchRequests();
  }, [statusFilter, typeFilter]);

  // Real-time cross-tab sync listener
  useEffect(() => {
    const unsubscribe = syncHub.subscribe((evt) => {
      if (evt.module === 'ROOMS' || evt.module === 'RESIDENTS') {
        loadData(false);
        fetchRequests();
      }
    });
    return unsubscribe;
  }, []);

  // Real-time polling so room/bed allocations sync across admin and resident
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false);
      fetchRequests();
    }, 45000);
    return () => clearInterval(interval);
  }, [statusFilter, typeFilter]);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const [sumData, propData, roomData] = await Promise.all([
        roomService.getRoomSummary().catch(() => null),
        propertyService.getProperties().catch(() => []),
        roomService.getRooms({
          status: statusFilter || undefined,
          roomType: typeFilter || undefined,
        }).catch(() => []),
      ]);

      if (sumData) setSummary(sumData);
      if (propData) {
        setProperties(propData);
        if (propData.length > 0 && propData[0].buildings?.length > 0) {
          const firstBldg = propData[0].buildings[0];
          if (firstBldg.floors?.length > 0) {
            setSelectedFloorId(firstBldg.floors[0].id);
          }
        }
      }
      setRooms(roomData || []);

      // Load any stored photos from localStorage for each room
      if (roomData) {
        const photoMap = {};
        roomData.forEach((r) => {
          const saved = getCustomPhotosForRoom(r);
          if (saved && saved.length > 0) {
            photoMap[`${r.roomNumber}_${r.roomType}`] = saved;
          }
        });
        setRoomCustomPhotos(photoMap);
      }
    } catch (err) {
      setError(err.message || 'Failed to load property data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDatasetPicker = (targetRoom = null) => {
    setDatasetTargetRoom(targetRoom);
    if (targetRoom) {
      const existing = roomCustomPhotos[`${targetRoom.roomNumber}_${targetRoom.roomType}`] || [];
      setTempSelectedPhotos(existing);
      // Auto-switch category based on room capacity
      if (targetRoom.capacity === 1) setDatasetCategory('1_room');
      else if (targetRoom.capacity === 2) setDatasetCategory('2_rooms');
      else if (targetRoom.capacity === 3) setDatasetCategory('3_rooms');
      else if (targetRoom.capacity === 4) setDatasetCategory('4_rooms');
      else if (targetRoom.capacity === 5) setDatasetCategory('5_rooms');
      else if (targetRoom.capacity >= 6) setDatasetCategory('6_rooms');
      else setDatasetCategory('all');
    } else {
      setTempSelectedPhotos(selectedPhotosForNewRoom);
      // Map roomType to dataset category
      const catMap = {
        SINGLE: '1_room',
        DOUBLE: '2_rooms',
        TRIPLE: '3_rooms',
        FOUR_SHARING: '4_rooms',
        DORMITORY: '6_rooms',
      };
      setDatasetCategory(catMap[roomType] || 'all');
    }
    setShowDatasetPicker(true);
  };

  const handleToggleDatasetPhoto = (item) => {
    const exists = tempSelectedPhotos.some((p) => p.id === item.id || p.url === item.url);
    if (exists) {
      setTempSelectedPhotos(tempSelectedPhotos.filter((p) => p.id !== item.id && p.url !== item.url));
    } else {
      setTempSelectedPhotos([
        ...tempSelectedPhotos,
        {
          id: item.id,
          url: item.url,
          label: `${item.view}: ${item.title}`,
          view: item.view,
        },
      ]);
    }
  };

  const handleConfirmDatasetSelection = () => {
    if (datasetTargetRoom) {
      // Saving to existing room
      saveCustomPhotosForRoom(datasetTargetRoom, tempSelectedPhotos);
      setRoomCustomPhotos((prev) => ({
        ...prev,
        [`${datasetTargetRoom.roomNumber}_${datasetTargetRoom.roomType}`]: tempSelectedPhotos,
      }));
      setSuccessMsg(`✓ Updated ${tempSelectedPhotos.length} photos for Room #${datasetTargetRoom.roomNumber}`);
    } else {
      // Saving to new room form
      setSelectedPhotosForNewRoom(tempSelectedPhotos);
      setSuccessMsg(`✓ Added ${tempSelectedPhotos.length} photos from dataset for new room`);
    }
    setShowDatasetPicker(false);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!selectedFloorId) {
      setError('Please select a floor or ensure a property/building exists');
      return;
    }
    setCreatingRoom(true);
    setError('');
    setSuccessMsg('');
    try {
      const created = await roomService.createRoom({
        floorId: Number(selectedFloorId),
        roomNumber,
        roomType,
        baseRent: Number(baseRent),
        description,
      });

      // Save selected dataset photos to localStorage for this newly created room
      if (selectedPhotosForNewRoom.length > 0) {
        saveCustomPhotosForRoom(created, selectedPhotosForNewRoom);
        setRoomCustomPhotos((prev) => ({
          ...prev,
          [`${created.roomNumber}_${created.roomType}`]: selectedPhotosForNewRoom,
        }));
      }

      setSuccessMsg(`Room ${roomNumber} created successfully with ${selectedPhotosForNewRoom.length > 0 ? selectedPhotosForNewRoom.length + ' dataset photos' : 'default photos'}!`);
      setShowAddRoom(false);
      setRoomNumber('');
      setDescription('');
      setSelectedPhotosForNewRoom([]);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleUpdateBed = async (roomId, bedId, newStatus) => {
    setError('');
    setSuccessMsg('');
    try {
      await roomService.updateBedStatus(roomId, bedId, {
        status: newStatus,
        notes: `Updated to ${newStatus} via room console`,
      });
      setSuccessMsg(`Bed status updated to ${newStatus}`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update bed status');
    }
  };

  /**
   * Get photos for a room:
   * 1. Checks if custom dataset photos exist
   * 2. Falls back to default category photos
   */
  const getPhotosForRoom = (room) => {
    const custom = roomCustomPhotos[`${room.roomNumber}_${room.roomType}`];
    if (custom && custom.length > 0) {
      return custom.map((c) => ({
        src: c.url,
        label: c.label || '📷 Room Photo',
        isDataset: true,
      }));
    }
    const defaultList = ROOM_PHOTOS[room.roomType] || [FALLBACK_PHOTO];
    return defaultList.map((src) => ({
      src,
      label: '📷 Room Photo',
      isDataset: false,
    }));
  };

  const openGallery = (room, idx = 0) => {
    setGalleryRoom(room);
    setGalleryIndex(idx);
  };

  const closeGallery = () => setGalleryRoom(null);

  const [bookingNote, setBookingNote] = useState('');
  const [bookingRequests, setBookingRequests] = useState([]);
  const [adminNoteMap, setAdminNoteMap] = useState({});
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' or 'requests'

  const fetchRequests = async () => {
    try {
      if (isAdmin || user?.roles?.includes('ROLE_STAFF')) {
        const reqs = await roomService.getAllBookingRequests();
        setBookingRequests(reqs);
      } else if (isResident) {
        const reqs = await roomService.getMyBookingRequests();
        setBookingRequests(reqs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab]);

  const openBooking = (room) => {
    const freeBeds = room.beds?.filter((b) => b.status === 'AVAILABLE') || [];
    setBookingRoom({ ...room, freeBeds });
    setBookingBedId(freeBeds[0]?.id || '');
    setBookingMsg('');
    setBookingNote('');
  };

  const handleBookRoom = async () => {
    if (!bookingBedId) {
      setBookingMsg('❌ Please select a bed');
      return;
    }
    setBookingMsg('⏳ Submitting booking request...');
    try {
      await roomService.submitBookingRequest(bookingRoom.id, bookingBedId, bookingNote);
      setBookingMsg('✅ Booking request submitted! Admin will confirm within 24 hrs.');
      setTimeout(() => setBookingRoom(null), 2000);
      loadData(false);
    } catch (err) {
      setBookingMsg('❌ Error: ' + err.message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      await Promise.all([
        loadData(false),
        fetchRequests(),
      ]);
      setSuccessMsg('✓ Data refreshed from cloud successfully');
      syncHub.emit('ROOMS', 'REFRESH');
      syncHub.emit('RESIDENTS', 'REFRESH');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      setError('Refresh failed: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleApproveRequest = async (id) => {
    try {
      await roomService.approveBookingRequest(id, adminNoteMap[id] || '');
      setSuccessMsg('✓ Booking approved! Resident is now ACTIVE and assigned to the bed.');
      syncHub.emit('ROOMS', 'BOOKING_APPROVED', { id });
      syncHub.emit('RESIDENTS', 'BED_ALLOCATED', { id });
      await fetchRequests();
      await loadData(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to approve: ' + err.message);
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await roomService.rejectBookingRequest(id, adminNoteMap[id] || '');
      setSuccessMsg('✓ Booking request rejected.');
      syncHub.emit('ROOMS', 'BOOKING_REJECTED', { id });
      await fetchRequests();
      await loadData(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to reject: ' + err.message);
    }
  };

  const handleDeleteRequest = async (id, status) => {
    const isApproved = status === 'APPROVED';
    const confirmPrompt = isApproved
      ? 'This booking was APPROVED. Deleting it will free the bed and unassign the resident. Are you sure you want to proceed?'
      : 'Are you sure you want to delete/cancel this booking request?';
    if (!window.confirm(confirmPrompt)) return;
    try {
      await roomService.deleteBookingRequest(id);
      setSuccessMsg('✓ Booking request deleted / cancelled successfully');
      syncHub.emit('ROOMS', 'BOOKING_DELETED', { id });
      syncHub.emit('RESIDENTS', 'BED_FREED', { id });
      await fetchRequests();
      await loadData(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to delete booking request: ' + err.message);
    }
  };
  const getStatusStyles = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', label: 'Available' };
      case 'OCCUPIED':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca', label: 'Occupied' };
      case 'UNDER_MAINTENANCE':
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'Maintenance' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', label: status };
    }
  };

  // Filtered dataset images for the picker modal
  const filteredDatasetImages = ROOM_IMAGE_DATASET.filter((img) => {
    const matchesCat = datasetCategory === 'all' || img.category === datasetCategory;
    const matchesSearch =
      !datasetSearch ||
      img.title.toLowerCase().includes(datasetSearch.toLowerCase()) ||
      img.tags.some((t) => t.toLowerCase().includes(datasetSearch.toLowerCase())) ||
      img.view.toLowerCase().includes(datasetSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Count of pending booking requests for notification badge
  const pendingRequestsCount = Array.isArray(bookingRequests)
    ? bookingRequests.filter((r) => r.status === 'PENDING').length
    : 0;

  return (
    <div>
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            🏨 Properties &amp; Room Booking
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
            Select verified 1, 2, 3, 4, 5, 6-bed images from the integrated offline dataset (100+ photos).
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn btn-outline"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              title="Refresh properties, rooms, beds and booking requests"
            >
              <span style={{ display: 'inline-block', transform: refreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s' }}>🔄</span>
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => handleOpenDatasetPicker(null)}
              className="btn btn-outline"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--palette-2)', color: 'var(--palette-1)', background: 'var(--bg-subtle)' }}
            >
              <span>🖼️ Open Photo Dataset ({ROOM_IMAGE_DATASET.length}+ Photos)</span>
            </button>
            <button onClick={() => setShowAddRoom(!showAddRoom)} className="btn btn-primary" style={{ fontWeight: 600 }}>
              {showAddRoom ? '✕ Close Form' : '＋ Add New Room'}
            </button>
          </div>
        )}
        {!isAdmin && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-outline"
            style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span style={{ display: 'inline-block', transform: refreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s' }}>🔄</span>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem', borderBottom: '2px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('rooms')}
          style={{ padding: '0.85rem 1.75rem', background: 'none', border: 'none', borderBottom: activeTab === 'rooms' ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === 'rooms' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'rooms' ? 800 : 600, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          🏨 Rooms & Beds
        </button>
        {(isResident || isAdmin || isStaffOrAdmin) && (
          <button
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '0.85rem 1.75rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'requests' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'requests' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'requests' ? 800 : 600,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span>📋 Booking Requests</span>
            {pendingRequestsCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  minWidth: '20px',
                  height: '20px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 5px',
                  marginLeft: '8px',
                  lineHeight: 1,
                  boxShadow: '0 2px 4px rgba(239,68,68,0.3)',
                }}
              >
                {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
              </span>
            )}
          </button>
        )}
      </div>

      {activeTab === 'rooms' ? (
        <>
          {/* ── Messages ──────────────────────────────────────────────────── */}
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>⚠️ {error}</div>
          )}
          {successMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              {successMsg}
            </div>
          )}

          {/* ── KPI Metrics ───────────────────────────────────────────────── */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', marginBottom: '2.25rem' }}>
              {[
                { label: 'Total Rooms', value: summary.totalRooms, sub: `${summary.totalProperties} properties`, color: 'var(--text-main)' },
                { label: 'Total Beds', value: summary.totalBeds, sub: 'Total capacity', color: 'var(--text-main)' },
                { label: 'Available Beds', value: summary.availableBeds, sub: 'Ready to book', color: 'var(--success)' },
                { label: 'Occupied Beds', value: summary.occupiedBeds, sub: 'Active residents', color: 'var(--palette-1)' },
                { label: 'Occupancy Rate', value: `${summary.occupancyRate.toFixed(1)}%`, sub: null, color: 'var(--palette-1)', isBar: true, rate: summary.occupancyRate },
              ].map((kpi, i) => (
                <div className="card" key={i} style={{ padding: '1.5rem', marginBottom: 0 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {kpi.label}
                  </span>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, color: kpi.color, marginTop: '0.35rem', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {kpi.value}
                  </div>
                  {kpi.sub && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>{kpi.sub}</span>}
                  {kpi.isBar && (
                    <div style={{ background: 'var(--border)', borderRadius: '999px', height: '6px', marginTop: '0.65rem', overflow: 'hidden' }}>
                      <div style={{ background: 'linear-gradient(90deg, var(--palette-1), var(--palette-2))', width: `${Math.min(100, kpi.rate)}%`, height: '100%', borderRadius: '999px' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

      {/* ── Add Room Form with Dataset Selector ────────────────────────── */}
      {showAddRoom && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid #bfdbfe', background: 'var(--bg-surface)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>➕ Add New Room &amp; Choose Dataset Photos</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              🖼️ {selectedPhotosForNewRoom.length} photo(s) selected from dataset
            </span>
          </div>

          <form onSubmit={handleCreateRoom} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Select Building &amp; Floor</label>
              <select
                value={selectedFloorId}
                onChange={(e) => setSelectedFloorId(e.target.value)}
                required
                className="form-control"
              >
                <option value="">-- Choose Floor --</option>
                {properties.map((prop) =>
                  prop.buildings?.map((bldg) =>
                    bldg.floors?.map((fl) => (
                      <option key={fl.id} value={fl.id}>
                        {prop.name} &bull; {bldg.name} &bull; Floor {fl.floorNumber} (ID: {fl.id})
                      </option>
                    ))
                  )
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Room Number</label>
              <input type="text" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. 202, 301-B" required className="form-control" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Room Type</label>
              <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="form-control">
                <option value="SINGLE">Single Sharing (1 Bed)</option>
                <option value="DOUBLE">Double Sharing (2 Beds)</option>
                <option value="TRIPLE">Triple Sharing (3 Beds)</option>
                <option value="FOUR_SHARING">Four Sharing (4 Beds)</option>
                <option value="DORMITORY">Dormitory (6 Beds)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Monthly Rent (₹)</label>
              <input type="number" value={baseRent} onChange={(e) => setBaseRent(e.target.value)} min="0" step="500" required className="form-control" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Description / Amenities</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. AC, Attached washroom, Balcony view, TV wall" className="form-control" />
            </div>

            {/* Room Photos Selection Section */}
            <div style={{ gridColumn: '1 / -1', background: 'var(--bg-main)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>📸 Room Photo Gallery (Complete Bedroom, Washroom, TV, Side View)</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Redirect to the offline dataset folder to select exact images for this room</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenDatasetPicker(null)}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.45rem 0.85rem', background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8', fontWeight: 700 }}
                >
                  📁 Browse &amp; Add Photos From Dataset
                </button>
              </div>

              {selectedPhotosForNewRoom.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                  {selectedPhotosForNewRoom.map((p, idx) => (
                    <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid #3b82f6', height: '90px' }}>
                      <img src={p.url} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.65rem', padding: '2px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.view}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPhotosForNewRoom(selectedPhotosForNewRoom.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No custom photos selected yet. Click <strong>"Browse &amp; Add Photos From Dataset"</strong> to pick bedroom, washroom, TV and side views.
                </div>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowAddRoom(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" disabled={creatingRoom} className="btn btn-primary">
                {creatingRoom ? 'Creating...' : 'Create Room & Provision Beds'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter Toolbar ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem', padding: '1rem 1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Filter By:</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-control" style={{ width: 'auto', padding: '0.4rem 0.75rem' }}>
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Fully Occupied</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="form-control" style={{ width: 'auto', padding: '0.4rem 0.75rem' }}>
            <option value="">All Room Types</option>
            <option value="SINGLE">Single (1 Bed)</option>
            <option value="DOUBLE">Double (2 Beds)</option>
            <option value="TRIPLE">Triple (3 Beds)</option>
            <option value="FOUR_SHARING">Four Sharing (4 Beds)</option>
            <option value="DORMITORY">Dormitory (6 Beds)</option>
          </select>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing <strong>{rooms.length}</strong> rooms
        </span>
      </div>

      {/* ── Room Grid ─────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏨</div>
          Loading rooms &amp; property data...
        </div>
      ) : rooms.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛏️</div>
          <h4>No rooms found matching this filter.</h4>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Try resetting your filters or ask an admin to add rooms.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {rooms.map((room) => {
            const photos = getPhotosForRoom(room);
            const amenities = ROOM_AMENITIES[room.roomType] || [];
            const statusStyle = getStatusStyles(room.status);
            const freeBeds = room.beds?.filter((b) => b.status === 'AVAILABLE') || [];
            const canBook = isResident && freeBeds.length > 0;
            const hasCustomPhotos = roomCustomPhotos[`${room.roomNumber}_${room.roomType}`]?.length > 0;

            return (
              <div
                key={room.id}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `1px solid ${statusStyle.border}`, borderRadius: '16px', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}
              >
                {/* ── Photo Area ── */}
                <div
                  style={{ position: 'relative', height: '210px', overflow: 'hidden', background: '#f1f5f9', cursor: 'pointer' }}
                  onClick={() => openGallery(room, 0)}
                >
                  <img
                    src={photos[0]?.src || FALLBACK_PHOTO}
                    alt={`Room ${room.roomNumber}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                    onError={(e) => { e.target.src = FALLBACK_PHOTO; }}
                    onMouseEnter={(e) => { e.target.style.transform = 'scale(1.04)'; }}
                    onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                  />

                  {hasCustomPhotos && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'linear-gradient(135deg, var(--palette-1), #8a644c)', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', boxShadow: '0 2px 8px rgba(174, 140, 116, 0.45)', letterSpacing: '0.04em' }}>
                      📁 Dataset Photos
                    </div>
                  )}

                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', backdropFilter: 'blur(4px)' }}>
                    📷 {photos.length} Photos
                  </div>

                  <div style={{ position: 'absolute', top: '10px', left: '0', background: statusStyle.color, color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.75rem 0.2rem 0.6rem', borderRadius: '0 999px 999px 0', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {room.status === 'AVAILABLE' ? '✓ Available' : room.status === 'OCCUPIED' ? '● Fully Booked' : '⚙ Maintenance'}
                  </div>
                </div>

                {/* ── Room Details ── */}
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem', letterSpacing: '-0.02em' }}>Room #{room.roomNumber}</h3>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>🏢 {room.buildingName || 'Main Block'} &bull; Floor {room.floorNumber}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--palette-1)', letterSpacing: '-0.02em' }}>₹{room.baseRent?.toLocaleString()}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>per month</div>
                    </div>
                  </div>

                  <div>
                    <span style={{ background: 'var(--bg-subtle)', color: 'var(--palette-1)', fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '999px', border: '1px solid var(--border)' }}>
                      🛏️ {ROOM_TYPE_LABEL[room.roomType] || room.roomType}
                    </span>
                    <span style={{ marginLeft: '0.5rem', background: statusStyle.bg, color: statusStyle.color, fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '999px', border: `1px solid ${statusStyle.border}` }}>
                      {freeBeds.length} bed{freeBeds.length !== 1 ? 's' : ''} free
                    </span>
                  </div>

                  {room.description && <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{room.description}</p>}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {amenities.slice(0, 5).map((a, i) => (
                      <span key={i} style={{ fontSize: '0.72rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.22rem 0.55rem', color: 'var(--text-muted)', fontWeight: 600 }}>{a}</span>
                    ))}
                    {amenities.length > 5 && <span style={{ fontSize: '0.72rem', color: 'var(--palette-1)', fontWeight: 700, padding: '0.2rem 0.5rem' }}>+{amenities.length - 5} more</span>}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      <span>BED OCCUPANCY</span><span>{room.occupiedBeds}/{room.capacity}</span>
                    </div>
                    <div style={{ background: 'var(--border)', borderRadius: '999px', height: '7px', overflow: 'hidden' }}>
                      <div style={{ background: room.occupiedBeds === room.capacity ? 'var(--danger)' : 'linear-gradient(90deg, var(--palette-1), var(--palette-2))', width: `${Math.min(100, (room.occupiedBeds / room.capacity) * 100)}%`, height: '100%', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    {/* Row 1: View / Book */}
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button onClick={() => openGallery(room, 0)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.84rem', padding: '0.55rem' }}>
                        📷 View Photos ({photos.length})
                      </button>
                      {(canBook || (!isAdmin && freeBeds.length > 0)) && (
                        <button onClick={() => openBooking(room)} className="btn btn-primary" style={{ flex: 1, fontSize: '0.84rem', padding: '0.55rem' }}>
                          📋 Book Room
                        </button>
                      )}
                    </div>

                    {/* Row 2: Admin Dataset photo picker + Bed controls */}
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          onClick={() => handleOpenDatasetPicker(room)}
                          title="Open dataset images to customize photos for this room"
                          style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', border: '1px solid var(--palette-2)', borderRadius: '8px', background: 'var(--bg-subtle)', color: 'var(--palette-1)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          🖼️ Edit Photos ({photos.length})
                        </button>
                        {room.beds?.map((bed) => {
                          const isFree = bed.status === 'AVAILABLE';
                          const isOcc = bed.status === 'OCCUPIED';
                          return (
                            <button key={bed.id}
                              onClick={() => handleUpdateBed(room.id, bed.id, isFree ? 'OCCUPIED' : isOcc ? 'UNDER_MAINTENANCE' : 'AVAILABLE')}
                              title={`Bed ${bed.bedNumber}: ${bed.status} — click to cycle`}
                              style={{ fontSize: '0.68rem', padding: '0.2rem 0.42rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, background: isFree ? '#dcfce7' : isOcc ? '#dbeafe' : '#fef3c7', color: isFree ? '#166534' : isOcc ? '#1e40af' : '#92400e' }}>
                              B{bed.bedNumber} {isFree ? '●' : isOcc ? '■' : '⚙'}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Row 2 (staff non-admin): bed controls only */}
                    {!isAdmin && isStaffOrAdmin && room.beds?.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {room.beds.map((bed) => {
                          const isFree = bed.status === 'AVAILABLE';
                          const isOcc = bed.status === 'OCCUPIED';
                          return (
                            <button key={bed.id}
                              onClick={() => handleUpdateBed(room.id, bed.id, isFree ? 'OCCUPIED' : isOcc ? 'UNDER_MAINTENANCE' : 'AVAILABLE')}
                              title={`Bed ${bed.bedNumber}: ${bed.status}`}
                              style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, background: isFree ? '#dcfce7' : isOcc ? '#dbeafe' : '#fef3c7', color: isFree ? '#166534' : isOcc ? '#1e40af' : '#92400e' }}>
                              B{bed.bedNumber} {isFree ? '●' : isOcc ? '■' : '⚙'}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      ) : (
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Booking Requests</h3>
          {bookingRequests.length === 0 ? (
             <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p>No booking requests found.</p>
             </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {bookingRequests.map(req => {
                const requestedDate = req.requestedAt ? new Date(req.requestedAt) : null;
                const minutesAgo = requestedDate ? Math.max(0, Math.floor((Date.now() - requestedDate.getTime()) / 60000)) : 0;
                const isPendingOver5Min = req.status === 'PENDING' && minutesAgo >= 5;

                return (
                  <div key={req.id} className="card" style={{ padding: '1.5rem 1.6rem', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)', marginBottom: 0 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                        <div>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)', letterSpacing: '-0.015em' }}>{req.userName}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.userEmail}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ 
                            fontSize: '0.72rem', fontWeight: 800, padding: '0.3rem 0.75rem', borderRadius: '999px',
                            background: req.status === 'PENDING' ? 'var(--warning-light)' : req.status === 'APPROVED' ? 'var(--success-light)' : 'var(--danger-light)',
                            color: req.status === 'PENDING' ? 'var(--warning)' : req.status === 'APPROVED' ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${req.status === 'PENDING' ? 'rgba(198,122,30,0.3)' : req.status === 'APPROVED' ? 'rgba(58,122,79,0.3)' : 'rgba(184,58,45,0.3)'}`
                          }}>{req.status}</span>
                          {isPendingOver5Min && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--warning)', fontWeight: 700, marginTop: '0.3rem' }}>
                              ⚠️ Waiting {minutesAgo}m
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ padding: '0.75rem 0.95rem', background: 'var(--bg-subtle)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '0.85rem', fontSize: '0.86rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--palette-1)' }}>
                          🛏️ Room {req.roomNumber} &bull; Bed {req.bedNumber}
                        </div>
                        {req.requestNote && (
                          <div style={{ marginTop: '0.4rem', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.82rem' }}>
                            "{req.requestNote}"
                          </div>
                        )}
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-faint)', marginTop: '0.4rem' }}>
                          Requested: {requestedDate ? requestedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Recently'}
                          {minutesAgo > 0 ? ` (${minutesAgo} mins ago)` : ' (Just now)'}
                        </div>
                      </div>

                      {req.adminNote && (
                         <div style={{ fontSize: '0.82rem', color: 'var(--palette-1)', marginBottom: '0.85rem', background: 'var(--primary-light)', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--primary-border)' }}>
                           <strong>Admin Note:</strong> {req.adminNote}
                         </div>
                      )}
                    </div>

                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                      {isAdmin && req.status === 'PENDING' && (
                        <div style={{ marginBottom: '0.65rem' }}>
                          <input 
                            type="text" 
                            placeholder="Admin note (e.g. Approved for semester 1)" 
                            className="form-control"
                            style={{ marginBottom: '0.5rem', fontSize: '0.8rem', padding: '0.4rem' }}
                            value={adminNoteMap[req.id] || ''}
                            onChange={(e) => setAdminNoteMap({...adminNoteMap, [req.id]: e.target.value})}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn btn-primary" 
                              style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem', background: '#16a34a', border: 'none', fontWeight: 700 }} 
                              onClick={() => handleApproveRequest(req.id)}
                            >
                              ✓ Approve &amp; Activate
                            </button>
                            <button 
                              className="btn btn-primary" 
                              style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem', background: '#e11d48', border: 'none', fontWeight: 700 }} 
                              onClick={() => handleRejectRequest(req.id)}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Delete / Cancel Option */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <button
                          onClick={() => handleDeleteRequest(req.id, req.status)}
                          className="btn btn-outline"
                          style={{
                            fontSize: '0.76rem',
                            padding: '0.3rem 0.65rem',
                            color: req.status === 'APPROVED' ? '#dc2626' : '#64748b',
                            borderColor: req.status === 'APPROVED' ? '#fca5a5' : '#cbd5e1',
                            fontWeight: 600,
                          }}
                          title={isAdmin ? 'Delete request permanently' : 'Cancel or dismiss this request'}
                        >
                          🗑️ {isAdmin ? 'Delete Request' : req.status === 'PENDING' ? 'Cancel Request' : 'Dismiss'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Photo Gallery Lightbox ────────────────────────────────────── */}
      {galleryRoom && (() => {
        const galleryPhotos = getPhotosForRoom(galleryRoom);
        const currentPhoto = galleryPhotos[galleryIndex] || galleryPhotos[0];
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={closeGallery}
          >
            <div
              style={{ position: 'relative', width: '100%', maxWidth: '880px', background: '#0f172a', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.7)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={closeGallery} style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

              {currentPhoto?.isDataset && (
                <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, background: 'linear-gradient(135deg,#0284c7,#0369a1)', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '0.3rem 0.75rem', borderRadius: '999px', boxShadow: '0 2px 8px rgba(2,132,199,0.5)' }}>
                  📁 Local Dataset Verified
                </div>
              )}

              <img
                src={currentPhoto?.src || FALLBACK_PHOTO}
                alt={`Room ${galleryRoom.roomNumber} — ${currentPhoto?.label || 'Photo'}`}
                style={{ width: '100%', height: '460px', objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.target.src = FALLBACK_PHOTO; }}
              />

              <div style={{ padding: '1.25rem', background: '#0f172a', color: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Room #{galleryRoom.roomNumber} — {ROOM_TYPE_LABEL[galleryRoom.roomType]}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.15rem' }}>
                      {galleryRoom.buildingName} &bull; Floor {galleryRoom.floorNumber} &bull; ₹{galleryRoom.baseRent?.toLocaleString()}/month
                      {currentPhoto?.label && <span style={{ marginLeft: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>• {currentPhoto.label}</span>}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => setGalleryIndex((i) => (i - 1 + galleryPhotos.length) % galleryPhotos.length)}
                      style={{ background: '#1e293b', border: 'none', color: '#fff', borderRadius: '8px', padding: '0.5rem 0.9rem', cursor: 'pointer', fontSize: '1.1rem' }}
                    >‹</button>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{galleryIndex + 1} / {galleryPhotos.length}</span>
                    <button
                      onClick={() => setGalleryIndex((i) => (i + 1) % galleryPhotos.length)}
                      style={{ background: '#1e293b', border: 'none', color: '#fff', borderRadius: '8px', padding: '0.5rem 0.9rem', cursor: 'pointer', fontSize: '1.1rem' }}
                    >›</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {galleryPhotos.map((photo, i) => (
                    <div key={i} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setGalleryIndex(i)}>
                      <img
                        src={photo.src}
                        alt={photo.label}
                        onError={(e) => { e.target.src = FALLBACK_PHOTO; }}
                        style={{ width: '72px', height: '52px', objectFit: 'cover', borderRadius: '6px', border: i === galleryIndex ? '2px solid #38bdf8' : '2px solid transparent', opacity: i === galleryIndex ? 1 : 0.6, transition: 'all 0.15s', display: 'block' }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.85rem' }}>
                  {(ROOM_AMENITIES[galleryRoom.roomType] || []).map((a, i) => (
                    <span key={i} style={{ background: '#1e293b', color: '#cbd5e1', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #334155' }}>{a}</span>
                  ))}
                </div>

                {isAdmin && (
                  <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.65rem' }}>
                    <button
                      onClick={() => { closeGallery(); handleOpenDatasetPicker(galleryRoom); }}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', background: '#0284c7', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      📁 Choose Different Photos From Dataset
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Book Room Modal ───────────────────────────────────────────── */}
      {bookingRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setBookingRoom(null)}>
          <div
            className="card"
            style={{ width: '100%', maxWidth: '480px', padding: '2rem', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
              📋 Book Room #{bookingRoom.roomNumber}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              {ROOM_TYPE_LABEL[bookingRoom.roomType]} &bull; {bookingRoom.buildingName} &bull; ₹{bookingRoom.baseRent?.toLocaleString()}/month
            </p>

            {bookingRoom.freeBeds.length === 0 ? (
              <div className="alert alert-danger">No free beds available in this room.</div>
            ) : (
              <>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                    Select a Bed
                  </label>
                  <select
                    className="form-control"
                    value={bookingBedId}
                    onChange={(e) => setBookingBedId(e.target.value)}
                  >
                    {bookingRoom.freeBeds.map((b) => (
                      <option key={b.id} value={b.id}>🛏️ Bed #{b.bedNumber} — Available</option>
                    ))}
                  </select>
                </div>

                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Estimated Monthly Cost
                  </div>
                  {[
                    { label: 'Room Rent', amount: bookingRoom.baseRent },
                    { label: 'Maintenance Fee', amount: Math.round(bookingRoom.baseRent * 0.05) },
                    { label: 'CGST @ 9%', amount: Math.round(bookingRoom.baseRent * 0.09) },
                    { label: 'SGST @ 9%', amount: Math.round(bookingRoom.baseRent * 0.09) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0', borderBottom: i < 3 ? '1px dashed var(--border)' : 'none', color: 'var(--text-main)' }}>
                      <span>{row.label}</span>
                      <span style={{ fontWeight: 600 }}>₹{row.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, marginTop: '0.65rem', color: 'var(--primary)' }}>
                    <span>Total Payable</span>
                    <span>₹{Math.round(bookingRoom.baseRent * 1.23).toLocaleString()}</span>
                  </div>
                </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                      Request Note / Preferences
                    </label>
                    <textarea
                      value={bookingNote}
                      onChange={(e) => setBookingNote(e.target.value)}
                      placeholder="Optional notes for admin..."
                      className="form-control"
                      style={{ width: '100%', padding: '0.6rem', resize: 'vertical' }}
                    />
                  </div>

                {bookingMsg && (
                  <div style={{ padding: '0.75rem', background: bookingMsg.startsWith('✅') ? '#f0fdf4' : '#f8fafc', border: `1px solid ${bookingMsg.startsWith('✅') ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '8px', fontSize: '0.88rem', marginBottom: '1rem', color: bookingMsg.startsWith('✅') ? '#166534' : '#0f172a' }}>
                    {bookingMsg}
                  </div>
                )}

                {!bookingMsg.startsWith('✅') && (
                  <button
                    onClick={handleBookRoom}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                  >
                    ✓ Confirm Booking Request
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => setBookingRoom(null)}
              className="btn btn-outline"
              style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.88rem' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Room Image Dataset Folder & Selector Modal ──────────────────── */}
      {showDatasetPicker && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setShowDatasetPicker(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '1050px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.5rem', borderRadius: '18px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', background: 'var(--bg-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.6rem' }}>📁</span>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      Room Image Dataset Browser
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Folder path: <code>frontend/public/room-dataset/</code> &bull; {datasetTargetRoom ? `Target: Room #${datasetTargetRoom.roomNumber}` : 'Target: New Room Creation Form'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDatasetPicker(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {/* Category tabs & Search bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {ROOM_DATASET_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setDatasetCategory(cat.id)}
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '0.4rem 0.75rem',
                      borderRadius: '999px',
                      border: datasetCategory === cat.id ? '2px solid #2563eb' : '1px solid var(--border)',
                      background: datasetCategory === cat.id ? '#eff6ff' : 'var(--bg-main)',
                      color: datasetCategory === cat.id ? '#1d4ed8' : 'var(--text-main)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="🔍 Search (e.g. washroom, tv, desk)..."
                value={datasetSearch}
                onChange={(e) => setDatasetSearch(e.target.value)}
                className="form-control"
                style={{ width: '220px', padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
              />
            </div>

            {/* Selection counter banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#1e40af' }}>
              <div>
                Selected <strong>{tempSelectedPhotos.length}</strong> photo(s) &bull; (Showing {filteredDatasetImages.length} images in folder)
              </div>
              {tempSelectedPhotos.length > 0 && (
                <button
                  onClick={() => setTempSelectedPhotos([])}
                  style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Images Grid */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem', paddingRight: '0.35rem' }}>
              {filteredDatasetImages.map((img) => {
                const isSelected = tempSelectedPhotos.some((p) => p.id === img.id || p.url === img.url);
                return (
                  <div
                    key={img.id}
                    onClick={() => handleToggleDatasetPhoto(img)}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: isSelected ? '3px solid #2563eb' : '1px solid var(--border)',
                      background: 'var(--bg-main)',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 8px 20px rgba(37,99,235,0.25)' : 'none',
                    }}
                  >
                    <div style={{ position: 'relative', height: '140px' }}>
                      <img
                        src={img.url}
                        alt={img.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = FALLBACK_PHOTO; }}
                      />
                      <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', backdropFilter: 'blur(4px)' }}>
                        {img.view}
                      </div>
                      <div style={{ position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', borderRadius: '50%', background: isSelected ? '#2563eb' : 'rgba(255,255,255,0.85)', color: isSelected ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', border: '1px solid rgba(0,0,0,0.1)' }}>
                        {isSelected ? '✓' : '＋'}
                      </div>
                    </div>

                    <div style={{ padding: '0.65rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3, marginBottom: '0.35rem' }}>
                        {img.title}
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {img.tags.slice(0, 3).map((t, idx) => (
                          <span key={idx} style={{ fontSize: '0.65rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer confirmation */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Tip: You can select multiple images (e.g. 1 Bedroom, 1 Washroom, 1 TV, 1 Balcony).
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowDatasetPicker(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDatasetSelection}
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                >
                  Apply {tempSelectedPhotos.length} Photo{tempSelectedPhotos.length !== 1 ? 's' : ''} to Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
