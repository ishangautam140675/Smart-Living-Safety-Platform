package com.smartliving.module2propertyrooms.rooms.dto;
public class CreateRoomBookingRequest {
    private Long roomId;
    private Long bedId;
    private String requestNote;
    public Long getRoomId() { return roomId; } public void setRoomId(Long roomId) { this.roomId = roomId; }
    public Long getBedId() { return bedId; } public void setBedId(Long bedId) { this.bedId = bedId; }
    public String getRequestNote() { return requestNote; } public void setRequestNote(String requestNote) { this.requestNote = requestNote; }
}
