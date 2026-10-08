package com.smartliving.module2propertyrooms.rooms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_booking_requests")
public class RoomBookingRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long roomId;
    private Long bedId;

    @Column(length = 500)
    private String requestNote;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private BookingRequestStatus status = BookingRequestStatus.PENDING;

    private String adminNote;

    @Column(nullable = false, updatable = false)
    private LocalDateTime requestedAt = LocalDateTime.now();

    private LocalDateTime respondedAt;

    // getters and setters for all fields
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public Long getBedId() { return bedId; }
    public void setBedId(Long bedId) { this.bedId = bedId; }
    public String getRequestNote() { return requestNote; }
    public void setRequestNote(String requestNote) { this.requestNote = requestNote; }
    public BookingRequestStatus getStatus() { return status; }
    public void setStatus(BookingRequestStatus status) { this.status = status; }
    public String getAdminNote() { return adminNote; }
    public void setAdminNote(String adminNote) { this.adminNote = adminNote; }
    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }
    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }
}
