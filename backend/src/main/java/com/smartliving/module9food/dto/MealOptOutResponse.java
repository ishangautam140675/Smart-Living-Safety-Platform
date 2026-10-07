package com.smartliving.module9food.dto;

import com.smartliving.module9food.model.MealType;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class MealOptOutResponse {

    private Long id;
    private Long residentId;
    private String residentName;
    private LocalDate optOutDate;
    private MealType mealType;
    private String reason;
    private LocalDateTime createdAt;

    public MealOptOutResponse() {
    }

    public MealOptOutResponse(Long id, Long residentId, String residentName, LocalDate optOutDate, MealType mealType, String reason, LocalDateTime createdAt) {
        this.id = id;
        this.residentId = residentId;
        this.residentName = residentName;
        this.optOutDate = optOutDate;
        this.mealType = mealType;
        this.reason = reason;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getResidentId() {
        return residentId;
    }

    public void setResidentId(Long residentId) {
        this.residentId = residentId;
    }

    public String getResidentName() {
        return residentName;
    }

    public void setResidentName(String residentName) {
        this.residentName = residentName;
    }

    public LocalDate getOptOutDate() {
        return optOutDate;
    }

    public void setOptOutDate(LocalDate optOutDate) {
        this.optOutDate = optOutDate;
    }

    public MealType getMealType() {
        return mealType;
    }

    public void setMealType(MealType mealType) {
        this.mealType = mealType;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
