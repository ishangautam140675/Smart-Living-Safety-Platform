package com.smartliving.module11staffroster.dto;

import com.smartliving.module11staffroster.model.ShiftStatus;
import com.smartliving.module11staffroster.model.ShiftType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ShiftResponse {
    private Long id;
    private Long staffUserId;
    private String staffName;
    private String staffEmail;
    private ShiftType shiftType;
    private LocalDate shiftDate;
    private String location;
    private ShiftStatus status;
    private LocalDateTime clockInTime;
    private LocalDateTime clockOutTime;
    private String notes;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStaffUserId() { return staffUserId; }
    public void setStaffUserId(Long staffUserId) { this.staffUserId = staffUserId; }

    public String getStaffName() { return staffName; }
    public void setStaffName(String staffName) { this.staffName = staffName; }

    public String getStaffEmail() { return staffEmail; }
    public void setStaffEmail(String staffEmail) { this.staffEmail = staffEmail; }

    public ShiftType getShiftType() { return shiftType; }
    public void setShiftType(ShiftType shiftType) { this.shiftType = shiftType; }

    public LocalDate getShiftDate() { return shiftDate; }
    public void setShiftDate(LocalDate shiftDate) { this.shiftDate = shiftDate; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public ShiftStatus getStatus() { return status; }
    public void setStatus(ShiftStatus status) { this.status = status; }

    public LocalDateTime getClockInTime() { return clockInTime; }
    public void setClockInTime(LocalDateTime clockInTime) { this.clockInTime = clockInTime; }

    public LocalDateTime getClockOutTime() { return clockOutTime; }
    public void setClockOutTime(LocalDateTime clockOutTime) { this.clockOutTime = clockOutTime; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
