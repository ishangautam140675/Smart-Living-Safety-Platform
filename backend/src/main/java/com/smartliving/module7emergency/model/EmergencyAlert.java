package com.smartliving.module7emergency.model;

import com.smartliving.module3residents.model.Resident;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_alerts")
public class EmergencyAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alert_code", nullable = false, unique = true, length = 32)
    private String alertCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private EmergencyType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 30)
    private EmergencySeverity severity = EmergencySeverity.CRITICAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private EmergencyStatus status = EmergencyStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resident_id")
    private Resident resident;

    @Column(name = "location_details", nullable = false, length = 255)
    private String locationDetails;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "acknowledged_by", length = 120)
    private String acknowledgedBy;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "resolved_by", length = 120)
    private String resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolution_notes", length = 500)
    private String resolutionNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = EmergencyStatus.ACTIVE;
        }
        if (this.severity == null) {
            this.severity = EmergencySeverity.CRITICAL;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public EmergencyAlert() {}

    public EmergencyAlert(String alertCode, EmergencyType type, EmergencySeverity severity,
                          Resident resident, String locationDetails, String description) {
        this.alertCode = alertCode;
        this.type = type;
        this.severity = severity;
        this.resident = resident;
        this.locationDetails = locationDetails;
        this.description = description;
        this.status = EmergencyStatus.ACTIVE;
    }

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

    public Resident getResident() { return resident; }
    public void setResident(Resident resident) { this.resident = resident; }

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
