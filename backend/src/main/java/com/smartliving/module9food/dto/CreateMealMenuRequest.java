package com.smartliving.module9food.dto;

import com.smartliving.module9food.model.MealType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class CreateMealMenuRequest {

    @NotNull(message = "Menu date is required")
    private LocalDate menuDate;

    @NotNull(message = "Meal type is required")
    private MealType mealType;

    @NotBlank(message = "Menu title is required")
    private String title;

    @NotBlank(message = "Menu items description is required")
    private String items;

    private boolean isVeg = true;

    private String dietaryNotes;

    private String calories;

    public CreateMealMenuRequest() {
    }

    public CreateMealMenuRequest(LocalDate menuDate, MealType mealType, String title, String items, boolean isVeg, String dietaryNotes, String calories) {
        this.menuDate = menuDate;
        this.mealType = mealType;
        this.title = title;
        this.items = items;
        this.isVeg = isVeg;
        this.dietaryNotes = dietaryNotes;
        this.calories = calories;
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
}
