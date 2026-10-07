package com.smartliving.module2propertyrooms.rooms.dto;

import com.smartliving.module2propertyrooms.rooms.model.BedStatus;
import jakarta.validation.constraints.NotNull;

public class BedStatusUpdateRequest {

    @NotNull(message = "Bed status is required")
    private BedStatus status;

    private Long residentId;
    private String notes;

    public BedStatusUpdateRequest() {
    }

    public BedStatus getStatus() {
        return status;
    }

    public void setStatus(BedStatus status) {
        this.status = status;
    }

    public Long getResidentId() {
        return residentId;
    }

    public void setResidentId(Long residentId) {
        this.residentId = residentId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
