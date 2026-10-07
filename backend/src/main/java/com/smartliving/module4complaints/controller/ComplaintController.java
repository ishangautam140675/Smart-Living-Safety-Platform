package com.smartliving.module4complaints.controller;

import com.smartliving.module4complaints.dto.ComplaintRequest;
import com.smartliving.module4complaints.dto.ComplaintResponse;
import com.smartliving.module4complaints.dto.ComplaintStatusUpdateRequest;
import com.smartliving.module4complaints.dto.ComplaintSummaryResponse;
import com.smartliving.module4complaints.model.ComplaintStatus;
import com.smartliving.module4complaints.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for the Complaints & Maintenance module.
 *
 * <pre>
 * POST  /api/complaints              → Resident files a complaint
 * GET   /api/complaints/my           → Resident views their own complaints
 * GET   /api/complaints              → Admin/Staff/Security views all (with filters)
 * GET   /api/complaints/summary      → Admin sees KPI counts
 * GET   /api/complaints/{id}         → Get single complaint detail
 * PUT   /api/complaints/{id}/status  → Admin/Staff updates status
 * </pre>
 */
@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    // ─── Resident endpoints ───────────────────────────────────────────────────

    /**
     * Submit a new complaint (resident only).
     *
     * <p>The resident identity is extracted from the JWT — residents cannot
     * file complaints on behalf of others.</p>
     */
    @PostMapping
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ComplaintResponse> submitComplaint(
            @Valid @RequestBody ComplaintRequest request,
            Authentication authentication) {

        ComplaintResponse response = complaintService.submitComplaint(
                request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Resident views their own complaints (newest first).
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints(Authentication authentication) {
        return ResponseEntity.ok(complaintService.getMyComplaints(authentication.getName()));
    }

    // ─── Admin / Staff endpoints ──────────────────────────────────────────────

    /**
     * Returns all complaints with optional keyword and status filters.
     *
     * <p>Query params:</p>
     * <ul>
     *   <li>{@code keyword} — search in title, description, resident name</li>
     *   <li>{@code status}  — filter by {@link ComplaintStatus} (e.g. {@code OPEN})</li>
     * </ul>
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SECURITY')")
    public ResponseEntity<List<ComplaintResponse>> getComplaints(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false) ComplaintStatus status) {

        return ResponseEntity.ok(complaintService.getComplaints(keyword, status));
    }

    /**
     * Admin dashboard KPI — complaint counts grouped by status.
     */
    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ComplaintSummaryResponse> getSummary() {
        return ResponseEntity.ok(complaintService.getSummary());
    }

    /**
     * Get the full detail of a single complaint by ID.
     * Accessible to Admin, Staff, and Security.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','SECURITY')")
    public ResponseEntity<ComplaintResponse> getComplaintById(@PathVariable Long id) {
        return ResponseEntity.ok(complaintService.getComplaintById(id));
    }

    /**
     * Update complaint status (Admin or Staff only).
     *
     * <p>Allows: acknowledging (→ IN_PROGRESS), resolving, closing, rejecting,
     * and optionally re-assigning the complaint to a different staff member.</p>
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ComplaintResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintStatusUpdateRequest request) {

        return ResponseEntity.ok(complaintService.updateStatus(id, request));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<Void> deleteComplaint(@PathVariable Long id) {
        complaintService.deleteComplaint(id);
        return ResponseEntity.noContent().build();
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/clear-completed")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<java.util.Map<String, Object>> clearCompleted() {
        long count = complaintService.clearCompletedComplaints();
        return ResponseEntity.ok(java.util.Map.of("message", "Cleared completed tasks", "count", count));
    }
}
