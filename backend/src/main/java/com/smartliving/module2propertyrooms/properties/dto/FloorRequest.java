package com.smartliving.module2propertyrooms.properties.dto;

import jakarta.validation.constraints.NotNull;

public class FloorRequest {

    @NotNull(message = "Building ID is required")
    private Long buildingId;

    @NotNull(message = "Floor number is required")
    private Integer floorNumber;

    private String floorName;

    public FloorRequest() {
    }

    public Long getBuildingId() {
        return buildingId;
    }

    public void setBuildingId(Long buildingId) {
        this.buildingId = buildingId;
    }

    public Integer getFloorNumber() {
        return floorNumber;
    }

    public void setFloorNumber(Integer floorNumber) {
        this.floorNumber = floorNumber;
    }

    public String getFloorName() {
        return floorName;
    }

    public void setFloorName(String floorName) {
        this.floorName = floorName;
    }
}
