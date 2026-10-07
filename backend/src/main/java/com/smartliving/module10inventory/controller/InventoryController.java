package com.smartliving.module10inventory.controller;

import com.smartliving.module10inventory.dto.*;
import com.smartliving.module10inventory.model.AssetCategory;
import com.smartliving.module10inventory.model.AssetCondition;
import com.smartliving.module10inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<AssetResponse> createAsset(@Valid @RequestBody CreateAssetRequest request) {
        AssetResponse response = inventoryService.createAsset(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<AssetResponse> updateAsset(
            @PathVariable Long id,
            @Valid @RequestBody CreateAssetRequest request) {
        AssetResponse response = inventoryService.updateAsset(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/audit")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<AssetResponse> auditAssetCondition(
            @PathVariable Long id,
            @Valid @RequestBody AuditAssetRequest request,
            Authentication authentication) {
        AssetResponse response = inventoryService.auditAssetCondition(id, request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'SECURITY')")
    public ResponseEntity<List<AssetResponse>> searchAssets(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) AssetCategory category,
            @RequestParam(required = false) AssetCondition condition,
            @RequestParam(required = false) Long roomId) {
        List<AssetResponse> assets = inventoryService.searchAssets(keyword, category, condition, roomId);
        return ResponseEntity.ok(assets);
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<AssetResponse>> getRoomAssets(@PathVariable Long roomId) {
        List<AssetResponse> assets = inventoryService.getRoomAssets(roomId);
        return ResponseEntity.ok(assets);
    }

    @GetMapping("/{id}/audit-history")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<AssetAuditLogResponse>> getAssetAuditHistory(@PathVariable Long id) {
        List<AssetAuditLogResponse> history = inventoryService.getAssetAuditHistory(id);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<InventorySummaryResponse> getInventorySummary() {
        InventorySummaryResponse summary = inventoryService.getInventorySummary();
        return ResponseEntity.ok(summary);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id) {
        inventoryService.deleteAsset(id);
        return ResponseEntity.noContent().build();
    }
}
