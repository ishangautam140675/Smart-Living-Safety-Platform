package com.smartliving.module2propertyrooms.rooms.dto;

import com.smartliving.module2propertyrooms.rooms.model.RoomType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class RoomRequest {

    @NotNull(message = "Floor ID is required")
    private Long floorId;

    @NotBlank(message = "Room number is required")
    @Size(max = 50, message = "Room number must not exceed 50 characters")
    private String roomNumber;

    @NotNull(message = "Room type is required")
    private RoomType roomType = RoomType.DOUBLE;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @DecimalMin(value = "0.0", message = "Base rent cannot be negative")
    private BigDecimal baseRent;

    private String description;

    public RoomRequest() {
    }

    public Long getFloorId() {
        return floorId;
    }

    public void setFloorId(Long floorId) {
        this.floorId = floorId;
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

    public BigDecimal getBaseRent() {
        return baseRent;
    }

    public void setBaseRent(BigDecimal baseRent) {
        this.baseRent = baseRent;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
