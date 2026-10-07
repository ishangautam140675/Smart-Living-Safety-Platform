import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { roomService } from './roomService';
import { propertyService } from './propertyService';
import { generateRoomImages, clearRoomImageCache, isGeminiConfigured, getGeminiApiKey } from '../utils/roomImageGenerator';


// ─── Room photo gallery data (curated Unsplash images per room type) ──────────
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

// Fallback photo if type not found
const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80';

// Amenity tags per room type
const ROOM_AMENITIES = {
  SINGLE: ['🌡️ AC', '🚿 Attached Bath', '📶 Hi-Speed Wi-Fi', '🪑 Study Desk', '🪟 Balcony View', '🔒 Digital Lock'],
  DOUBLE: ['🌡️ AC', '🚿 Attached Bath', '📶 Wi-Fi', '🛏️ Bunk Beds', '👕 Wardrobe', '💡 LED Lighting'],
  TRIPLE: ['🌡️ AC', '🚿 Common Bath', '📶 Wi-Fi', '🛏️ 3 Beds', '🪑 Study Desks x3', '🔌 Power Backup'],
  FOUR_SHARING: ['🌡️ Fans', '🚿 Common Bath', '📶 Wi-Fi', '🛏️ 4 Bunks', '👕 Wardrobes', '🔌 Power Backup'],
  DORMITORY: ['🌡️ Fans', '🚿 Shared Bath', '📶 Wi-Fi', '🛏️ 6 Bunks', '🔒 Lockers', '🧹 Daily Cleaning'],
};

// Friendly room-type labels
const ROOM_TYPE_LABEL = {
  SINGLE: 'Premium Single',
  DOUBLE: 'Double Sharing',
  TRIPLE: 'Triple Sharing',
  FOUR_SHARING: 'Four Sharing',
  DORMITORY: 'Dormitory',
};

export default function RoomsPage() {
  const { user, isAuthenticated } = useAuth();
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

  // Photo gallery modal
  const [galleryRoom, setGalleryRoom] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Book room modal
  const [bookingRoom, setBookingRoom] = useState(null);
  const [bookingBedId, setBookingBedId] = useState('');
  const [bookingMsg, setBookingMsg] = useState('');

  // ── AI Image Generation State ──────────────────────────────────────────────
  // Map: roomKey → array of { viewType, label, dataUri }
  const [aiImages, setAiImages] = useState({});
  // Which room is currently having images generated
  const [generatingForRoom, setGeneratingForRoom] = useState(null);
  // 0..4 — how many views completed
  const [genProgress, setGenProgress] = useState(0);
  const [genError, setGenError] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getGeminiApiKey());
  const [geminiReady, setGeminiReady] = useState(() => isGeminiConfigured());

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    if (apiKeyInput && apiKeyInput.trim()) {
      localStorage.setItem('slp_gemini_api_key', apiKeyInput.trim());
      setGeminiReady(true);
      setShowKeyModal(false);
      setSuccessMsg('✅ Gemini API key saved! AI photo generation is now active.');
    } else {
      localStorage.removeItem('slp_gemini_api_key');
      setGeminiReady(false);
      setShowKeyModal(false);
    }
  };

  /** Build a stable cache key for a room */
  const roomCacheKey = (room) => `${room.roomNumber}_${room.roomType}_${room.baseRent}`;

  /** Trigger AI image generation for a single room */
  const handleGenerateImages = useCallback(async (room) => {
    if (!isGeminiConfigured()) {
      setShowKeyModal(true);
      return;
    }
    const key = roomCacheKey(room);
    setGeneratingForRoom(key);
    setGenProgress(0);
    setGenError('');
    try {
      const imgs = await generateRoomImages(room, (step) => setGenProgress(step));
      setAiImages((prev) => ({ ...prev, [key]: imgs }));
      setGeneratingForRoom(null);
    } catch (err) {
      setGenError(`AI generation failed: ${err.message}`);
      setGeneratingForRoom(null);
    }
  }, []);

  /** Clear cached AI images and regenerate */
  const handleRegenerateImages = useCallback(async (room) => {
    clearRoomImageCache(room);
    setAiImages((prev) => {
      const copy = { ...prev };
      delete copy[roomCacheKey(room)];
      return copy;
    });
    await handleGenerateImages(room);
  }, [handleGenerateImages]);


  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter]);

  const loadData = async () => {
    setLoading(true);
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
    } catch (err) {
      setError(err.message || 'Failed to load property data');
    } finally {
      setLoading(false);
    }
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
      const newRoom = await roomService.createRoom({
        floorId: Number(selectedFloorId),
        roomNumber,
        roomType,
        baseRent: Number(baseRent),
        description,
      });
      setSuccessMsg(`Room ${roomNumber} created! ${geminiReady ? '🤖 Generating AI photos — please wait...' : '✓ Add VITE_GEMINI_API_KEY to enable AI photo generation.'}`);
      setShowAddRoom(false);
      setRoomNumber('');
      setDescription('');
      await loadData();

      // Auto-generate AI images for the newly created room
      if (geminiReady && newRoom) {
        handleGenerateImages({
          roomNumber: newRoom.roomNumber || roomNumber,
          roomType: newRoom.roomType || roomType,
          baseRent: newRoom.baseRent || Number(baseRent),
          description: newRoom.description || description,
        });
      }
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
   * Returns photos for a room:
   * - First checks if AI-generated images exist in state
   * - Falls back to Unsplash curated photos by room type
   * Returns array of { src, label } objects
   */
  const getPhotosForRoom = (room) => {
    const key = roomCacheKey(room);
    const aiImgs = aiImages[key];
    if (aiImgs && aiImgs.length > 0) {
      // AI images available — use them
      return aiImgs
        .filter((img) => img.dataUri) // only ones that successfully generated
        .map((img) => ({ src: img.dataUri, label: img.label, isAI: true }));
    }
    // Fallback to Unsplash
    const urls = ROOM_PHOTOS[room.roomType] || [FALLBACK_PHOTO];
    return urls.map((src) => ({ src, label: '📷 Room Photo', isAI: false }));
  };


  const openGallery = (room, idx = 0) => {
    setGalleryRoom(room);
    setGalleryIndex(idx);
  };

  const closeGallery = () => setGalleryRoom(null);

  const openBooking = (room) => {
    const freeBeds = room.beds?.filter((b) => b.status === 'AVAILABLE') || [];
    setBookingRoom({ ...room, freeBeds });
    setBookingBedId(freeBeds[0]?.id || '');
    setBookingMsg('');
  };

  const handleBookRoom = async () => {
    setBookingMsg('⏳ Submitting booking request...');
    setTimeout(() => {
      setBookingMsg('✅ Booking request submitted! Admin will confirm within 24 hrs. Check Payments section for invoice.');
    }, 1000);
  };

  // ─── Status colours ─────────────────────────────────────────────────────────
  const getStatusStyles = (status) => {
    if (status === 'AVAILABLE') return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
    if (status === 'OCCUPIED') return { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
    return { color: '#d97706', bg: '#fefce8', border: '#fde68a' };
  };

  return (
    <div style={{ padding: '2.5rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            🏨 Properties &amp; Room Booking
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
            Browse rooms with photos, amenities, and real-time availability. Book online instantly.
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowKeyModal(true)}
              className="btn btn-outline"
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', border: geminiReady ? '1px solid #10b981' : '1px solid #f59e0b', color: geminiReady ? '#059669' : '#d97706' }}
            >
              <span>{geminiReady ? '✨ Gemini AI: Active' : '🔑 Configure AI Key'}</span>
            </button>
            <button onClick={() => setShowAddRoom(!showAddRoom)} className="btn btn-primary" style={{ fontWeight: 600 }}>
              {showAddRoom ? '✕ Close Form' : '＋ Add New Room'}
            </button>
          </div>
        )}
      </div>


      {/* ── Messages ──────────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>⚠️ {error}</div>
      )}
      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* ── KPI Metrics ───────────────────────────────────────────────── */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Rooms', value: summary.totalRooms, sub: `${summary.totalProperties} properties`, color: 'var(--text-main)' },
            { label: 'Total Beds', value: summary.totalBeds, sub: 'Total capacity', color: 'var(--text-main)' },
            { label: 'Available Beds', value: summary.availableBeds, sub: 'Ready to book', color: '#16a34a' },
            { label: 'Occupied Beds', value: summary.occupiedBeds, sub: 'Active residents', color: '#2563eb' },
            { label: 'Occupancy Rate', value: `${summary.occupancyRate.toFixed(1)}%`, sub: null, color: '#7c3aed', isBar: true, rate: summary.occupancyRate },
          ].map((kpi, i) => (
            <div className="card" key={i} style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {kpi.label}
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: kpi.color, marginTop: '0.25rem', lineHeight: 1 }}>
                {kpi.value}
              </div>
              {kpi.sub && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{kpi.sub}</span>}
              {kpi.isBar && (
                <div style={{ background: 'var(--border)', borderRadius: '999px', height: '6px', marginTop: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ background: '#7c3aed', width: `${Math.min(100, kpi.rate)}%`, height: '100%', borderRadius: '999px' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Add Room Form ─────────────────────────────────────────────── */}
      {showAddRoom && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid #bfdbfe', background: 'var(--bg-surface)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>➕ Add New Room &amp; Provision Beds</h3>
          <form onSubmit={handleCreateRoom} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Floor ID</label>
              <input type="number" value={selectedFloorId} onChange={(e) => setSelectedFloorId(e.target.value)} placeholder="Floor ID" required className="form-control" />
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
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. AC, Attached washroom, Balcony view" className="form-control" />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
            <option value="SINGLE">Single</option>
            <option value="DOUBLE">Double</option>
            <option value="TRIPLE">Triple</option>
            <option value="FOUR_SHARING">Four Sharing</option>
            <option value="DORMITORY">Dormitory</option>
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
          Loading rooms & property data...
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
            const cardKey = roomCacheKey(room);
            const isGenThisCard = generatingForRoom === cardKey;
            const hasAI = aiImages[cardKey]?.some((img) => img.dataUri);

            return (
              <div
                key={room.id}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `1px solid ${statusStyle.border}`, borderRadius: '16px', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}
              >
                {/* ── Photo / AI Progress Area ── */}
                <div
                  style={{ position: 'relative', height: '210px', overflow: 'hidden', background: isGenThisCard ? '#0f172a' : '#f1f5f9', cursor: isGenThisCard ? 'default' : 'pointer' }}
                  onClick={() => !isGenThisCard && openGallery(room, 0)}
                >
                  {isGenThisCard ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', padding: '1.5rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #1e293b', borderTopColor: '#6366f1', animation: 'spin 0.9s linear infinite' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.3rem' }}>🤖 AI Generating Room Photos…</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                          {['Starting…', '✓ Bedroom done — generating washroom…', '✓ Washroom done — generating TV corner…', '✓ TV corner done — generating side view…', '✓ All 4 photos ready!'][genProgress]}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {['🛏️', '🚿', '📺', '🪟'].map((icon, i) => (
                          <div key={i} style={{ width: '28px', height: '28px', borderRadius: '50%', background: genProgress > i ? '#6366f1' : '#1e293b', border: genProgress === i + 1 ? '2px solid #818cf8' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', transition: 'all 0.3s' }}>
                            {genProgress > i ? '✓' : icon}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={photos[0]?.src || FALLBACK_PHOTO}
                        alt={`Room ${room.roomNumber}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                        onError={(e) => { e.target.src = FALLBACK_PHOTO; }}
                        onMouseEnter={(e) => { e.target.style.transform = 'scale(1.04)'; }}
                        onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                      />
                      {hasAI && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '999px', boxShadow: '0 2px 8px rgba(99,102,241,0.5)', letterSpacing: '0.04em' }}>
                          ✨ AI Generated
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', backdropFilter: 'blur(4px)' }}>
                        📷 {photos.length} Photos
                      </div>
                      <div style={{ position: 'absolute', top: '10px', left: '0', background: statusStyle.color, color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.75rem 0.2rem 0.6rem', borderRadius: '0 999px 999px 0', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {room.status === 'AVAILABLE' ? '✓ Available' : room.status === 'OCCUPIED' ? '● Fully Booked' : '⚙ Maintenance'}
                      </div>
                    </>
                  )}
                </div>

                {/* ── Room Details ── */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.15rem' }}>Room #{room.roomNumber}</h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🏢 {room.buildingName || 'Main Block'} &bull; Floor {room.floorNumber}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb' }}>₹{room.baseRent?.toLocaleString()}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>per month</div>
                    </div>
                  </div>

                  <div>
                    <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '999px', border: '1px solid #bfdbfe' }}>
                      🛏️ {ROOM_TYPE_LABEL[room.roomType] || room.roomType}
                    </span>
                    <span style={{ marginLeft: '0.5rem', background: statusStyle.bg, color: statusStyle.color, fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '999px', border: `1px solid ${statusStyle.border}` }}>
                      {freeBeds.length} bed{freeBeds.length !== 1 ? 's' : ''} free
                    </span>
                  </div>

                  {room.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{room.description}</p>}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {amenities.slice(0, 5).map((a, i) => (
                      <span key={i} style={{ fontSize: '0.72rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.2rem 0.5rem', color: 'var(--text-muted)', fontWeight: 500 }}>{a}</span>
                    ))}
                    {amenities.length > 5 && <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, padding: '0.2rem 0.5rem' }}>+{amenities.length - 5} more</span>}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      <span>BED OCCUPANCY</span><span>{room.occupiedBeds}/{room.capacity}</span>
                    </div>
                    <div style={{ background: 'var(--border)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ background: room.occupiedBeds === room.capacity ? '#ef4444' : '#10b981', width: `${Math.min(100, (room.occupiedBeds / room.capacity) * 100)}%`, height: '100%', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                    {/* Row 1: View / Book */}
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button onClick={() => openGallery(room, 0)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.82rem', padding: '0.5rem' }} disabled={isGenThisCard}>
                        📷 View Photos
                      </button>
                      {(canBook || (!isAdmin && freeBeds.length > 0)) && (
                        <button onClick={() => openBooking(room)} className="btn btn-primary" style={{ flex: 1, fontSize: '0.82rem', padding: '0.5rem' }}>
                          📋 Book Room
                        </button>
                      )}
                    </div>

                    {/* Row 2: Admin AI + Bed controls */}
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          onClick={() => hasAI ? handleRegenerateImages(room) : handleGenerateImages(room)}
                          disabled={isGenThisCard || !geminiReady}
                          title={!geminiReady ? 'Add VITE_GEMINI_API_KEY to frontend/.env then restart Vite' : hasAI ? 'Generate a fresh new set of unique AI room photos' : 'Generate 4 unique AI room photos (bedroom, washroom, TV, side view)'}
                          style={{ fontSize: '0.78rem', padding: '0.38rem 0.7rem', border: `1px solid ${hasAI ? '#6ee7b7' : '#818cf8'}`, borderRadius: '8px', background: !geminiReady ? '#f1f5f9' : hasAI ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#eef2ff,#e0e7ff)', color: !geminiReady ? '#94a3b8' : hasAI ? '#047857' : '#4f46e5', fontWeight: 700, cursor: (!geminiReady || isGenThisCard) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {isGenThisCard ? `🤖 ${genProgress}/4 done…` : hasAI ? '🔄 Regenerate AI' : (geminiReady ? '✨ AI Photos' : '🔑 API Key')}
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

      {/* ── Global AI gen error ──────────────────────────────────────── */}
      {genError && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1.25rem', borderRadius: '10px', fontSize: '0.85rem', zIndex: 1100, boxShadow: '0 4px 14px rgba(0,0,0,0.12)', maxWidth: '480px', textAlign: 'center' }}>
          {genError}
          <button onClick={() => setGenError('')} style={{ marginLeft: '1rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#991b1b', fontWeight: 700 }}>✕</button>
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
            {/* Close */}
            <button onClick={closeGallery} style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

            {/* AI Generated badge in lightbox */}
            {currentPhoto?.isAI && (
              <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '0.3rem 0.75rem', borderRadius: '999px', boxShadow: '0 2px 8px rgba(99,102,241,0.5)' }}>
                ✨ AI Generated Photo
              </div>
            )}

            {/* Main Photo */}
            <img
              src={currentPhoto?.src || FALLBACK_PHOTO}
              alt={`Room ${galleryRoom.roomNumber} — ${currentPhoto?.label || 'Photo'}`}
              style={{ width: '100%', height: '460px', objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.target.src = FALLBACK_PHOTO; }}
            />

            {/* Info overlay */}
            <div style={{ padding: '1.25rem', background: '#0f172a', color: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Room #{galleryRoom.roomNumber} — {ROOM_TYPE_LABEL[galleryRoom.roomType]}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.15rem' }}>
                    {galleryRoom.buildingName} &bull; Floor {galleryRoom.floorNumber} &bull; ₹{galleryRoom.baseRent?.toLocaleString()}/month
                    {currentPhoto?.label && <span style={{ marginLeft: '0.75rem', color: '#818cf8', fontWeight: 600 }}>• {currentPhoto.label}</span>}
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

              {/* Thumbnails */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {galleryPhotos.map((photo, i) => (
                  <div key={i} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setGalleryIndex(i)}>
                    <img
                      src={photo.src}
                      alt={photo.label}
                      onError={(e) => { e.target.src = FALLBACK_PHOTO; }}
                      style={{ width: '72px', height: '52px', objectFit: 'cover', borderRadius: '6px', border: i === galleryIndex ? '2px solid #6366f1' : '2px solid transparent', opacity: i === galleryIndex ? 1 : 0.6, transition: 'all 0.15s', display: 'block' }}
                    />
                    <div style={{ position: 'absolute', bottom: '2px', left: '2px', right: '2px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '0.55rem', fontWeight: 700, textAlign: 'center', borderRadius: '0 0 4px 4px', padding: '1px 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {photo.label?.replace(/^[^\s]+ /, '')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Amenities in lightbox */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.85rem' }}>
                {(ROOM_AMENITIES[galleryRoom.roomType] || []).map((a, i) => (
                  <span key={i} style={{ background: '#1e293b', color: '#cbd5e1', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #334155' }}>{a}</span>
                ))}
              </div>

              {/* Admin: regenerate from lightbox */}
              {isAdmin && (
                <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.65rem' }}>
                  <button
                    onClick={() => { closeGallery(); setTimeout(() => handleGenerateImages(galleryRoom), 100); }}
                    disabled={!geminiReady || Boolean(generatingForRoom)}
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', background: geminiReady ? 'linear-gradient(135deg,#eef2ff,#e0e7ff)' : '#1e293b', border: `1px solid ${geminiReady ? '#818cf8' : '#334155'}`, borderRadius: '8px', color: geminiReady ? '#4f46e5' : '#475569', fontWeight: 700, cursor: geminiReady ? 'pointer' : 'not-allowed' }}
                  >
                    {getPhotosForRoom(galleryRoom).some((p) => p.isAI) ? '🔄 Regenerate AI Photos' : '✨ Generate AI Photos'}
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

                {/* Stay summary */}
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
                    <span>₹{(
                      Math.round(bookingRoom.baseRent * 1.23)
                    ).toLocaleString()}</span>
                  </div>
                </div>

                {/* Amenities reminder */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
                  {(ROOM_AMENITIES[bookingRoom.roomType] || []).map((a, i) => (
                    <span key={i} style={{ fontSize: '0.72rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.15rem 0.45rem', color: 'var(--text-muted)' }}>{a}</span>
                  ))}
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

      {/* ── Gemini API Key Configuration Modal ──────────────────────────── */}
      {showKeyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowKeyModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', background: 'var(--bg-surface)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🤖</span>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Gemini AI Configuration</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Powering real-time unique 4-angle bedroom image generation</p>
              </div>
            </div>

            <form onSubmit={handleSaveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="form-control"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Keys are stored securely in browser memory/localStorage or can be placed in <code>frontend/.env</code>.
                </span>
              </div>

              <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                💡 <strong>How it works:</strong> When you create or regenerate a room, Gemini AI creates 4 distinct angles (Full Bedroom, Attached Washroom, TV Wall, and Wardrobe view) using randomized architecture styles.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowKeyModal(false)} className="btn btn-outline" style={{ padding: '0.55rem 1rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
                  Save &amp; Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

