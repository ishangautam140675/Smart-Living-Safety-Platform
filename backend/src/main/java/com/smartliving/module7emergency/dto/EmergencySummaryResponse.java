package com.smartliving.module7emergency.dto;

public class EmergencySummaryResponse {

    private long totalAlerts;
    private long activeAlerts;
    private long criticalAlerts;
    private long acknowledgedAlerts;
    private long resolvedAlerts;

    public EmergencySummaryResponse() {}

    public EmergencySummaryResponse(long totalAlerts, long activeAlerts, long criticalAlerts,
                                    long acknowledgedAlerts, long resolvedAlerts) {
        this.totalAlerts = totalAlerts;
        this.activeAlerts = activeAlerts;
        this.criticalAlerts = criticalAlerts;
        this.acknowledgedAlerts = acknowledgedAlerts;
        this.resolvedAlerts = resolvedAlerts;
    }

    public long getTotalAlerts() { return totalAlerts; }
    public void setTotalAlerts(long totalAlerts) { this.totalAlerts = totalAlerts; }

    public long getActiveAlerts() { return activeAlerts; }
    public void setActiveAlerts(long activeAlerts) { this.activeAlerts = activeAlerts; }

    public long getCriticalAlerts() { return criticalAlerts; }
    public void setCriticalAlerts(long criticalAlerts) { this.criticalAlerts = criticalAlerts; }

    public long getAcknowledgedAlerts() { return acknowledgedAlerts; }
    public void setAcknowledgedAlerts(long acknowledgedAlerts) { this.acknowledgedAlerts = acknowledgedAlerts; }

    public long getResolvedAlerts() { return resolvedAlerts; }
    public void setResolvedAlerts(long resolvedAlerts) { this.resolvedAlerts = resolvedAlerts; }
}
