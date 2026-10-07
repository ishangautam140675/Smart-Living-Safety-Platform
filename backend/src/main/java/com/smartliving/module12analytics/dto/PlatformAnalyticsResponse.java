package com.smartliving.module12analytics.dto;

public class PlatformAnalyticsResponse {

    // Module 2: Rooms
    private long totalRooms;
    private long occupiedRooms;
    private long availableRooms;
    private double occupancyPercent;

    // Module 3: Residents
    private long totalResidents;
    private long activeResidents;

    // Module 4: Complaints
    private long totalComplaints;
    private long openComplaints;
    private long resolvedComplaints;
    private double complaintResolutionRate;

    // Module 5: Visitors
    private long visitorsToday;
    private long totalVisitors;

    // Module 6: Payments
    private double totalInvoiced;
    private double totalCollected;
    private double collectionRate;

    // Module 7: Emergency
    private long totalSosAlerts;
    private long unresolvedSos;

    // Module 8: Notices
    private long totalNotices;
    private long activeNotices;

    // Module 9: Food
    private long totalMenuItems;
    private double avgMessRating;

    // Module 10: Inventory
    private long totalAssets;
    private long damagedAssets;

    // Module 11: Roster
    private long staffShiftsToday;
    private long activeShifts;
    private long incidentsToday;

    public long getTotalRooms() { return totalRooms; }
    public void setTotalRooms(long totalRooms) { this.totalRooms = totalRooms; }

    public long getOccupiedRooms() { return occupiedRooms; }
    public void setOccupiedRooms(long occupiedRooms) { this.occupiedRooms = occupiedRooms; }

    public long getAvailableRooms() { return availableRooms; }
    public void setAvailableRooms(long availableRooms) { this.availableRooms = availableRooms; }

    public double getOccupancyPercent() { return occupancyPercent; }
    public void setOccupancyPercent(double occupancyPercent) { this.occupancyPercent = occupancyPercent; }

    public long getTotalResidents() { return totalResidents; }
    public void setTotalResidents(long totalResidents) { this.totalResidents = totalResidents; }

    public long getActiveResidents() { return activeResidents; }
    public void setActiveResidents(long activeResidents) { this.activeResidents = activeResidents; }

    public long getTotalComplaints() { return totalComplaints; }
    public void setTotalComplaints(long totalComplaints) { this.totalComplaints = totalComplaints; }

    public long getOpenComplaints() { return openComplaints; }
    public void setOpenComplaints(long openComplaints) { this.openComplaints = openComplaints; }

    public long getResolvedComplaints() { return resolvedComplaints; }
    public void setResolvedComplaints(long resolvedComplaints) { this.resolvedComplaints = resolvedComplaints; }

    public double getComplaintResolutionRate() { return complaintResolutionRate; }
    public void setComplaintResolutionRate(double complaintResolutionRate) { this.complaintResolutionRate = complaintResolutionRate; }

    public long getVisitorsToday() { return visitorsToday; }
    public void setVisitorsToday(long visitorsToday) { this.visitorsToday = visitorsToday; }

    public long getTotalVisitors() { return totalVisitors; }
    public void setTotalVisitors(long totalVisitors) { this.totalVisitors = totalVisitors; }

    public double getTotalInvoiced() { return totalInvoiced; }
    public void setTotalInvoiced(double totalInvoiced) { this.totalInvoiced = totalInvoiced; }

    public double getTotalCollected() { return totalCollected; }
    public void setTotalCollected(double totalCollected) { this.totalCollected = totalCollected; }

    public double getCollectionRate() { return collectionRate; }
    public void setCollectionRate(double collectionRate) { this.collectionRate = collectionRate; }

    public long getTotalSosAlerts() { return totalSosAlerts; }
    public void setTotalSosAlerts(long totalSosAlerts) { this.totalSosAlerts = totalSosAlerts; }

    public long getUnresolvedSos() { return unresolvedSos; }
    public void setUnresolvedSos(long unresolvedSos) { this.unresolvedSos = unresolvedSos; }

    public long getTotalNotices() { return totalNotices; }
    public void setTotalNotices(long totalNotices) { this.totalNotices = totalNotices; }

    public long getActiveNotices() { return activeNotices; }
    public void setActiveNotices(long activeNotices) { this.activeNotices = activeNotices; }

    public long getTotalMenuItems() { return totalMenuItems; }
    public void setTotalMenuItems(long totalMenuItems) { this.totalMenuItems = totalMenuItems; }

    public double getAvgMessRating() { return avgMessRating; }
    public void setAvgMessRating(double avgMessRating) { this.avgMessRating = avgMessRating; }

    public long getTotalAssets() { return totalAssets; }
    public void setTotalAssets(long totalAssets) { this.totalAssets = totalAssets; }

    public long getDamagedAssets() { return damagedAssets; }
    public void setDamagedAssets(long damagedAssets) { this.damagedAssets = damagedAssets; }

    public long getStaffShiftsToday() { return staffShiftsToday; }
    public void setStaffShiftsToday(long staffShiftsToday) { this.staffShiftsToday = staffShiftsToday; }

    public long getActiveShifts() { return activeShifts; }
    public void setActiveShifts(long activeShifts) { this.activeShifts = activeShifts; }

    public long getIncidentsToday() { return incidentsToday; }
    public void setIncidentsToday(long incidentsToday) { this.incidentsToday = incidentsToday; }
}
