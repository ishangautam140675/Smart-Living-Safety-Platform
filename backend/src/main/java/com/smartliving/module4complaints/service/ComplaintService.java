package com.smartliving.module4complaints.service;

import com.smartliving.common.exception.AppException;
import com.smartliving.common.exception.ResourceNotFoundException;
import com.smartliving.module4complaints.dto.ComplaintRequest;
import com.smartliving.module4complaints.dto.ComplaintResponse;
import com.smartliving.module4complaints.dto.ComplaintStatusUpdateRequest;
import com.smartliving.module4complaints.dto.ComplaintSummaryResponse;
import com.smartliving.module4complaints.model.Complaint;
import com.smartliving.module4complaints.model.ComplaintStatus;
import com.smartliving.module4complaints.repository.ComplaintRepository;
import com.smartliving.module3residents.repository.ResidentRepository;
import com.smartliving.module2propertyrooms.rooms.repository.RoomRepository;
import com.smartliving.module1authentication.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Business logic for complaint and maintenance request management.
 *
 * <h3>Access control summary (enforced in controller via @PreAuthorize):</h3>
 * <ul>
 *   <li>Submit complaint — any authenticated RESIDENT</li>
 *   <li>View own complaints — RESIDENT</li>
 *   <li>View all complaints / summary — ADMIN, STAFF, SECURITY</li>
 *   <li>Update status / assign staff — ADMIN, STAFF</li>
 * </ul>
 */
@Service
@Transactional
public class ComplaintService {

    private static final Logger log = LoggerFactory.getLogger(ComplaintService.class);

    private final ComplaintRepository complaintRepository;
    private final ResidentRepository residentRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public ComplaintService(ComplaintRepository complaintRepository,
                            ResidentRepository residentRepository,
                            RoomRepository roomRepository,
                            UserRepository userRepository) {
        this.complaintRepository = complaintRepository;
        this.residentRepository = residentRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    // ─── Submit a new complaint ───────────────────────────────────────────────

    /**
     * Called by an authenticated resident to file a new complaint.
     *
     * @param request the complaint details
     * @param residentEmail the email from the JWT (resolved in controller)
     * @return the saved complaint as a response DTO
     */
    public ComplaintResponse submitComplaint(ComplaintRequest request, String residentEmail) {
        var resident = residentRepository.findByUserEmail(residentEmail)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Resident profile not found for email: " + residentEmail));

        com.smartliving.module2propertyrooms.rooms.model.Room room = null;
        if (request.getRoomId() != null) {
            room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Room not found with id: " + request.getRoomId()));
        }

        Complaint complaint = new Complaint(
                resident,
                room,
                request.getCategory(),
                request.getTitle(),
                request.getDescription(),
                request.getPriority()
        );

        complaint = complaintRepository.save(complaint);
        log.info("Complaint #{} submitted by resident '{}': [{}] {}",
                complaint.getId(), residentEmail, complaint.getCategory(), complaint.getTitle());
        return toResponse(complaint);
    }

    // ─── Read: resident views their own complaints ────────────────────────────

    /**
     * Returns all complaints filed by the given resident, newest first.
     */
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getMyComplaints(String residentEmail) {
        var resident = residentRepository.findByUserEmail(residentEmail)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Resident profile not found for email: " + residentEmail));

        return complaintRepository
                .findByResidentIdOrderByCreatedAtDesc(resident.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─── Read: admin / staff view ─────────────────────────────────────────────

    /**
     * Returns complaints with optional keyword and status filtering.
     *
     * @param keyword search term (or empty string for all)
     * @param status  filter by status (or {@code null} to include all statuses)
     */
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getComplaints(String keyword, ComplaintStatus status) {
        String kw = (keyword == null) ? "" : keyword.trim();
        return complaintRepository.searchComplaints(kw, status)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns a single complaint by ID.
     */
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintById(Long id) {
        Complaint complaint = findOrThrow(id);
        return toResponse(complaint);
    }

    // ─── KPI summary ──────────────────────────────────────────────────────────

    /**
     * Returns counts by status for the admin dashboard.
     */
    @Transactional(readOnly = true)
    public ComplaintSummaryResponse getSummary() {
        ComplaintSummaryResponse summary = new ComplaintSummaryResponse();
        summary.setTotalComplaints(complaintRepository.count());
        summary.setOpen(complaintRepository.countByStatus(ComplaintStatus.OPEN));
        summary.setInProgress(complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS));
        summary.setResolved(complaintRepository.countByStatus(ComplaintStatus.RESOLVED));
        summary.setClosed(complaintRepository.countByStatus(ComplaintStatus.CLOSED));
        summary.setRejected(complaintRepository.countByStatus(ComplaintStatus.REJECTED));
        return summary;
    }

    // ─── Workflow: update status ──────────────────────────────────────────────

    /**
     * Admin or staff updates the status of a complaint.
     *
     * <p>Business rules enforced here:</p>
     * <ul>
     *   <li>RESOLVED and REJECTED require a non-blank {@code resolutionNote}.</li>
     *   <li>When transitioning to RESOLVED, {@code resolvedAt} is stamped.</li>
     *   <li>When transitioning from RESOLVED back to IN_PROGRESS (re-open),
     *       {@code resolvedAt} is cleared.</li>
     * </ul>
     */
    public ComplaintResponse updateStatus(Long id, ComplaintStatusUpdateRequest request) {
        Complaint complaint = findOrThrow(id);

        ComplaintStatus newStatus = request.getNewStatus();

        // Validate resolution note is present when required
        if ((newStatus == ComplaintStatus.RESOLVED || newStatus == ComplaintStatus.REJECTED)
                && (request.getResolutionNote() == null || request.getResolutionNote().isBlank())) {
            throw new AppException("A resolution note is required when marking a complaint as "
                    + newStatus.name());
        }

        // Handle staff assignment
        if (request.getAssignedStaffId() != null) {
            var staffUser = userRepository.findById(request.getAssignedStaffId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Staff user not found with id: " + request.getAssignedStaffId()));
            complaint.setAssignedStaffId(staffUser.getId());
            complaint.setAssignedStaffName(staffUser.getFullName());
        }

        // Stamp resolved timestamp
        if (newStatus == ComplaintStatus.RESOLVED && complaint.getResolvedAt() == null) {
            complaint.setResolvedAt(LocalDateTime.now());
        }
        // Clear resolved timestamp if re-opened
        if (newStatus == ComplaintStatus.IN_PROGRESS || newStatus == ComplaintStatus.OPEN) {
            complaint.setResolvedAt(null);
        }

        complaint.setStatus(newStatus);
        if (request.getResolutionNote() != null && !request.getResolutionNote().isBlank()) {
            complaint.setResolutionNote(request.getResolutionNote());
        }

        complaint = complaintRepository.save(complaint);
        log.info("Complaint #{} status updated to {} by staff", complaint.getId(), newStatus);
        return toResponse(complaint);
    }

    // ─── Mapping helper ───────────────────────────────────────────────────────

    /**
     * Converts a {@link Complaint} entity to a {@link ComplaintResponse} DTO.
     * All lazy-loaded associations are accessed inside this transaction.
     */
    private ComplaintResponse toResponse(Complaint c) {
        ComplaintResponse r = new ComplaintResponse();
        r.setId(c.getId());

        // Resident info
        var resident = c.getResident();
        r.setResidentId(resident.getId());
        var user = resident.getUser();
        r.setResidentName(user.getFullName());
        r.setResidentEmail(user.getEmail());
        r.setResidentPhone(user.getPhone());

        // Room info (may be null)
        if (c.getRoom() != null) {
            var room = c.getRoom();
            r.setRoomId(room.getId());
            r.setRoomNumber(room.getRoomNumber());
            if (room.getFloor() != null && room.getFloor().getBuilding() != null) {
                r.setBuildingName(room.getFloor().getBuilding().getName());
            }
        }

        r.setCategory(c.getCategory());
        r.setTitle(c.getTitle());
        r.setDescription(c.getDescription());
        r.setPriority(c.getPriority());
        r.setStatus(c.getStatus());
        r.setAssignedStaffId(c.getAssignedStaffId());
        r.setAssignedStaffName(c.getAssignedStaffName());
        r.setResolutionNote(c.getResolutionNote());
        r.setResolvedAt(c.getResolvedAt());
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());
        return r;
    }

    // ─── Private helper ───────────────────────────────────────────────────────

    private Complaint findOrThrow(Long id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));
    }
}
