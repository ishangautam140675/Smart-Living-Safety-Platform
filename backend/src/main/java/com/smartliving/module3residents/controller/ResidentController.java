package com.smartliving.module3residents.controller;

import com.smartliving.common.dto.ApiResponse;
import com.smartliving.module3residents.dto.BedAllocationRequest;
import com.smartliving.module3residents.dto.ResidentOnboardingRequest;
import com.smartliving.module3residents.dto.ResidentProfileUpdateRequest;
import com.smartliving.module3residents.dto.ResidentResponse;
import com.smartliving.module3residents.dto.ResidentSummaryResponse;
import com.smartliving.module3residents.model.ResidentStatus;
import com.smartliving.module3residents.service.ResidentService;
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
import org.springframework.web.bind.annotation.DeleteMapping;

import java.util.List;

@RestController
@RequestMapping("/api/residents")
public class ResidentController {

    private final ResidentService residentService;

    public ResidentController(ResidentService residentService) {
        this.residentService = residentService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ResidentResponse>> getCurrentResidentProfile(Authentication authentication) {
        ResidentResponse resident = residentService.getResidentByEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(resident));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<ResidentResponse>> updateCurrentResidentProfile(
            Authentication authentication,
            @Valid @RequestBody ResidentProfileUpdateRequest request) {
        ResidentResponse updated = residentService.updateProfileByEmail(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY', 'STAFF')")
    public ResponseEntity<ApiResponse<List<ResidentResponse>>> getResidents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ResidentStatus status) {
        List<ResidentResponse> residents = residentService.getResidents(search, status);
        return ResponseEntity.ok(ApiResponse.success(residents));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResidentSummaryResponse>> getResidentSummary() {
        ResidentSummaryResponse summary = residentService.getResidentSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY', 'STAFF')")
    public ResponseEntity<ApiResponse<ResidentResponse>> getResidentById(@PathVariable Long id) {
        ResidentResponse resident = residentService.getResidentById(id);
        return ResponseEntity.ok(ApiResponse.success(resident));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResidentResponse>> onboardResident(
            @Valid @RequestBody ResidentOnboardingRequest request) {
        ResidentResponse created = residentService.onboardResident(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resident onboarded successfully", created));
    }

    @PutMapping("/{id}/allocate-bed")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResidentResponse>> allocateBed(
            @PathVariable Long id,
            @Valid @RequestBody BedAllocationRequest request) {
        ResidentResponse updated = residentService.allocateBed(id, request);
        return ResponseEntity.ok(ApiResponse.success("Bed allocated successfully", updated));
    }

    @PutMapping("/{id}/checkout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResidentResponse>> checkoutResident(@PathVariable Long id) {
        ResidentResponse updated = residentService.checkoutResident(id);
        return ResponseEntity.ok(ApiResponse.success("Resident checked out and bed deallocated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteResident(@PathVariable Long id) {
        residentService.deleteResident(id);
        return ResponseEntity.ok(ApiResponse.success("Resident deleted permanently", null));
    }
}
