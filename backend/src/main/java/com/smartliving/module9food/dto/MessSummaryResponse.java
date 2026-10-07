package com.smartliving.module9food.dto;

import java.time.LocalDate;

public class MessSummaryResponse {

    private LocalDate date;
    private long totalMenusToday;
    private long totalOptOutsToday;
    private double averageRating;
    private long totalFeedbacks;

    public MessSummaryResponse() {
    }

    public MessSummaryResponse(LocalDate date, long totalMenusToday, long totalOptOutsToday, double averageRating, long totalFeedbacks) {
        this.date = date;
        this.totalMenusToday = totalMenusToday;
        this.totalOptOutsToday = totalOptOutsToday;
        this.averageRating = averageRating;
        this.totalFeedbacks = totalFeedbacks;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public long getTotalMenusToday() {
        return totalMenusToday;
    }

    public void setTotalMenusToday(long totalMenusToday) {
        this.totalMenusToday = totalMenusToday;
    }

    public long getTotalOptOutsToday() {
        return totalOptOutsToday;
    }

    public void setTotalOptOutsToday(long totalOptOutsToday) {
        this.totalOptOutsToday = totalOptOutsToday;
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public long getTotalFeedbacks() {
        return totalFeedbacks;
    }

    public void setTotalFeedbacks(long totalFeedbacks) {
        this.totalFeedbacks = totalFeedbacks;
    }
}
