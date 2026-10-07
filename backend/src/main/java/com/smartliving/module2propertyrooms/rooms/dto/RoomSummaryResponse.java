package com.smartliving.module2propertyrooms.rooms.dto;

public class RoomSummaryResponse {

    private long totalProperties;
    private long totalBuildings;
    private long totalFloors;
    private long totalRooms;
    private long totalBeds;
    private long occupiedBeds;
    private long availableBeds;
    private long maintenanceBeds;
    private double occupancyRate;

    public RoomSummaryResponse() {
    }

    public RoomSummaryResponse(long totalProperties, long totalBuildings, long totalFloors,
                               long totalRooms, long totalBeds, long occupiedBeds,
                               long availableBeds, long maintenanceBeds) {
        this.totalProperties = totalProperties;
        this.totalBuildings = totalBuildings;
        this.totalFloors = totalFloors;
        this.totalRooms = totalRooms;
        this.totalBeds = totalBeds;
        this.occupiedBeds = occupiedBeds;
        this.availableBeds = availableBeds;
        this.maintenanceBeds = maintenanceBeds;
        this.occupancyRate = totalBeds > 0 ? ((double) occupiedBeds / totalBeds) * 100.0 : 0.0;
    }

    public long getTotalProperties() {
        return totalProperties;
    }

    public void setTotalProperties(long totalProperties) {
        this.totalProperties = totalProperties;
    }

    public long getTotalBuildings() {
        return totalBuildings;
    }

    public void setTotalBuildings(long totalBuildings) {
        this.totalBuildings = totalBuildings;
    }

    public long getTotalFloors() {
        return totalFloors;
    }

    public void setTotalFloors(long totalFloors) {
        this.totalFloors = totalFloors;
    }

    public long getTotalRooms() {
        return totalRooms;
    }

    public void setTotalRooms(long totalRooms) {
        this.totalRooms = totalRooms;
    }

    public long getTotalBeds() {
        return totalBeds;
    }

    public void setTotalBeds(long totalBeds) {
        this.totalBeds = totalBeds;
    }

    public long getOccupiedBeds() {
        return occupiedBeds;
    }

    public void setOccupiedBeds(long occupiedBeds) {
        this.occupiedBeds = occupiedBeds;
    }

    public long getAvailableBeds() {
        return availableBeds;
    }

    public void setAvailableBeds(long availableBeds) {
        this.availableBeds = availableBeds;
    }

    public long getMaintenanceBeds() {
        return maintenanceBeds;
    }

    public void setMaintenanceBeds(long maintenanceBeds) {
        this.maintenanceBeds = maintenanceBeds;
    }

    public double getOccupancyRate() {
        return occupancyRate;
    }

    public void setOccupancyRate(double occupancyRate) {
        this.occupancyRate = occupancyRate;
    }
}
