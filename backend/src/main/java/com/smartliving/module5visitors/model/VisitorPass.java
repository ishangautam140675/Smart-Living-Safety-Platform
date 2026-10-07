package com.smartliving.module5visitors.model;

import com.smartliving.module3residents.model.Resident;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "visitor_passes")
public class VisitorPass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pass_code", nullable = false, unique = true, length = 32)
    private String passCode;

    @Column(name = "visitor_name", nullable = false, length = 120)
    private String visitorName;

    @Column(name = "visitor_phone", nullable = false, length = 20)
    private String visitorPhone;

    @Column(name = "purpose", nullable = false, length = 255)
    private String purpose;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resident_id", nullable = false)
    private Resident resident;

    @Column(name = "expected_date", nullable = false)
    private LocalDate expectedDate;

    @Column(name = "expected_time")
    private LocalTime expectedTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private VisitorPassStatus status = VisitorPassStatus.APPROVED;

    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;

    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;

    @Column(name = "vehicle_number", length = 30)
    private String vehicleNumber;

    @Column(name = "id_proof_type", length = 50)
    private String idProofType;

    @Column(name = "id_proof_number", length = 50)
    private String idProofNumber;

    @Column(name = "host_notes", length = 500)
    private String hostNotes;

    @Column(name = "security_notes", length = 500)
    private String securityNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = VisitorPassStatus.APPROVED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public VisitorPass() {}

    public VisitorPass(String passCode, String visitorName, String visitorPhone, String purpose,
                       Resident resident, LocalDate expectedDate, LocalTime expectedTime) {
        this.passCode = passCode;
        this.visitorName = visitorName;
        this.visitorPhone = visitorPhone;
        this.purpose = purpose;
        this.resident = resident;
        this.expectedDate = expectedDate;
        this.expectedTime = expectedTime;
        this.status = VisitorPassStatus.APPROVED;
    }

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

    public Resident getResident() { return resident; }
    public void setResident(Resident resident) { this.resident = resident; }

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
