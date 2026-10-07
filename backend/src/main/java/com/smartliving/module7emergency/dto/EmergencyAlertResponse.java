package com.smartliving.module7emergency.dto;

import com.smartliving.module7emergency.model.EmergencySeverity;
import com.smartliving.module7emergency.model.EmergencyStatus;
import com.smartliving.module7emergency.model.EmergencyType;
import java.time.LocalDateTime;

public class EmergencyAlertResponse {

    private Long id;
    private String alertCode;
    private EmergencyType type;
    private EmergencySeverity severity;
    private EmergencyStatus status;

    private Long residentId;
    private String residentName;
    private String residentPhone;
    private String roomNumber;
    private String buildingName;

    private String locationDetails;
    private String description;

    private String acknowledgedBy;
    private LocalDateTime acknowledgedAt;
    private String resolvedBy;
    private LocalDateTime resolvedAt;
    private String resolutionNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EmergencyAlertResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAlertCode() { return alertCode; }
    public void setAlertCode(String alertCode) { this.alertCode = alertCode; }

    public EmergencyType getType() { return type; }
    public void setType(EmergencyType type) { this.type = type; }

    public EmergencySeverity getSeverity() { return severity; }
    public void setSeverity(EmergencySeverity severity) { this.severity = severity; }

    public EmergencyStatus getStatus() { return status; }
    public void setStatus(EmergencyStatus status) { this.status = status; }

    public Long getResidentId() { return residentId; }
    public void setResidentId(Long residentId) { this.residentId = residentId; }

    public String getResidentName() { return residentName; }
    public void setResidentName(String residentName) { this.residentName = residentName; }

    public String getResidentPhone() { return residentPhone; }
    public void setResidentPhone(String residentPhone) { this.residentPhone = residentPhone; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }

    public String getLocationDetails() { return locationDetails; }
    public void setLocationDetails(String locationDetails) { this.locationDetails = locationDetails; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAcknowledgedBy() { return acknowledgedBy; }
    public void setAcknowledgedBy(String acknowledgedBy) { this.acknowledgedBy = acknowledgedBy; }

    public LocalDateTime getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }

    public String getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(String resolvedBy) { this.resolvedBy = resolvedBy; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
