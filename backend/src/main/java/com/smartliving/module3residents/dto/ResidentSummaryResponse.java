package com.smartliving.module3residents.dto;

public class ResidentSummaryResponse {

    private long totalResidents;
    private long activeResidents;
    private long pendingVerification;
    private long checkedOutResidents;
    private long allocatedBedsCount;

    public ResidentSummaryResponse() {
    }

    public ResidentSummaryResponse(long totalResidents, long activeResidents,
                                   long pendingVerification, long checkedOutResidents,
                                   long allocatedBedsCount) {
        this.totalResidents = totalResidents;
        this.activeResidents = activeResidents;
        this.pendingVerification = pendingVerification;
        this.checkedOutResidents = checkedOutResidents;
        this.allocatedBedsCount = allocatedBedsCount;
    }

    public long getTotalResidents() {
        return totalResidents;
    }

    public void setTotalResidents(long totalResidents) {
        this.totalResidents = totalResidents;
    }

    public long getActiveResidents() {
        return activeResidents;
    }

    public void setActiveResidents(long activeResidents) {
        this.activeResidents = activeResidents;
    }

    public long getPendingVerification() {
        return pendingVerification;
    }

    public void setPendingVerification(long pendingVerification) {
        this.pendingVerification = pendingVerification;
    }

    public long getCheckedOutResidents() {
        return checkedOutResidents;
    }

    public void setCheckedOutResidents(long checkedOutResidents) {
        this.checkedOutResidents = checkedOutResidents;
    }

    public long getAllocatedBedsCount() {
        return allocatedBedsCount;
    }

    public void setAllocatedBedsCount(long allocatedBedsCount) {
        this.allocatedBedsCount = allocatedBedsCount;
    }
}
