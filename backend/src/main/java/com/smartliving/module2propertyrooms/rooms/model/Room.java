package com.smartliving.module2propertyrooms.rooms.model;

import com.smartliving.module2propertyrooms.properties.model.Floor;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @Column(name = "room_number", nullable = false, length = 50)
    private String roomNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false, length = 50)
    private RoomType roomType = RoomType.DOUBLE;

    @Column(nullable = false)
    private Integer capacity = 2;

    @Column(name = "occupied_beds", nullable = false)
    private Integer occupiedBeds = 0;

    @Column(name = "base_rent", precision = 10, scale = 2)
    private BigDecimal baseRent = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RoomStatus status = RoomStatus.AVAILABLE;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Bed> beds = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Room() {
    }

    public Room(Floor floor, String roomNumber, RoomType roomType, Integer capacity,
                BigDecimal baseRent, String description) {
        this.floor = floor;
        this.roomNumber = roomNumber;
        this.roomType = roomType;
        this.capacity = capacity != null ? capacity : 2;
        this.baseRent = baseRent != null ? baseRent : BigDecimal.ZERO;
        this.description = description;
        this.occupiedBeds = 0;
        this.status = RoomStatus.AVAILABLE;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void recalculateOccupancy() {
        if (beds == null || beds.isEmpty()) {
            return;
        }
        int occupied = 0;
        int maintenance = 0;
        for (Bed bed : beds) {
            if (bed.getStatus() == BedStatus.OCCUPIED) {
                occupied++;
            } else if (bed.getStatus() == BedStatus.UNDER_MAINTENANCE) {
                maintenance++;
            }
        }
        this.occupiedBeds = occupied;
        if (maintenance == beds.size()) {
            this.status = RoomStatus.UNDER_MAINTENANCE;
        } else if (occupied >= this.capacity) {
            this.status = RoomStatus.OCCUPIED;
        } else {
            this.status = RoomStatus.AVAILABLE;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Floor getFloor() {
        return floor;
    }

    public void setFloor(Floor floor) {
        this.floor = floor;
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

    public List<Bed> getBeds() {
        return beds;
    }

    public void setBeds(List<Bed> beds) {
        this.beds = beds;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
