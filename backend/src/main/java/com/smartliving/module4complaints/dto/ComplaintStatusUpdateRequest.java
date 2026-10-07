package com.smartliving.module4complaints.dto;

import com.smartliving.module4complaints.model.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload sent by admin or staff when updating the status of a complaint.
 *
 * <p>Used for: acknowledging (→ IN_PROGRESS), resolving, closing, rejecting.</p>
 */
public class ComplaintStatusUpdateRequest {

    @NotNull(message = "New status is required")
    private ComplaintStatus newStatus;

    /**
     * Optional note explaining the status change.
     * Required when status is RESOLVED or REJECTED (enforced in the service).
     */
    @Size(max = 2000, message = "Resolution note must not exceed 2000 characters")
    private String resolutionNote;

    /**
     * Optional: ID of the staff user to assign this complaint to.
     * When provided the complaint is re-assigned to this user.
     */
    private Long assignedStaffId;

    // ─── Getters & Setters ────────────────────────────────────────────────────

    public ComplaintStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(ComplaintStatus newStatus) {
        this.newStatus = newStatus;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }

    public Long getAssignedStaffId() {
        return assignedStaffId;
    }

    public void setAssignedStaffId(Long assignedStaffId) {
        this.assignedStaffId = assignedStaffId;
    }
}
