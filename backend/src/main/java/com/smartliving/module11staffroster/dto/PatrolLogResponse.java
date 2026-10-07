package com.smartliving.module11staffroster.dto;

import java.time.LocalDateTime;

public class PatrolLogResponse {
    private Long id;
    private Long shiftId;
    private String staffName;
    private String checkpointName;
    private String observationRemarks;
    private boolean incidentFlag;
    private LocalDateTime verifiedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getShiftId() { return shiftId; }
    public void setShiftId(Long shiftId) { this.shiftId = shiftId; }

    public String getStaffName() { return staffName; }
    public void setStaffName(String staffName) { this.staffName = staffName; }

    public String getCheckpointName() { return checkpointName; }
    public void setCheckpointName(String checkpointName) { this.checkpointName = checkpointName; }

    public String getObservationRemarks() { return observationRemarks; }
    public void setObservationRemarks(String observationRemarks) { this.observationRemarks = observationRemarks; }

    public boolean isIncidentFlag() { return incidentFlag; }
    public void setIncidentFlag(boolean incidentFlag) { this.incidentFlag = incidentFlag; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
}
