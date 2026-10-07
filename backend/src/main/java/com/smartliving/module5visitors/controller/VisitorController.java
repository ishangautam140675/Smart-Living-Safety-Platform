package com.smartliving.module5visitors.controller;

import com.smartliving.module5visitors.dto.*;
import com.smartliving.module5visitors.model.VisitorPassStatus;
import com.smartliving.module5visitors.service.VisitorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visitors")
public class VisitorController {

    private final VisitorService visitorService;

    public VisitorController(VisitorService visitorService) {
        this.visitorService = visitorService;
    }

    @PostMapping("/passes")
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN', 'SECURITY')")
    public ResponseEntity<VisitorPassResponse> createPass(
            @Valid @RequestBody VisitorPassRequest request,
            Authentication authentication) {
        VisitorPassResponse response = visitorService.createPass(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-passes")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<List<VisitorPassResponse>> getMyPasses(Authentication authentication) {
        List<VisitorPassResponse> passes = visitorService.getMyPasses(authentication.getName());
        return ResponseEntity.ok(passes);
    }

    @GetMapping("/passes")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY', 'STAFF')")
    public ResponseEntity<List<VisitorPassResponse>> searchPasses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) VisitorPassStatus status) {
        List<VisitorPassResponse> passes = visitorService.searchPasses(keyword, status);
        return ResponseEntity.ok(passes);
    }

    @GetMapping("/passes/{code}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY', 'STAFF', 'RESIDENT')")
    public ResponseEntity<VisitorPassResponse> getPassByCode(@PathVariable String code) {
        VisitorPassResponse pass = visitorService.getPassByCode(code);
        return ResponseEntity.ok(pass);
    }

    @PostMapping("/passes/{code}/check-in")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY')")
    public ResponseEntity<VisitorPassResponse> checkIn(
            @PathVariable String code,
            @RequestBody(required = false) VisitorCheckInRequest request,
            Authentication authentication) {
        VisitorPassResponse response = visitorService.checkIn(code, request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/passes/{code}/check-out")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY')")
    public ResponseEntity<VisitorPassResponse> checkOut(
            @PathVariable String code,
            @RequestBody(required = false) VisitorCheckOutRequest request,
            Authentication authentication) {
        VisitorPassResponse response = visitorService.checkOut(code, request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY')")
    public ResponseEntity<VisitorSummaryResponse> getSummary() {
        VisitorSummaryResponse summary = visitorService.getSummary();
        return ResponseEntity.ok(summary);
    }
}
