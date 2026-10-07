package com.smartliving.module2propertyrooms.properties.dto;

import com.smartliving.module2propertyrooms.properties.model.Property;
import com.smartliving.module2propertyrooms.properties.model.PropertyType;

import java.time.LocalDateTime;

public class PropertyResponse {

    private Long id;
    private String name;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private PropertyType propertyType;
    private String contactPhone;
    private String contactEmail;
    private String description;
    private int totalBuildings;
    private int totalFloors;
    private int totalRooms;
    private LocalDateTime createdAt;

    public PropertyResponse() {
    }

    public static PropertyResponse fromEntity(Property property) {
        PropertyResponse response = new PropertyResponse();
        response.setId(property.getId());
        response.setName(property.getName());
        response.setAddress(property.getAddress());
        response.setCity(property.getCity());
        response.setState(property.getState());
        response.setPincode(property.getPincode());
        response.setPropertyType(property.getPropertyType());
        response.setContactPhone(property.getContactPhone());
        response.setContactEmail(property.getContactEmail());
        response.setDescription(property.getDescription());
        response.setCreatedAt(property.getCreatedAt());

        if (property.getBuildings() != null) {
            response.setTotalBuildings(property.getBuildings().size());
            int floorsCount = 0;
            int roomsCount = 0;
            for (var b : property.getBuildings()) {
                if (b.getFloors() != null) {
                    floorsCount += b.getFloors().size();
                    for (var f : b.getFloors()) {
                        if (f.getRooms() != null) {
                            roomsCount += f.getRooms().size();
                        }
                    }
                }
            }
            response.setTotalFloors(floorsCount);
            response.setTotalRooms(roomsCount);
        }
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public PropertyType getPropertyType() {
        return propertyType;
    }

    public void setPropertyType(PropertyType propertyType) {
        this.propertyType = propertyType;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getTotalBuildings() {
        return totalBuildings;
    }

    public void setTotalBuildings(int totalBuildings) {
        this.totalBuildings = totalBuildings;
    }

    public int getTotalFloors() {
        return totalFloors;
    }

    public void setTotalFloors(int totalFloors) {
        this.totalFloors = totalFloors;
    }

    public int getTotalRooms() {
        return totalRooms;
    }

    public void setTotalRooms(int totalRooms) {
        this.totalRooms = totalRooms;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
