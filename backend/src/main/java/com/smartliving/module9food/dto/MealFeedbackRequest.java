package com.smartliving.module9food.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class MealFeedbackRequest {

    @NotNull(message = "Meal menu ID is required")
    private Long menuId;

    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private int rating;

    private String comment;

    public MealFeedbackRequest() {
    }

    public MealFeedbackRequest(Long menuId, int rating, String comment) {
        this.menuId = menuId;
        this.rating = rating;
        this.comment = comment;
    }

    public Long getMenuId() {
        return menuId;
    }

    public void setMenuId(Long menuId) {
        this.menuId = menuId;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
