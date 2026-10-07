package com.smartliving.module2propertyrooms.rooms.dto;

import com.smartliving.module2propertyrooms.rooms.model.Bed;
import com.smartliving.module2propertyrooms.rooms.model.BedStatus;

public class BedResponse {

    private Long id;
    private Long roomId;
    private String roomNumber;
    private String bedNumber;
    private BedStatus status;
    private Long currentResidentId;
    private String notes;

    public BedResponse() {
    }

    public static BedResponse fromEntity(Bed bed) {
        BedResponse response = new BedResponse();
        response.setId(bed.getId());
        if (bed.getRoom() != null) {
            response.setRoomId(bed.getRoom().getId());
            response.setRoomNumber(bed.getRoom().getRoomNumber());
        }
        response.setBedNumber(bed.getBedNumber());
        response.setStatus(bed.getStatus());
        response.setCurrentResidentId(bed.getCurrentResidentId());
        response.setNotes(bed.getNotes());
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getBedNumber() {
        return bedNumber;
    }

    public void setBedNumber(String bedNumber) {
        this.bedNumber = bedNumber;
    }

    public BedStatus getStatus() {
        return status;
    }

    public void setStatus(BedStatus status) {
        this.status = status;
    }

    public Long getCurrentResidentId() {
        return currentResidentId;
    }

    public void setCurrentResidentId(Long currentResidentId) {
        this.currentResidentId = currentResidentId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
