package com.smartliving.module7emergency.dto;

import com.smartliving.module7emergency.model.EmergencyStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateAlertStatusRequest {

    @NotNull(message = "New status is required")
    private EmergencyStatus status;

    private String notes;

    public UpdateAlertStatusRequest() {}

    public UpdateAlertStatusRequest(EmergencyStatus status, String notes) {
        this.status = status;
        this.notes = notes;
    }

    public EmergencyStatus getStatus() { return status; }
    public void setStatus(EmergencyStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
