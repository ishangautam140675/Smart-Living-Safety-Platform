package com.smartliving.module2propertyrooms.rooms.dto;

import com.smartliving.module2propertyrooms.rooms.model.Room;
import com.smartliving.module2propertyrooms.rooms.model.RoomStatus;
import com.smartliving.module2propertyrooms.rooms.model.RoomType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class RoomResponse {

    private Long id;
    private Long floorId;
    private Integer floorNumber;
    private String floorName;
    private Long buildingId;
    private String buildingName;
    private Long propertyId;
    private String propertyName;
    private String roomNumber;
    private RoomType roomType;
    private Integer capacity;
    private Integer occupiedBeds;
    private Integer availableBeds;
    private BigDecimal baseRent;
    private RoomStatus status;
    private String description;
    private List<BedResponse> beds = new ArrayList<>();
    private LocalDateTime createdAt;

    public RoomResponse() {
    }

    public static RoomResponse fromEntity(Room room) {
        RoomResponse response = new RoomResponse();
        response.setId(room.getId());
        if (room.getFloor() != null) {
            response.setFloorId(room.getFloor().getId());
            response.setFloorNumber(room.getFloor().getFloorNumber());
            response.setFloorName(room.getFloor().getFloorName());
            if (room.getFloor().getBuilding() != null) {
                response.setBuildingId(room.getFloor().getBuilding().getId());
                response.setBuildingName(room.getFloor().getBuilding().getName());
                if (room.getFloor().getBuilding().getProperty() != null) {
                    response.setPropertyId(room.getFloor().getBuilding().getProperty().getId());
                    response.setPropertyName(room.getFloor().getBuilding().getProperty().getName());
                }
            }
        }
        response.setRoomNumber(room.getRoomNumber());
        response.setRoomType(room.getRoomType());
        response.setCapacity(room.getCapacity());
        response.setOccupiedBeds(room.getOccupiedBeds());
        response.setAvailableBeds(Math.max(0, room.getCapacity() - room.getOccupiedBeds()));
        response.setBaseRent(room.getBaseRent());
        response.setStatus(room.getStatus());
        response.setDescription(room.getDescription());
        response.setCreatedAt(room.getCreatedAt());

        if (room.getBeds() != null) {
            response.setBeds(room.getBeds().stream()
                    .map(BedResponse::fromEntity)
                    .collect(Collectors.toList()));
        }

        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFloorId() {
        return floorId;
    }

    public void setFloorId(Long floorId) {
        this.floorId = floorId;
    }

    public Integer getFloorNumber() {
        return floorNumber;
    }

    public void setFloorNumber(Integer floorNumber) {
        this.floorNumber = floorNumber;
    }

    public String getFloorName() {
        return floorName;
    }

    public void setFloorName(String floorName) {
        this.floorName = floorName;
    }

    public Long getBuildingId() {
        return buildingId;
    }

    public void setBuildingId(Long buildingId) {
        this.buildingId = buildingId;
    }

    public String getBuildingName() {
        return buildingName;
    }

    public void setBuildingName(String buildingName) {
        this.buildingName = buildingName;
    }

    public Long getPropertyId() {
        return propertyId;
    }

    public void setPropertyId(Long propertyId) {
        this.propertyId = propertyId;
    }

    public String getPropertyName() {
        return propertyName;
    }

    public void setPropertyName(String propertyName) {
        this.propertyName = propertyName;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public RoomType getRoomType() {
        return roomType;
    }

    public void setRoomType(RoomType roomType) {
        this.roomType = roomType;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Integer getOccupiedBeds() {
        return occupiedBeds;
    }

    public void setOccupiedBeds(Integer occupiedBeds) {
        this.occupiedBeds = occupiedBeds;
    }

    public Integer getAvailableBeds() {
        return availableBeds;
    }

    public void setAvailableBeds(Integer availableBeds) {
        this.availableBeds = availableBeds;
    }

    public BigDecimal getBaseRent() {
        return baseRent;
    }

    public void setBaseRent(BigDecimal baseRent) {
        this.baseRent = baseRent;
    }

    public RoomStatus getStatus() {
        return status;
    }

    public void setStatus(RoomStatus status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<BedResponse> getBeds() {
        return beds;
    }

    public void setBeds(List<BedResponse> beds) {
        this.beds = beds;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
