package com.smartliving.module4complaints.dto;

import com.smartliving.module4complaints.model.ComplaintCategory;
import com.smartliving.module4complaints.model.ComplaintPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload sent by a resident when filing a new complaint.
 *
 * <p>The resident identity is derived from the JWT; residents cannot
 * submit complaints on behalf of others.</p>
 */
public class ComplaintRequest {

    @NotNull(message = "Category is required")
    private ComplaintCategory category;

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    /**
     * Priority level — defaults to MEDIUM if omitted.
     * Residents can suggest a priority; staff may override via status update.
     */
    private ComplaintPriority priority = ComplaintPriority.MEDIUM;

    /**
     * Optional room ID.  Leave null for complaints about common areas
     * (lobby, canteen, parking, etc.).
     */
    private Long roomId;

    // ─── Getters & Setters ────────────────────────────────────────────────────

    public ComplaintCategory getCategory() {
        return category;
    }

    public void setCategory(ComplaintCategory category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ComplaintPriority getPriority() {
        return priority;
    }

    public void setPriority(ComplaintPriority priority) {
        this.priority = priority;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }
}
