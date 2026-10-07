package com.smartliving.module11staffroster.dto;

public class RosterSummaryResponse {
    private long totalShiftsToday;
    private long activeShifts;
    private long completedShifts;
    private long absentShifts;
    private long incidentsLogged;
    private long patrolCheckpointsToday;

    public long getTotalShiftsToday() { return totalShiftsToday; }
    public void setTotalShiftsToday(long totalShiftsToday) { this.totalShiftsToday = totalShiftsToday; }

    public long getActiveShifts() { return activeShifts; }
    public void setActiveShifts(long activeShifts) { this.activeShifts = activeShifts; }

    public long getCompletedShifts() { return completedShifts; }
    public void setCompletedShifts(long completedShifts) { this.completedShifts = completedShifts; }

    public long getAbsentShifts() { return absentShifts; }
    public void setAbsentShifts(long absentShifts) { this.absentShifts = absentShifts; }

    public long getIncidentsLogged() { return incidentsLogged; }
    public void setIncidentsLogged(long incidentsLogged) { this.incidentsLogged = incidentsLogged; }

    public long getPatrolCheckpointsToday() { return patrolCheckpointsToday; }
    public void setPatrolCheckpointsToday(long patrolCheckpointsToday) { this.patrolCheckpointsToday = patrolCheckpointsToday; }
}
