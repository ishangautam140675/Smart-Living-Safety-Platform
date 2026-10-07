package com.smartliving.module11staffroster.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "patrol_logs")
public class PatrolLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", nullable = false)
    private StaffShift shift;

    @Column(name = "checkpoint_name", nullable = false, length = 120)
    private String checkpointName;

    @Column(name = "observation_remarks", length = 255)
    private String observationRemarks;

    @Column(name = "incident_flag", nullable = false)
    private boolean incidentFlag = false;

    @Column(name = "verified_at", nullable = false, updatable = false)
    private LocalDateTime verifiedAt = LocalDateTime.now();

    public PatrolLog() {
    }

    public PatrolLog(StaffShift shift, String checkpointName, String observationRemarks, boolean incidentFlag) {
        this.shift = shift;
        this.checkpointName = checkpointName;
        this.observationRemarks = observationRemarks;
        this.incidentFlag = incidentFlag;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public StaffShift getShift() {
        return shift;
    }

    public void setShift(StaffShift shift) {
        this.shift = shift;
    }

    public String getCheckpointName() {
        return checkpointName;
    }

    public void setCheckpointName(String checkpointName) {
        this.checkpointName = checkpointName;
    }

    public String getObservationRemarks() {
        return observationRemarks;
    }

    public void setObservationRemarks(String observationRemarks) {
        this.observationRemarks = observationRemarks;
    }

    public boolean isIncidentFlag() {
        return incidentFlag;
    }

    public void setIncidentFlag(boolean incidentFlag) {
        this.incidentFlag = incidentFlag;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
}
