package com.smartliving.module9food.model;

import com.smartliving.module3residents.model.Resident;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "meal_opt_outs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"resident_id", "opt_out_date", "meal_type"})
})
public class MealOptOut {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resident_id", nullable = false)
    private Resident resident;

    @Column(name = "opt_out_date", nullable = false)
    private LocalDate optOutDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false, length = 20)
    private MealType mealType;

    @Column(length = 255)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public MealOptOut() {
    }

    public MealOptOut(Resident resident, LocalDate optOutDate, MealType mealType, String reason) {
        this.resident = resident;
        this.optOutDate = optOutDate;
        this.mealType = mealType;
        this.reason = reason;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Resident getResident() {
        return resident;
    }

    public void setResident(Resident resident) {
        this.resident = resident;
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
