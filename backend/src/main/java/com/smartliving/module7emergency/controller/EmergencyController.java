package com.smartliving.module7emergency.controller;

import com.smartliving.module7emergency.dto.*;
import com.smartliving.module7emergency.model.EmergencySeverity;
import com.smartliving.module7emergency.model.EmergencyStatus;
import com.smartliving.module7emergency.service.EmergencyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emergency")
public class EmergencyController {

    private final EmergencyService emergencyService;

    public EmergencyController(EmergencyService emergencyService) {
        this.emergencyService = emergencyService;
    }

    @PostMapping("/sos")
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN', 'SECURITY', 'STAFF')")
    public ResponseEntity<EmergencyAlertResponse> triggerSos(
            @Valid @RequestBody TriggerSosRequest request,
            Authentication authentication) {
        EmergencyAlertResponse response = emergencyService.triggerSos(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-alerts")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<List<EmergencyAlertResponse>> getMyAlerts(Authentication authentication) {
        List<EmergencyAlertResponse> alerts = emergencyService.getMyAlerts(authentication.getName());
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY', 'STAFF')")
    public ResponseEntity<List<EmergencyAlertResponse>> searchAlerts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) EmergencyStatus status,
            @RequestParam(required = false) EmergencySeverity severity) {
        List<EmergencyAlertResponse> alerts = emergencyService.searchAlerts(keyword, status, severity);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/alerts/{alertCode}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY', 'STAFF', 'RESIDENT')")
    public ResponseEntity<EmergencyAlertResponse> getAlertByCode(@PathVariable String alertCode) {
        EmergencyAlertResponse alert = emergencyService.getAlertByCode(alertCode);
        return ResponseEntity.ok(alert);
    }

    @PostMapping("/alerts/{alertCode}/acknowledge")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY', 'STAFF')")
    public ResponseEntity<EmergencyAlertResponse> acknowledgeAlert(
            @PathVariable String alertCode,
            Authentication authentication) {
        EmergencyAlertResponse response = emergencyService.acknowledgeAlert(alertCode, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/alerts/{alertCode}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY', 'STAFF')")
    public ResponseEntity<EmergencyAlertResponse> resolveAlert(
            @PathVariable String alertCode,
            @Valid @RequestBody UpdateAlertStatusRequest request,
            Authentication authentication) {
        EmergencyAlertResponse response = emergencyService.resolveAlert(alertCode, request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY', 'STAFF')")
    public ResponseEntity<EmergencySummaryResponse> getSummary() {
        EmergencySummaryResponse summary = emergencyService.getSummary();
        return ResponseEntity.ok(summary);
    }
}
