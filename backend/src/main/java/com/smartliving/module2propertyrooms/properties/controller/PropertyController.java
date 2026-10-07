package com.smartliving.module2propertyrooms.properties.controller;

import com.smartliving.common.dto.ApiResponse;
import com.smartliving.module2propertyrooms.properties.dto.BuildingRequest;
import com.smartliving.module2propertyrooms.properties.dto.BuildingResponse;
import com.smartliving.module2propertyrooms.properties.dto.FloorRequest;
import com.smartliving.module2propertyrooms.properties.dto.FloorResponse;
import com.smartliving.module2propertyrooms.properties.dto.PropertyRequest;
import com.smartliving.module2propertyrooms.properties.dto.PropertyResponse;
import com.smartliving.module2propertyrooms.properties.service.PropertyService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PropertyController {

    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @GetMapping("/properties")
    public ResponseEntity<ApiResponse<List<PropertyResponse>>> getAllProperties() {
        List<PropertyResponse> properties = propertyService.getAllProperties();
        return ResponseEntity.ok(ApiResponse.success(properties));
    }

    @GetMapping("/properties/{id}")
    public ResponseEntity<ApiResponse<PropertyResponse>> getPropertyById(@PathVariable Long id) {
        PropertyResponse property = propertyService.getPropertyById(id);
        return ResponseEntity.ok(ApiResponse.success(property));
    }

    @PostMapping("/properties")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PropertyResponse>> createProperty(@Valid @RequestBody PropertyRequest request) {
        PropertyResponse created = propertyService.createProperty(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Property created successfully", created));
    }

    @PutMapping("/properties/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PropertyResponse>> updateProperty(@PathVariable Long id,
                                                                         @Valid @RequestBody PropertyRequest request) {
        PropertyResponse updated = propertyService.updateProperty(id, request);
        return ResponseEntity.ok(ApiResponse.success("Property updated successfully", updated));
    }

    @DeleteMapping("/properties/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProperty(@PathVariable Long id) {
        propertyService.deleteProperty(id);
        return ResponseEntity.ok(ApiResponse.success("Property deleted successfully", null));
    }

    @GetMapping("/properties/{propertyId}/buildings")
    public ResponseEntity<ApiResponse<List<BuildingResponse>>> getBuildingsByProperty(@PathVariable Long propertyId) {
        List<BuildingResponse> buildings = propertyService.getBuildingsByProperty(propertyId);
        return ResponseEntity.ok(ApiResponse.success(buildings));
    }

    @PostMapping("/properties/{propertyId}/buildings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BuildingResponse>> addBuilding(@PathVariable Long propertyId,
                                                                      @Valid @RequestBody BuildingRequest request) {
        request.setPropertyId(propertyId);
        BuildingResponse created = propertyService.addBuilding(propertyId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Building added successfully", created));
    }

    @GetMapping("/buildings/{buildingId}/floors")
    public ResponseEntity<ApiResponse<List<FloorResponse>>> getFloorsByBuilding(@PathVariable Long buildingId) {
        List<FloorResponse> floors = propertyService.getFloorsByBuilding(buildingId);
        return ResponseEntity.ok(ApiResponse.success(floors));
    }

    @PostMapping("/buildings/{buildingId}/floors")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FloorResponse>> addFloor(@PathVariable Long buildingId,
                                                                @Valid @RequestBody FloorRequest request) {
        request.setBuildingId(buildingId);
        FloorResponse created = propertyService.addFloor(buildingId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Floor added successfully", created));
    }
}
