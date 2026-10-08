package com.smartliving.module2propertyrooms.rooms.controller;

import com.smartliving.common.dto.ApiResponse;
import com.smartliving.module2propertyrooms.rooms.dto.*;
import com.smartliving.module2propertyrooms.rooms.service.RoomBookingRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.smartliving.module1authentication.users.repository.UserRepository;
import java.util.List;

@RestController
@RequestMapping("/api/room-booking-requests")
public class RoomBookingRequestController {
    private final RoomBookingRequestService service;
    private final UserRepository userRepository;

    public RoomBookingRequestController(RoomBookingRequestService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<RoomBookingRequestDto>> createRequest(
            @RequestBody CreateRoomBookingRequest req, Authentication auth) {
        Long userId = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found")).getId();
        RoomBookingRequestDto dto = service.createRequest(userId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Booking request submitted", dto));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<List<RoomBookingRequestDto>>> getAllRequests() {
        return ResponseEntity.ok(ApiResponse.success(service.getAllRequests()));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<List<RoomBookingRequestDto>>> getPendingRequests() {
        return ResponseEntity.ok(ApiResponse.success(service.getPendingRequests()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ApiResponse<List<RoomBookingRequestDto>>> getMyRequests(Authentication auth) {
        Long userId = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found")).getId();
        return ResponseEntity.ok(ApiResponse.success(service.getMyRequests(userId)));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoomBookingRequestDto>> approve(
            @PathVariable Long id, @RequestBody AdminBookingResponseDto resp) {
        return ResponseEntity.ok(ApiResponse.success("Request approved", service.approveRequest(id, resp)));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoomBookingRequestDto>> reject(
            @PathVariable Long id, @RequestBody AdminBookingResponseDto resp) {
        return ResponseEntity.ok(ApiResponse.success("Request rejected", service.rejectRequest(id, resp)));
    }
}
