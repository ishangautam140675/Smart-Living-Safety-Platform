package com.smartliving.module9food.dto;

import com.smartliving.module9food.model.MealType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class MealMenuResponse {

    private Long id;
    private LocalDate menuDate;
    private MealType mealType;
    private String title;
    private String items;
    private boolean isVeg;
    private String dietaryNotes;
    private String calories;
    private double averageRating;
    private long totalFeedbacks;
    private long optOutCount;
    private boolean userOptedOut;
    private LocalDateTime createdAt;

    public MealMenuResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getMenuDate() {
        return menuDate;
    }

    public void setMenuDate(LocalDate menuDate) {
        this.menuDate = menuDate;
    }

    public MealType getMealType() {
        return mealType;
    }

    public void setMealType(MealType mealType) {
        this.mealType = mealType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getItems() {
        return items;
    }

    public void setItems(String items) {
        this.items = items;
    }

    public boolean isVeg() {
        return isVeg;
    }

    public void setVeg(boolean veg) {
        isVeg = veg;
    }

    public String getDietaryNotes() {
        return dietaryNotes;
    }

    public void setDietaryNotes(String dietaryNotes) {
        this.dietaryNotes = dietaryNotes;
    }

    public String getCalories() {
        return calories;
    }

    public void setCalories(String calories) {
        this.calories = calories;
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

    public long getOptOutCount() {
        return optOutCount;
    }

    public void setOptOutCount(long optOutCount) {
        this.optOutCount = optOutCount;
    }

    public boolean isUserOptedOut() {
        return userOptedOut;
    }

    public void setUserOptedOut(boolean userOptedOut) {
        this.userOptedOut = userOptedOut;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
