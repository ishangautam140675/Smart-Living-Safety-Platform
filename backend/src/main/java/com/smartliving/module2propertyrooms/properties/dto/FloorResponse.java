package com.smartliving.module2propertyrooms.properties.dto;

import com.smartliving.module2propertyrooms.properties.model.Floor;

public class FloorResponse {

    private Long id;
    private Long buildingId;
    private String buildingName;
    private Integer floorNumber;
    private String floorName;
    private int totalRooms;

    public FloorResponse() {
    }

    public static FloorResponse fromEntity(Floor floor) {
        FloorResponse response = new FloorResponse();
        response.setId(floor.getId());
        if (floor.getBuilding() != null) {
            response.setBuildingId(floor.getBuilding().getId());
            response.setBuildingName(floor.getBuilding().getName());
        }
        response.setFloorNumber(floor.getFloorNumber());
        response.setFloorName(floor.getFloorName());
        if (floor.getRooms() != null) {
            response.setTotalRooms(floor.getRooms().size());
        }
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBuildingId() {
        return buildingId;
    }

    public void setBuildingId(Long buildingId) {
        this.buildingId = buildingId;
    }

    public String getBuildingName() {
        return buildingName;
    }

    public void setBuildingName(String buildingName) {
        this.buildingName = buildingName;
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

    public int getTotalRooms() {
        return totalRooms;
    }

    public void setTotalRooms(int totalRooms) {
        this.totalRooms = totalRooms;
    }
}
