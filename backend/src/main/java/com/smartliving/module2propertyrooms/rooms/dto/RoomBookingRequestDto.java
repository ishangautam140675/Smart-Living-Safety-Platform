package com.smartliving.module2propertyrooms.rooms.dto;
public class RoomBookingRequestDto {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userName;
    private Long roomId;
    private String roomNumber;
    private Long bedId;
    private String bedNumber;
    private String requestNote;
    private String status;
    private String adminNote;
    private String requestedAt;
    private String respondedAt;
    // getters and setters for all fields
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
    public String getUserEmail() { return userEmail; } public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getUserName() { return userName; } public void setUserName(String userName) { this.userName = userName; }
    public Long getRoomId() { return roomId; } public void setRoomId(Long roomId) { this.roomId = roomId; }
    public String getRoomNumber() { return roomNumber; } public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    public Long getBedId() { return bedId; } public void setBedId(Long bedId) { this.bedId = bedId; }
    public String getBedNumber() { return bedNumber; } public void setBedNumber(String bedNumber) { this.bedNumber = bedNumber; }
    public String getRequestNote() { return requestNote; } public void setRequestNote(String requestNote) { this.requestNote = requestNote; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public String getAdminNote() { return adminNote; } public void setAdminNote(String adminNote) { this.adminNote = adminNote; }
    public String getRequestedAt() { return requestedAt; } public void setRequestedAt(String requestedAt) { this.requestedAt = requestedAt; }
    public String getRespondedAt() { return respondedAt; } public void setRespondedAt(String respondedAt) { this.respondedAt = respondedAt; }
}
