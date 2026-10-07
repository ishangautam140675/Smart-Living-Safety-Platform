package com.smartliving.module11staffroster.service;

import com.smartliving.module11staffroster.dto.*;
import com.smartliving.module11staffroster.model.*;
import com.smartliving.module11staffroster.repository.PatrolLogRepository;
import com.smartliving.module11staffroster.repository.StaffShiftRepository;
import com.smartliving.module1authentication.users.model.User;
import com.smartliving.module1authentication.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StaffRosterService {

    private static final Logger log = LoggerFactory.getLogger(StaffRosterService.class);

    private final StaffShiftRepository shiftRepo;
    private final PatrolLogRepository patrolRepo;
    private final UserRepository userRepo;

    public StaffRosterService(StaffShiftRepository shiftRepo,
                               PatrolLogRepository patrolRepo,
                               UserRepository userRepo) {
        this.shiftRepo = shiftRepo;
        this.patrolRepo = patrolRepo;
        this.userRepo = userRepo;
    }

    // ──── Schedule a shift ───────────────────────────────────────────────────────
    public ShiftResponse scheduleShift(CreateShiftRequest req) {
        User staff = userRepo.findById(req.getStaffUserId())
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found: " + req.getStaffUserId()));

        StaffShift shift = new StaffShift(staff, req.getShiftType(), req.getShiftDate(),
                req.getLocation(), req.getNotes());
        shift = shiftRepo.save(shift);
        log.info("Scheduled shift {} for staff {} on {}", shift.getId(), staff.getEmail(), shift.getShiftDate());
        return toResponse(shift);
    }

    // ──── Clock in ───────────────────────────────────────────────────────────────
    public ShiftResponse clockIn(Long shiftId) {
        StaffShift shift = getShift(shiftId);
        if (shift.getStatus() != ShiftStatus.SCHEDULED) {
            throw new IllegalStateException("Shift must be SCHEDULED to clock in. Current: " + shift.getStatus());
        }
        shift.setStatus(ShiftStatus.ACTIVE);
        shift.setClockInTime(LocalDateTime.now());
        shift = shiftRepo.save(shift);
        log.info("Staff {} clocked IN for shift {}", shift.getStaff().getEmail(), shiftId);
        return toResponse(shift);
    }

    // ──── Clock out ──────────────────────────────────────────────────────────────
    public ShiftResponse clockOut(Long shiftId) {
        StaffShift shift = getShift(shiftId);
        if (shift.getStatus() != ShiftStatus.ACTIVE) {
            throw new IllegalStateException("Shift must be ACTIVE to clock out. Current: " + shift.getStatus());
        }
        shift.setStatus(ShiftStatus.COMPLETED);
        shift.setClockOutTime(LocalDateTime.now());
        shift = shiftRepo.save(shift);
        log.info("Staff {} clocked OUT for shift {}", shift.getStaff().getEmail(), shiftId);
        return toResponse(shift);
    }

    // ──── Mark absent ────────────────────────────────────────────────────────────
    public ShiftResponse markAbsent(Long shiftId) {
        StaffShift shift = getShift(shiftId);
        shift.setStatus(ShiftStatus.ABSENT);
        shift = shiftRepo.save(shift);
        return toResponse(shift);
    }

    // ──── Log patrol checkpoint ──────────────────────────────────────────────────
    public PatrolLogResponse logPatrol(PatrolLogRequest req) {
        StaffShift shift = getShift(req.getShiftId());
        if (shift.getStatus() != ShiftStatus.ACTIVE) {
            throw new IllegalStateException("Can only log patrol for an ACTIVE shift.");
        }
        PatrolLog log = new PatrolLog(shift, req.getCheckpointName(),
                req.getObservationRemarks(), req.isIncidentFlag());
        log = patrolRepo.save(log);
        this.log.info("Patrol checkpoint '{}' logged for shift {}", req.getCheckpointName(), req.getShiftId());
        return toPatrolResponse(log);
    }

    // ──── Queries ────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ShiftResponse> getShiftsByDate(LocalDate date) {
        return shiftRepo.findByShiftDateOrderByShiftTypeAsc(date)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ShiftResponse> getShiftsInRange(LocalDate from, LocalDate to) {
        return shiftRepo.findByShiftDateBetweenOrderByShiftDateAscShiftTypeAsc(from, to)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PatrolLogResponse> getPatrolLogsForShift(Long shiftId) {
        return patrolRepo.findByShiftIdOrderByVerifiedAtDesc(shiftId)
                .stream().map(this::toPatrolResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RosterSummaryResponse getSummary() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        RosterSummaryResponse summary = new RosterSummaryResponse();
        summary.setTotalShiftsToday(shiftRepo.countByShiftDate(today));
        summary.setActiveShifts(shiftRepo.countByShiftDateAndStatus(today, ShiftStatus.ACTIVE));
        summary.setCompletedShifts(shiftRepo.countByShiftDateAndStatus(today, ShiftStatus.COMPLETED));
        summary.setAbsentShifts(shiftRepo.countByShiftDateAndStatus(today, ShiftStatus.ABSENT));
        summary.setPatrolCheckpointsToday(patrolRepo.countByVerifiedAtBetween(startOfDay, endOfDay));
        summary.setIncidentsLogged(patrolRepo.countIncidentsByVerifiedAtBetween(startOfDay, endOfDay));
        return summary;
    }

    @Transactional(readOnly = true)
    public List<ShiftResponse> getAllShifts() {
        return shiftRepo.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ──── Helpers ────────────────────────────────────────────────────────────────
    private StaffShift getShift(Long id) {
        return shiftRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Shift not found: " + id));
    }

    private ShiftResponse toResponse(StaffShift s) {
        ShiftResponse r = new ShiftResponse();
        r.setId(s.getId());
        r.setStaffUserId(s.getStaff().getId());
        r.setStaffName(s.getStaff().getFullName());
        r.setStaffEmail(s.getStaff().getEmail());
        r.setShiftType(s.getShiftType());
        r.setShiftDate(s.getShiftDate());
        r.setLocation(s.getLocation());
        r.setStatus(s.getStatus());
        r.setClockInTime(s.getClockInTime());
        r.setClockOutTime(s.getClockOutTime());
        r.setNotes(s.getNotes());
        r.setCreatedAt(s.getCreatedAt());
        return r;
    }

    private PatrolLogResponse toPatrolResponse(PatrolLog p) {
        PatrolLogResponse r = new PatrolLogResponse();
        r.setId(p.getId());
        r.setShiftId(p.getShift().getId());
        r.setStaffName(p.getShift().getStaff().getFullName());
        r.setCheckpointName(p.getCheckpointName());
        r.setObservationRemarks(p.getObservationRemarks());
        r.setIncidentFlag(p.isIncidentFlag());
        r.setVerifiedAt(p.getVerifiedAt());
        return r;
    }
}
