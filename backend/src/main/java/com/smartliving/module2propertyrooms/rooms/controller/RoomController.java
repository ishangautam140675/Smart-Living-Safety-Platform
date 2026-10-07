package com.smartliving.module2propertyrooms.rooms.controller;

import com.smartliving.common.dto.ApiResponse;
import com.smartliving.module2propertyrooms.rooms.dto.BedResponse;
import com.smartliving.module2propertyrooms.rooms.dto.BedStatusUpdateRequest;
import com.smartliving.module2propertyrooms.rooms.dto.RoomRequest;
import com.smartliving.module2propertyrooms.rooms.dto.RoomResponse;
import com.smartliving.module2propertyrooms.rooms.dto.RoomSummaryResponse;
import com.smartliving.module2propertyrooms.rooms.model.RoomStatus;
import com.smartliving.module2propertyrooms.rooms.model.RoomType;
import com.smartliving.module2propertyrooms.rooms.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getRooms(
            @RequestParam(required = false) Long floorId,
            @RequestParam(required = false) Long buildingId,
            @RequestParam(required = false) Long propertyId,
            @RequestParam(required = false) RoomStatus status,
            @RequestParam(required = false) RoomType roomType) {
        List<RoomResponse> rooms = roomService.getRooms(floorId, buildingId, propertyId, status, roomType);
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<RoomSummaryResponse>> getRoomSummary() {
        RoomSummaryResponse summary = roomService.getRoomSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoomById(@PathVariable Long id) {
        RoomResponse room = roomService.getRoomById(id);
        return ResponseEntity.ok(ApiResponse.success(room));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(@Valid @RequestBody RoomRequest request) {
        RoomResponse created = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Room created successfully with allocated beds", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoom(@PathVariable Long id,
                                                                @Valid @RequestBody RoomRequest request) {
        RoomResponse updated = roomService.updateRoom(id, request);
        return ResponseEntity.ok(ApiResponse.success("Room updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponse.success("Room deleted successfully", null));
    }

    @GetMapping("/{roomId}/beds")
    public ResponseEntity<ApiResponse<List<BedResponse>>> getBedsByRoom(@PathVariable Long roomId) {
        List<BedResponse> beds = roomService.getBedsByRoom(roomId);
        return ResponseEntity.ok(ApiResponse.success(beds));
    }

    @PutMapping("/{roomId}/beds/{bedId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<BedResponse>> updateBedStatus(
            @PathVariable Long roomId,
            @PathVariable Long bedId,
            @Valid @RequestBody BedStatusUpdateRequest request) {
        BedResponse updatedBed = roomService.updateBedStatus(roomId, bedId, request);
        return ResponseEntity.ok(ApiResponse.success("Bed status updated successfully", updatedBed));
    }
}
