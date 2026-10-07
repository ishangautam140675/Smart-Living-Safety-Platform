package com.smartliving.module4complaints.dto;

import com.smartliving.module4complaints.model.ComplaintCategory;
import com.smartliving.module4complaints.model.ComplaintPriority;
import com.smartliving.module4complaints.model.ComplaintStatus;

import java.time.LocalDateTime;

/**
 * Read-only projection returned to callers for a single complaint.
 *
 * <p>Contains flattened resident info and room info to avoid extra client-side calls.</p>
 */
public class ComplaintResponse {

    private Long id;

    // ─── Resident snapshot ────────────────────────────────────────────────────

    private Long residentId;
    private String residentName;
    private String residentEmail;
    private String residentPhone;

    // ─── Room snapshot (may be null for common-area complaints) ──────────────

    private Long roomId;
    private String roomNumber;
    private String buildingName;

    // ─── Complaint fields ─────────────────────────────────────────────────────

    private ComplaintCategory category;
    private String title;
    private String description;
    private ComplaintPriority priority;
    private ComplaintStatus status;

    // ─── Workflow ─────────────────────────────────────────────────────────────

    private Long assignedStaffId;
    private String assignedStaffName;
    private String resolutionNote;
    private LocalDateTime resolvedAt;

    // ─── Audit ────────────────────────────────────────────────────────────────

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ─── Getters & Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getResidentId() { return residentId; }
    public void setResidentId(Long residentId) { this.residentId = residentId; }

    public String getResidentName() { return residentName; }
    public void setResidentName(String residentName) { this.residentName = residentName; }

    public String getResidentEmail() { return residentEmail; }
    public void setResidentEmail(String residentEmail) { this.residentEmail = residentEmail; }

    public String getResidentPhone() { return residentPhone; }
    public void setResidentPhone(String residentPhone) { this.residentPhone = residentPhone; }

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }

    public ComplaintCategory getCategory() { return category; }
    public void setCategory(ComplaintCategory category) { this.category = category; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ComplaintPriority getPriority() { return priority; }
    public void setPriority(ComplaintPriority priority) { this.priority = priority; }

    public ComplaintStatus getStatus() { return status; }
    public void setStatus(ComplaintStatus status) { this.status = status; }

    public Long getAssignedStaffId() { return assignedStaffId; }
    public void setAssignedStaffId(Long assignedStaffId) { this.assignedStaffId = assignedStaffId; }

    public String getAssignedStaffName() { return assignedStaffName; }
    public void setAssignedStaffName(String assignedStaffName) { this.assignedStaffName = assignedStaffName; }

    public String getResolutionNote() { return resolutionNote; }
    public void setResolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
