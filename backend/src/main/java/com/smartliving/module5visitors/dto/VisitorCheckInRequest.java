package com.smartliving.module5visitors.dto;

public class VisitorCheckInRequest {

    private String vehicleNumber;
    private String idProofType;
    private String idProofNumber;
    private String securityNotes;

    public VisitorCheckInRequest() {}

    public VisitorCheckInRequest(String vehicleNumber, String idProofType, String idProofNumber, String securityNotes) {
        this.vehicleNumber = vehicleNumber;
        this.idProofType = idProofType;
        this.idProofNumber = idProofNumber;
        this.securityNotes = securityNotes;
    }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getIdProofType() { return idProofType; }
    public void setIdProofType(String idProofType) { this.idProofType = idProofType; }

    public String getIdProofNumber() { return idProofNumber; }
    public void setIdProofNumber(String idProofNumber) { this.idProofNumber = idProofNumber; }

    public String getSecurityNotes() { return securityNotes; }
    public void setSecurityNotes(String securityNotes) { this.securityNotes = securityNotes; }
}
