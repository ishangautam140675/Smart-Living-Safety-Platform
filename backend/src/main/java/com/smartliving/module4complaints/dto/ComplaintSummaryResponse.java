package com.smartliving.module4complaints.dto;

/**
 * KPI summary of complaints grouped by status.
 * Returned by {@code GET /api/complaints/summary} (Admin only).
 */
public class ComplaintSummaryResponse {

    private long totalComplaints;
    private long open;
    private long inProgress;
    private long resolved;
    private long closed;
    private long rejected;

    // ─── Getters & Setters ────────────────────────────────────────────────────

    public long getTotalComplaints() { return totalComplaints; }
    public void setTotalComplaints(long totalComplaints) { this.totalComplaints = totalComplaints; }

    public long getOpen() { return open; }
    public void setOpen(long open) { this.open = open; }

    public long getInProgress() { return inProgress; }
    public void setInProgress(long inProgress) { this.inProgress = inProgress; }

    public long getResolved() { return resolved; }
    public void setResolved(long resolved) { this.resolved = resolved; }

    public long getClosed() { return closed; }
    public void setClosed(long closed) { this.closed = closed; }

    public long getRejected() { return rejected; }
    public void setRejected(long rejected) { this.rejected = rejected; }
}
