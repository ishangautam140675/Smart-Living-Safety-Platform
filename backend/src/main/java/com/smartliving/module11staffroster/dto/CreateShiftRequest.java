package com.smartliving.module11staffroster.dto;

import com.smartliving.module11staffroster.model.ShiftType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class CreateShiftRequest {

    @NotNull(message = "Staff user ID is required")
    private Long staffUserId;

    @NotNull(message = "Shift type is required")
    private ShiftType shiftType;

    @NotNull(message = "Shift date is required")
    private LocalDate shiftDate;

    @NotBlank(message = "Location is required")
    private String location;

    private String notes;

    public Long getStaffUserId() { return staffUserId; }
    public void setStaffUserId(Long staffUserId) { this.staffUserId = staffUserId; }

    public ShiftType getShiftType() { return shiftType; }
    public void setShiftType(ShiftType shiftType) { this.shiftType = shiftType; }

    public LocalDate getShiftDate() { return shiftDate; }
    public void setShiftDate(LocalDate shiftDate) { this.shiftDate = shiftDate; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
