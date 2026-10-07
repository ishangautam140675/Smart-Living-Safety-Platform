package com.smartliving.module2propertyrooms.properties.dto;

import com.smartliving.module2propertyrooms.properties.model.Building;

public class BuildingResponse {

    private Long id;
    private Long propertyId;
    private String propertyName;
    private String name;
    private String code;
    private Integer totalFloors;
    private String description;
    private int totalRooms;

    public BuildingResponse() {
    }

    public static BuildingResponse fromEntity(Building building) {
        BuildingResponse response = new BuildingResponse();
        response.setId(building.getId());
        if (building.getProperty() != null) {
            response.setPropertyId(building.getProperty().getId());
            response.setPropertyName(building.getProperty().getName());
        }
        response.setName(building.getName());
        response.setCode(building.getCode());
        response.setTotalFloors(building.getTotalFloors());
        response.setDescription(building.getDescription());

        if (building.getFloors() != null) {
            int rooms = 0;
            for (var f : building.getFloors()) {
                if (f.getRooms() != null) {
                    rooms += f.getRooms().size();
                }
            }
            response.setTotalRooms(rooms);
        }
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPropertyId() {
        return propertyId;
    }

    public void setPropertyId(Long propertyId) {
        this.propertyId = propertyId;
    }

    public String getPropertyName() {
        return propertyName;
    }

    public void setPropertyName(String propertyName) {
        this.propertyName = propertyName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Integer getTotalFloors() {
        return totalFloors;
    }

    public void setTotalFloors(Integer totalFloors) {
        this.totalFloors = totalFloors;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getTotalRooms() {
        return totalRooms;
    }

    public void setTotalRooms(int totalRooms) {
        this.totalRooms = totalRooms;
    }
}
