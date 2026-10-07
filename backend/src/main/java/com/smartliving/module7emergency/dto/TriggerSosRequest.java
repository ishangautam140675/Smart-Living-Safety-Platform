package com.smartliving.module7emergency.dto;

import com.smartliving.module7emergency.model.EmergencySeverity;
import com.smartliving.module7emergency.model.EmergencyType;
import jakarta.validation.constraints.NotNull;

public class TriggerSosRequest {

    @NotNull(message = "Emergency type is required")
    private EmergencyType type;

    private EmergencySeverity severity = EmergencySeverity.CRITICAL;

    private String locationDetails; // optional, defaults to resident's allocated room

    private String description;

    public TriggerSosRequest() {}

    public TriggerSosRequest(EmergencyType type, EmergencySeverity severity, String locationDetails, String description) {
        this.type = type;
        this.severity = severity;
        this.locationDetails = locationDetails;
        this.description = description;
    }

    public EmergencyType getType() { return type; }
    public void setType(EmergencyType type) { this.type = type; }

    public EmergencySeverity getSeverity() { return severity; }
    public void setSeverity(EmergencySeverity severity) { this.severity = severity; }

    public String getLocationDetails() { return locationDetails; }
    public void setLocationDetails(String locationDetails) { this.locationDetails = locationDetails; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
