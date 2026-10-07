package com.smartliving.module5visitors.dto;

import com.smartliving.module5visitors.model.VisitorPassStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class VisitorPassResponse {

    private Long id;
    private String passCode;
    private String visitorName;
    private String visitorPhone;
    private String purpose;

    private Long residentId;
    private String residentName;
    private String residentPhone;
    private String roomNumber;
    private String buildingName;

    private LocalDate expectedDate;
    private LocalTime expectedTime;
    private VisitorPassStatus status;

    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String vehicleNumber;
    private String idProofType;
    private String idProofNumber;
    private String hostNotes;
    private String securityNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public VisitorPassResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPassCode() { return passCode; }
    public void setPassCode(String passCode) { this.passCode = passCode; }

    public String getVisitorName() { return visitorName; }
    public void setVisitorName(String visitorName) { this.visitorName = visitorName; }

    public String getVisitorPhone() { return visitorPhone; }
    public void setVisitorPhone(String visitorPhone) { this.visitorPhone = visitorPhone; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public Long getResidentId() { return residentId; }
    public void setResidentId(Long residentId) { this.residentId = residentId; }

    public String getResidentName() { return residentName; }
    public void setResidentName(String residentName) { this.residentName = residentName; }

    public String getResidentPhone() { return residentPhone; }
    public void setResidentPhone(String residentPhone) { this.residentPhone = residentPhone; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }

    public LocalDate getExpectedDate() { return expectedDate; }
    public void setExpectedDate(LocalDate expectedDate) { this.expectedDate = expectedDate; }

    public LocalTime getExpectedTime() { return expectedTime; }
    public void setExpectedTime(LocalTime expectedTime) { this.expectedTime = expectedTime; }

    public VisitorPassStatus getStatus() { return status; }
    public void setStatus(VisitorPassStatus status) { this.status = status; }

    public LocalDateTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalDateTime checkInTime) { this.checkInTime = checkInTime; }

    public LocalDateTime getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(LocalDateTime checkOutTime) { this.checkOutTime = checkOutTime; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getIdProofType() { return idProofType; }
    public void setIdProofType(String idProofType) { this.idProofType = idProofType; }

    public String getIdProofNumber() { return idProofNumber; }
    public void setIdProofNumber(String idProofNumber) { this.idProofNumber = idProofNumber; }

    public String getHostNotes() { return hostNotes; }
    public void setHostNotes(String hostNotes) { this.hostNotes = hostNotes; }

    public String getSecurityNotes() { return securityNotes; }
    public void setSecurityNotes(String securityNotes) { this.securityNotes = securityNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
