package com.smartliving.module2propertyrooms.rooms.service;

import com.smartliving.common.exception.AppException;
import com.smartliving.common.exception.ResourceNotFoundException;
import com.smartliving.module2propertyrooms.properties.model.Floor;
import com.smartliving.module2propertyrooms.properties.repository.BuildingRepository;
import com.smartliving.module2propertyrooms.properties.repository.FloorRepository;
import com.smartliving.module2propertyrooms.properties.repository.PropertyRepository;
import com.smartliving.module2propertyrooms.rooms.dto.BedResponse;
import com.smartliving.module2propertyrooms.rooms.dto.BedStatusUpdateRequest;
import com.smartliving.module2propertyrooms.rooms.dto.RoomRequest;
import com.smartliving.module2propertyrooms.rooms.dto.RoomResponse;
import com.smartliving.module2propertyrooms.rooms.dto.RoomSummaryResponse;
import com.smartliving.module2propertyrooms.rooms.model.Bed;
import com.smartliving.module2propertyrooms.rooms.model.BedStatus;
import com.smartliving.module2propertyrooms.rooms.model.Room;
import com.smartliving.module2propertyrooms.rooms.model.RoomStatus;
import com.smartliving.module2propertyrooms.rooms.model.RoomType;
import com.smartliving.module2propertyrooms.rooms.repository.BedRepository;
import com.smartliving.module2propertyrooms.rooms.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final FloorRepository floorRepository;
    private final BuildingRepository buildingRepository;
    private final PropertyRepository propertyRepository;

    public RoomService(RoomRepository roomRepository,
                       BedRepository bedRepository,
                       FloorRepository floorRepository,
                       BuildingRepository buildingRepository,
                       PropertyRepository propertyRepository) {
        this.roomRepository = roomRepository;
        this.bedRepository = bedRepository;
        this.floorRepository = floorRepository;
        this.buildingRepository = buildingRepository;
        this.propertyRepository = propertyRepository;
    }

    public RoomResponse createRoom(RoomRequest request) {
        Floor floor = floorRepository.findById(request.getFloorId())
                .orElseThrow(() -> new ResourceNotFoundException("Floor", "id", request.getFloorId()));

        if (roomRepository.existsByFloorIdAndRoomNumber(request.getFloorId(), request.getRoomNumber())) {
            throw new AppException("Room " + request.getRoomNumber() + " already exists on this floor");
        }

        int capacity = request.getCapacity() != null ? request.getCapacity() : getDefaultCapacity(request.getRoomType());

        Room room = new Room(
                floor,
                request.getRoomNumber(),
                request.getRoomType(),
                capacity,
                request.getBaseRent(),
                request.getDescription()
        );

        Room savedRoom = roomRepository.save(room);

        // Automatically provision beds based on capacity
        List<Bed> generatedBeds = new ArrayList<>();
        for (int i = 0; i < capacity; i++) {
            char suffix = (char) ('A' + i);
            String bedNumber = request.getRoomNumber() + "-" + suffix;
            Bed bed = new Bed(savedRoom, bedNumber, BedStatus.AVAILABLE);
            generatedBeds.add(bedRepository.save(bed));
        }

        savedRoom.setBeds(generatedBeds);
        savedRoom.recalculateOccupancy();
        Room finalRoom = roomRepository.save(savedRoom);

        return RoomResponse.fromEntity(finalRoom);
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getRooms(Long floorId, Long buildingId, Long propertyId,
                                      RoomStatus status, RoomType roomType) {
        List<Room> rooms = roomRepository.findWithFilters(floorId, buildingId, propertyId, status, roomType);
        return rooms.stream()
                .map(RoomResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", id));
        return RoomResponse.fromEntity(room);
    }

    public RoomResponse updateRoom(Long id, RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", id));

        if (!room.getRoomNumber().equalsIgnoreCase(request.getRoomNumber()) &&
                roomRepository.existsByFloorIdAndRoomNumber(room.getFloor().getId(), request.getRoomNumber())) {
            throw new AppException("Room " + request.getRoomNumber() + " already exists on this floor");
        }

        room.setRoomNumber(request.getRoomNumber());
        room.setRoomType(request.getRoomType());
        if (request.getBaseRent() != null) {
            room.setBaseRent(request.getBaseRent());
        }
        room.setDescription(request.getDescription());

        Room updated = roomRepository.save(room);
        return RoomResponse.fromEntity(updated);
    }

    public void deleteRoom(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", id));
        roomRepository.delete(room);
    }

    @Transactional(readOnly = true)
    public List<BedResponse> getBedsByRoom(Long roomId) {
        if (!roomRepository.existsById(roomId)) {
            throw new ResourceNotFoundException("Room", "id", roomId);
        }
        return bedRepository.findByRoomId(roomId).stream()
                .map(BedResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public BedResponse updateBedStatus(Long roomId, Long bedId, BedStatusUpdateRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", roomId));

        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed", "id", bedId));

        if (!bed.getRoom().getId().equals(roomId)) {
            throw new AppException("Bed does not belong to the specified room");
        }

        bed.setStatus(request.getStatus());
        if (request.getStatus() == BedStatus.AVAILABLE) {
            bed.setCurrentResidentId(null);
        } else if (request.getResidentId() != null) {
            bed.setCurrentResidentId(request.getResidentId());
        }
        if (request.getNotes() != null) {
            bed.setNotes(request.getNotes());
        }

        Bed savedBed = bedRepository.save(bed);

        // Recalculate room occupancy and status using direct counts
        long occupiedCount = bedRepository.findByRoomIdAndStatus(roomId, BedStatus.OCCUPIED).size();
        long maintenanceCount = bedRepository.findByRoomIdAndStatus(roomId, BedStatus.UNDER_MAINTENANCE).size();
        long totalCount = bedRepository.findByRoomId(roomId).size();

        room.setOccupiedBeds((int) occupiedCount);
        if (totalCount > 0 && maintenanceCount == totalCount) {
            room.setStatus(RoomStatus.UNDER_MAINTENANCE);
        } else if (occupiedCount >= room.getCapacity()) {
            room.setStatus(RoomStatus.OCCUPIED);
        } else {
            room.setStatus(RoomStatus.AVAILABLE);
        }
        roomRepository.save(room);

        return BedResponse.fromEntity(savedBed);
    }

    @Transactional(readOnly = true)
    public RoomSummaryResponse getRoomSummary() {
        long totalProperties = propertyRepository.count();
        long totalBuildings = buildingRepository.count();
        long totalFloors = floorRepository.count();
        long totalRooms = roomRepository.count();

        long totalBeds = bedRepository.count();
        long occupiedBeds = bedRepository.countByStatus(BedStatus.OCCUPIED);
        long availableBeds = bedRepository.countByStatus(BedStatus.AVAILABLE);
        long maintenanceBeds = bedRepository.countByStatus(BedStatus.UNDER_MAINTENANCE);

        return new RoomSummaryResponse(
                totalProperties,
                totalBuildings,
                totalFloors,
                totalRooms,
                totalBeds,
                occupiedBeds,
                availableBeds,
                maintenanceBeds
        );
    }

    private int getDefaultCapacity(RoomType roomType) {
        if (roomType == null) {
            return 2;
        }
        return switch (roomType) {
            case SINGLE -> 1;
            case DOUBLE -> 2;
            case TRIPLE -> 3;
            case FOUR_SHARING -> 4;
            case DORMITORY -> 6;
        };
    }
}
