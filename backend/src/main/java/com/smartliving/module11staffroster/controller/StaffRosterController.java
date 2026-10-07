package com.smartliving.module11staffroster.controller;

import com.smartliving.module11staffroster.dto.*;
import com.smartliving.module11staffroster.service.StaffRosterService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/roster")
public class StaffRosterController {

    private final StaffRosterService service;

    public StaffRosterController(StaffRosterService service) {
        this.service = service;
    }

    // ── Schedule a new shift ──────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShiftResponse> scheduleShift(@Valid @RequestBody CreateShiftRequest req) {
        return ResponseEntity.ok(service.scheduleShift(req));
    }

    // ── Get all shifts ────────────────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ShiftResponse>> getAllShifts() {
        return ResponseEntity.ok(service.getAllShifts());
    }

    // ── Get shifts for a specific date ────────────────────────────────────────
    @GetMapping("/date/{date}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ShiftResponse>> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.getShiftsByDate(date));
    }

    // ── Get shifts in date range ──────────────────────────────────────────────
    @GetMapping("/range")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ShiftResponse>> getRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.getShiftsInRange(from, to));
    }

    // ── Clock in ──────────────────────────────────────────────────────────────
    @PatchMapping("/{id}/clock-in")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShiftResponse> clockIn(@PathVariable Long id) {
        return ResponseEntity.ok(service.clockIn(id));
    }

    // ── Clock out ─────────────────────────────────────────────────────────────
    @PatchMapping("/{id}/clock-out")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShiftResponse> clockOut(@PathVariable Long id) {
        return ResponseEntity.ok(service.clockOut(id));
    }

    // ── Mark absent ───────────────────────────────────────────────────────────
    @PatchMapping("/{id}/absent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShiftResponse> markAbsent(@PathVariable Long id) {
        return ResponseEntity.ok(service.markAbsent(id));
    }

    // ── Log patrol checkpoint ─────────────────────────────────────────────────
    @PostMapping("/patrol")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PatrolLogResponse> logPatrol(@Valid @RequestBody PatrolLogRequest req) {
        return ResponseEntity.ok(service.logPatrol(req));
    }

    // ── Get patrol logs for a shift ───────────────────────────────────────────
    @GetMapping("/{shiftId}/patrol-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PatrolLogResponse>> getPatrolLogs(@PathVariable Long shiftId) {
        return ResponseEntity.ok(service.getPatrolLogsForShift(shiftId));
    }

    // ── Today's roster summary ────────────────────────────────────────────────
    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RosterSummaryResponse> getSummary() {
        return ResponseEntity.ok(service.getSummary());
    }
}
