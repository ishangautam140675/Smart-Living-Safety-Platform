package com.smartliving.module9food.model;

import com.smartliving.module3residents.model.Resident;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "meal_feedbacks")
public class MealFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_menu_id", nullable = false)
    private MealMenu mealMenu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resident_id", nullable = false)
    private Resident resident;

    @Column(nullable = false)
    private int rating; // 1 to 5 stars

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public MealFeedback() {
    }

    public MealFeedback(MealMenu mealMenu, Resident resident, int rating, String comment) {
        this.mealMenu = mealMenu;
        this.resident = resident;
        this.rating = rating;
        this.comment = comment;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MealMenu getMealMenu() {
        return mealMenu;
    }

    public void setMealMenu(MealMenu mealMenu) {
        this.mealMenu = mealMenu;
    }

    public Resident getResident() {
        return resident;
    }

    public void setResident(Resident resident) {
        this.resident = resident;
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
