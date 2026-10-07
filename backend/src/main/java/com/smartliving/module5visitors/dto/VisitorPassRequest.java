package com.smartliving.module5visitors.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public class VisitorPassRequest {

    @NotBlank(message = "Visitor name is required")
    private String visitorName;

    @NotBlank(message = "Visitor phone number is required")
    private String visitorPhone;

    @NotBlank(message = "Visit purpose is required")
    private String purpose;

    @NotNull(message = "Expected visit date is required")
    private LocalDate expectedDate;

    private LocalTime expectedTime;
    private String vehicleNumber;
    private String idProofType;
    private String idProofNumber;
    private String hostNotes;
    private Long residentId; // optional: for admin/security creating on behalf of resident

    public VisitorPassRequest() {}

    public VisitorPassRequest(String visitorName, String visitorPhone, String purpose,
                              LocalDate expectedDate, LocalTime expectedTime) {
        this.visitorName = visitorName;
        this.visitorPhone = visitorPhone;
        this.purpose = purpose;
        this.expectedDate = expectedDate;
        this.expectedTime = expectedTime;
    }

    public String getVisitorName() { return visitorName; }
    public void setVisitorName(String visitorName) { this.visitorName = visitorName; }

    public String getVisitorPhone() { return visitorPhone; }
    public void setVisitorPhone(String visitorPhone) { this.visitorPhone = visitorPhone; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public LocalDate getExpectedDate() { return expectedDate; }
    public void setExpectedDate(LocalDate expectedDate) { this.expectedDate = expectedDate; }

    public LocalTime getExpectedTime() { return expectedTime; }
    public void setExpectedTime(LocalTime expectedTime) { this.expectedTime = expectedTime; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getIdProofType() { return idProofType; }
    public void setIdProofType(String idProofType) { this.idProofType = idProofType; }

    public String getIdProofNumber() { return idProofNumber; }
    public void setIdProofNumber(String idProofNumber) { this.idProofNumber = idProofNumber; }

    public String getHostNotes() { return hostNotes; }
    public void setHostNotes(String hostNotes) { this.hostNotes = hostNotes; }

    public Long getResidentId() { return residentId; }
    public void setResidentId(Long residentId) { this.residentId = residentId; }
}
