package com.smartliving.module3residents.dto;

import com.smartliving.module3residents.model.IdProofType;
import com.smartliving.module3residents.model.Resident;
import com.smartliving.module3residents.model.ResidentStatus;
import com.smartliving.module2propertyrooms.rooms.model.Bed;
import com.smartliving.module2propertyrooms.rooms.model.Room;
import com.smartliving.module2propertyrooms.properties.model.Floor;
import com.smartliving.module2propertyrooms.properties.model.Building;
import com.smartliving.module2propertyrooms.properties.model.Property;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ResidentResponse {

    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String admissionNumber;
    private IdProofType idProofType;
    private String idProofNumber;
    private String emergencyContactName;
    private String emergencyContactRelation;
    private String emergencyContactPhone;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private ResidentStatus status;
    private BigDecimal monthlyRent;
    private BigDecimal depositAmount;
    private String permanentAddress;
    private String notes;

    // Bed & Location info
    private Long bedId;
    private String bedNumber;
    private Long roomId;
    private String roomNumber;
    private Integer floorNumber;
    private String buildingName;
    private String propertyName;

    private LocalDateTime createdAt;

    public ResidentResponse() {
    }

    public static ResidentResponse fromEntity(Resident resident) {
        ResidentResponse resp = new ResidentResponse();
        resp.setId(resident.getId());
        if (resident.getUser() != null) {
            resp.setUserId(resident.getUser().getId());
            resp.setFullName(resident.getUser().getFullName());
            resp.setEmail(resident.getUser().getEmail());
            resp.setPhone(resident.getUser().getPhone());
        }
        resp.setAdmissionNumber(resident.getAdmissionNumber());
        resp.setIdProofType(resident.getIdProofType());
        resp.setIdProofNumber(resident.getIdProofNumber());
        resp.setEmergencyContactName(resident.getEmergencyContactName());
        resp.setEmergencyContactRelation(resident.getEmergencyContactRelation());
        resp.setEmergencyContactPhone(resident.getEmergencyContactPhone());
        resp.setCheckInDate(resident.getCheckInDate());
        resp.setCheckOutDate(resident.getCheckOutDate());
        resp.setStatus(resident.getStatus());
        resp.setMonthlyRent(resident.getMonthlyRent());
        resp.setDepositAmount(resident.getDepositAmount());
        resp.setPermanentAddress(resident.getPermanentAddress());
        resp.setNotes(resident.getNotes());
        resp.setCreatedAt(resident.getCreatedAt());

        Bed bed = resident.getBed();
        if (bed != null) {
            resp.setBedId(bed.getId());
            resp.setBedNumber(bed.getBedNumber());
            Room room = bed.getRoom();
            if (room != null) {
                resp.setRoomId(room.getId());
                resp.setRoomNumber(room.getRoomNumber());
                Floor floor = room.getFloor();
                if (floor != null) {
                    resp.setFloorNumber(floor.getFloorNumber());
                    Building building = floor.getBuilding();
                    if (building != null) {
                        resp.setBuildingName(building.getName());
                        Property property = building.getProperty();
                        if (property != null) {
                            resp.setPropertyName(property.getName());
                        }
                    }
                }
            }
        }
        return resp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAdmissionNumber() {
        return admissionNumber;
    }

    public void setAdmissionNumber(String admissionNumber) {
        this.admissionNumber = admissionNumber;
    }

    public IdProofType getIdProofType() {
        return idProofType;
    }

    public void setIdProofType(IdProofType idProofType) {
        this.idProofType = idProofType;
    }

    public String getIdProofNumber() {
        return idProofNumber;
    }

    public void setIdProofNumber(String idProofNumber) {
        this.idProofNumber = idProofNumber;
    }

    public String getEmergencyContactName() {
        return emergencyContactName;
    }

    public void setEmergencyContactName(String emergencyContactName) {
        this.emergencyContactName = emergencyContactName;
    }

    public String getEmergencyContactRelation() {
        return emergencyContactRelation;
    }

    public void setEmergencyContactRelation(String emergencyContactRelation) {
        this.emergencyContactRelation = emergencyContactRelation;
    }

    public String getEmergencyContactPhone() {
        return emergencyContactPhone;
    }

    public void setEmergencyContactPhone(String emergencyContactPhone) {
        this.emergencyContactPhone = emergencyContactPhone;
    }

    public LocalDate getCheckInDate() {
        return checkInDate;
    }

    public void setCheckInDate(LocalDate checkInDate) {
        this.checkInDate = checkInDate;
    }

    public LocalDate getCheckOutDate() {
        return checkOutDate;
    }

    public void setCheckOutDate(LocalDate checkOutDate) {
        this.checkOutDate = checkOutDate;
    }

    public ResidentStatus getStatus() {
        return status;
    }

    public void setStatus(ResidentStatus status) {
        this.status = status;
    }

    public BigDecimal getMonthlyRent() {
        return monthlyRent;
    }

    public void setMonthlyRent(BigDecimal monthlyRent) {
        this.monthlyRent = monthlyRent;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public String getPermanentAddress() {
        return permanentAddress;
    }

    public void setPermanentAddress(String permanentAddress) {
        this.permanentAddress = permanentAddress;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Long getBedId() {
        return bedId;
    }

    public void setBedId(Long bedId) {
        this.bedId = bedId;
    }

    public String getBedNumber() {
        return bedNumber;
    }

    public void setBedNumber(String bedNumber) {
        this.bedNumber = bedNumber;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public Integer getFloorNumber() {
        return floorNumber;
    }

    public void setFloorNumber(Integer floorNumber) {
        this.floorNumber = floorNumber;
    }

    public String getBuildingName() {
        return buildingName;
    }

    public void setBuildingName(String buildingName) {
        this.buildingName = buildingName;
    }

    public String getPropertyName() {
        return propertyName;
    }

    public void setPropertyName(String propertyName) {
        this.propertyName = propertyName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
