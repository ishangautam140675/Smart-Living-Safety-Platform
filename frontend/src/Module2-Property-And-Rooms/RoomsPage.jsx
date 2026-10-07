import React, { useState, useEffect } from 'react';
import { useAuth } from '../Module1-Authentication/AuthContext';
import { roomService } from './roomService';
import { propertyService } from './propertyService';

export default function RoomsPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isStaffOrAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_STAFF');

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
        // If we have properties, find the first floor id for the form default
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
      await roomService.createRoom({
        floorId: Number(selectedFloorId),
        roomNumber,
        roomType,
        baseRent: Number(baseRent),
        description,
      });
      setSuccessMsg(`Room ${roomNumber} created successfully with automatic bed allocation!`);
      setShowAddRoom(false);
      setRoomNumber('');
      setDescription('');
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

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      {/* Title & Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Properties &amp; Room Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Real-time room occupancy, bed allocation, and property maintenance status.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddRoom(!showAddRoom)}
            className="btn btn-primary"
            style={{ fontWeight: 600 }}
          >
            {showAddRoom ? '✕ Close Form' : '＋ Add New Room'}
          </button>
        )}
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

      {/* Occupancy KPI Metrics */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Rooms
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem' }}>
              {summary.totalRooms}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Across {summary.totalProperties} properties
            </span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Beds
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem' }}>
              {summary.totalBeds}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total resident capacity
            </span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' }}>
              Available Beds
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
              {summary.availableBeds}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Ready for allocation
            </span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, textTransform: 'uppercase' }}>
              Occupied Beds
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
              {summary.occupiedBeds}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Active residents
            </span>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Occupancy Rate
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
              {summary.occupancyRate.toFixed(1)}%
            </div>
            <div style={{
              background: '#e2e8f0',
              borderRadius: '9999px',
              height: '6px',
              marginTop: '0.5rem',
              overflow: 'hidden',
            }}>
              <div style={{
                background: 'var(--primary)',
                width: `${Math.min(100, summary.occupancyRate)}%`,
                height: '100%',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Add Room Collapsible Form */}
      {showAddRoom && (
        <div className="card" style={{
          marginBottom: '2rem',
          border: '1px solid #bfdbfe',
          backgroundColor: '#f8fafc',
          padding: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
            Add New Room &amp; Allocate Beds
          </h3>

          <form onSubmit={handleCreateRoom} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Floor ID
              </label>
              <input
                type="number"
                value={selectedFloorId}
                onChange={(e) => setSelectedFloorId(e.target.value)}
                placeholder="Floor ID (e.g. 1)"
                required
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Room Number
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 202, 301-B"
                required
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Room Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  background: 'white',
                }}
              >
                <option value="SINGLE">Single Sharing (1 Bed)</option>
                <option value="DOUBLE">Double Sharing (2 Beds)</option>
                <option value="TRIPLE">Triple Sharing (3 Beds)</option>
                <option value="FOUR_SHARING">Four Sharing (4 Beds)</option>
                <option value="DORMITORY">Dormitory (6 Beds)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Monthly Rent (₹)
              </label>
              <input
                type="number"
                value={baseRent}
                onChange={(e) => setBaseRent(e.target.value)}
                min="0"
                step="500"
                required
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Description / Amenities
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. AC, Attached washroom, Balcony view"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowAddRoom(false)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingRoom}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', fontWeight: 600 }}
              >
                {creatingRoom ? 'Creating...' : 'Create Room & Provision Beds'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Toolbar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Filter By:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              fontSize: '0.85rem',
              background: 'white',
            }}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Fully Occupied</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              fontSize: '0.85rem',
              background: 'white',
            }}
          >
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

      {/* Rooms Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading property and room details...
        </div>
      ) : rooms.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h4>No rooms found matching the criteria.</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Try resetting your filters or add a new room if you are an administrator.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}>
          {rooms.map((room) => {
            const isAvailable = room.status === 'AVAILABLE';
            const isOccupied = room.status === 'OCCUPIED';
            const statusColor = isAvailable ? '#16a34a' : isOccupied ? '#2563eb' : '#d97706';
            const statusBg = isAvailable ? '#f0fdf4' : isOccupied ? '#eff6ff' : '#fefce8';

            return (
              <div
                key={room.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Room #{room.roomNumber}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {room.buildingName || 'Main Block'} &bull; Floor {room.floorNumber}
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
                      {room.status}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Type: </span>
                      <strong>{room.roomType}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Rent: </span>
                      <strong>₹{room.baseRent?.toLocaleString()}</strong>/mo
                    </div>
                  </div>

                  {room.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {room.description}
                    </p>
                  )}

                  {/* Bed Breakdown */}
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#475569' }}>
                      <span>BED ALLOCATION</span>
                      <span>{room.occupiedBeds} / {room.capacity} OCCUPIED</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {room.beds?.map((bed) => {
                        const bedIsFree = bed.status === 'AVAILABLE';
                        const bedIsOccupied = bed.status === 'OCCUPIED';

                        return (
                          <div
                            key={bed.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.4rem 0.6rem',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '0.375rem',
                              fontSize: '0.8rem',
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>
                              🛏️ Bed {bed.bedNumber}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: bedIsFree ? '#16a34a' : bedIsOccupied ? '#2563eb' : '#d97706',
                              }}>
                                {bed.status}
                              </span>

                              {isStaffOrAdmin && (
                                <button
                                  onClick={() => handleUpdateBed(
                                    room.id,
                                    bed.id,
                                    bedIsFree ? 'OCCUPIED' : bedIsOccupied ? 'UNDER_MAINTENANCE' : 'AVAILABLE'
                                  )}
                                  className="btn btn-outline"
                                  style={{
                                    padding: '0.15rem 0.45rem',
                                    fontSize: '0.7rem',
                                    borderRadius: '0.25rem',
                                  }}
                                  title="Cycle Bed Status"
                                >
                                  {bedIsFree ? 'Allocate' : bedIsOccupied ? 'Set Maint' : 'Set Avail'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
