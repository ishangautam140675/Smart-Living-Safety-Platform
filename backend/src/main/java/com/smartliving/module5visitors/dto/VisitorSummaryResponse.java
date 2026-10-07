package com.smartliving.module5visitors.dto;

public class VisitorSummaryResponse {

    private long totalPasses;
    private long activeInside;
    private long expectedToday;
    private long checkedOut;
    private long pendingApproval;

    public VisitorSummaryResponse() {}

    public VisitorSummaryResponse(long totalPasses, long activeInside, long expectedToday,
                                  long checkedOut, long pendingApproval) {
        this.totalPasses = totalPasses;
        this.activeInside = activeInside;
        this.expectedToday = expectedToday;
        this.checkedOut = checkedOut;
        this.pendingApproval = pendingApproval;
    }

    public long getTotalPasses() { return totalPasses; }
    public void setTotalPasses(long totalPasses) { this.totalPasses = totalPasses; }

    public long getActiveInside() { return activeInside; }
    public void setActiveInside(long activeInside) { this.activeInside = activeInside; }

    public long getExpectedToday() { return expectedToday; }
    public void setExpectedToday(long expectedToday) { this.expectedToday = expectedToday; }

    public long getCheckedOut() { return checkedOut; }
    public void setCheckedOut(long checkedOut) { this.checkedOut = checkedOut; }

    public long getPendingApproval() { return pendingApproval; }
    public void setPendingApproval(long pendingApproval) { this.pendingApproval = pendingApproval; }
}
