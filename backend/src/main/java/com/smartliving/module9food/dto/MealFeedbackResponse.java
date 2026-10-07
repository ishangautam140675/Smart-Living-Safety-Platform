package com.smartliving.module9food.dto;

import java.time.LocalDateTime;

public class MealFeedbackResponse {

    private Long id;
    private Long menuId;
    private String residentName;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;

    public MealFeedbackResponse() {
    }

    public MealFeedbackResponse(Long id, Long menuId, String residentName, int rating, String comment, LocalDateTime createdAt) {
        this.id = id;
        this.menuId = menuId;
        this.residentName = residentName;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMenuId() {
        return menuId;
    }

    public void setMenuId(Long menuId) {
        this.menuId = menuId;
    }

    public String getResidentName() {
        return residentName;
    }

    public void setResidentName(String residentName) {
        this.residentName = residentName;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
