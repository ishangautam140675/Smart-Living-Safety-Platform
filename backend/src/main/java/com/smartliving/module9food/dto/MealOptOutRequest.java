package com.smartliving.module9food.dto;

import com.smartliving.module9food.model.MealType;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class MealOptOutRequest {

    @NotNull(message = "Opt out date is required")
    private LocalDate optOutDate;

    @NotNull(message = "Meal type is required")
    private MealType mealType;

    private String reason;

    public MealOptOutRequest() {
    }

    public MealOptOutRequest(LocalDate optOutDate, MealType mealType, String reason) {
        this.optOutDate = optOutDate;
        this.mealType = mealType;
        this.reason = reason;
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
}
