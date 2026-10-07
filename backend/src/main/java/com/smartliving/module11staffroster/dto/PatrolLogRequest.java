package com.smartliving.module11staffroster.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PatrolLogRequest {

    @NotNull(message = "Shift ID is required")
    private Long shiftId;

    @NotBlank(message = "Checkpoint name is required")
    private String checkpointName;

    private String observationRemarks;

    private boolean incidentFlag = false;

    public Long getShiftId() { return shiftId; }
    public void setShiftId(Long shiftId) { this.shiftId = shiftId; }

    public String getCheckpointName() { return checkpointName; }
    public void setCheckpointName(String checkpointName) { this.checkpointName = checkpointName; }

    public String getObservationRemarks() { return observationRemarks; }
    public void setObservationRemarks(String observationRemarks) { this.observationRemarks = observationRemarks; }

    public boolean isIncidentFlag() { return incidentFlag; }
    public void setIncidentFlag(boolean incidentFlag) { this.incidentFlag = incidentFlag; }
}
