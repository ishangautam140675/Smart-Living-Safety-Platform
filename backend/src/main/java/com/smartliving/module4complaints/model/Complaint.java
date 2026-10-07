package com.smartliving.module4complaints.model;

import com.smartliving.module3residents.model.Resident;
import com.smartliving.module2propertyrooms.rooms.model.Room;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Core entity representing a complaint or maintenance request
 * filed by a resident against their room, floor, or common area.
 *
 * <p>Lifecycle: OPEN → IN_PROGRESS → RESOLVED → CLOSED (or REJECTED at any point).</p>
 *
 * <p>One resident can file multiple complaints; each complaint
 * references one room (the room the resident occupied at the time).</p>
 */
@Entity
@Table(name = "complaints")
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Who filed it ────────────────────────────────────────────────────────

    /** The resident who submitted this complaint. Never null. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resident_id", nullable = false)
    private Resident resident;

    // ─── Where it is ─────────────────────────────────────────────────────────

    /**
     * The room associated with the complaint.
     * Null if the complaint relates to a common area (corridor, canteen, parking, etc.).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    // ─── What it is ──────────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ComplaintCategory category = ComplaintCategory.OTHER;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComplaintPriority priority = ComplaintPriority.MEDIUM;

    // ─── Workflow state ───────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComplaintStatus status = ComplaintStatus.OPEN;

    /**
     * User ID (from the users table) of the staff member assigned to this complaint.
     * Null until an admin assigns someone.
     */
    @Column(name = "assigned_staff_id")
    private Long assignedStaffId;

    /** Name snapshot of the assigned staff — avoids a join on every list read. */
    @Column(name = "assigned_staff_name", length = 100)
    private String assignedStaffName;

    /** Notes added by staff when updating the status (e.g., steps taken, root cause). */
    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;

    /** Timestamp when status was last changed to RESOLVED. */
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    // ─── Audit timestamps ─────────────────────────────────────────────────────

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ─── Lifecycle callbacks ──────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ─── Constructors ─────────────────────────────────────────────────────────

    public Complaint() {
    }

    public Complaint(Resident resident, Room room, ComplaintCategory category,
                     String title, String description, ComplaintPriority priority) {
        this.resident = resident;
        this.room = room;
        this.category = category;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.status = ComplaintStatus.OPEN;
    }

    // ─── Getters & Setters ────────────────────────────────────────────────────

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Resident getResident() {
        return resident;
    }

    public void setResident(Resident resident) {
        this.resident = resident;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

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

    public ComplaintStatus getStatus() {
        return status;
    }

    public void setStatus(ComplaintStatus status) {
        this.status = status;
    }

    public Long getAssignedStaffId() {
        return assignedStaffId;
    }

    public void setAssignedStaffId(Long assignedStaffId) {
        this.assignedStaffId = assignedStaffId;
    }

    public String getAssignedStaffName() {
        return assignedStaffName;
    }

    public void setAssignedStaffName(String assignedStaffName) {
        this.assignedStaffName = assignedStaffName;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
