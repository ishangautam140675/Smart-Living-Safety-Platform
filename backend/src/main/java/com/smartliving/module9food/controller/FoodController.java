package com.smartliving.module9food.controller;

import com.smartliving.module9food.dto.*;
import com.smartliving.module9food.model.MealType;
import com.smartliving.module9food.service.FoodService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/food")
public class FoodController {

    private final FoodService foodService;

    public FoodController(FoodService foodService) {
        this.foodService = foodService;
    }

    @PostMapping("/menu")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<MealMenuResponse> createOrUpdateMenu(@Valid @RequestBody CreateMealMenuRequest request) {
        MealMenuResponse response = foodService.createOrUpdateMenu(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/menu/daily")
    public ResponseEntity<List<MealMenuResponse>> getDailyMenu(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        List<MealMenuResponse> menu = foodService.getDailyMenu(date, email);
        return ResponseEntity.ok(menu);
    }

    @GetMapping("/menu/today")
    public ResponseEntity<List<MealMenuResponse>> getTodayMenu(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        List<MealMenuResponse> menu = foodService.getDailyMenu(LocalDate.now(), email);
        return ResponseEntity.ok(menu);
    }

    @GetMapping("/menu/weekly")
    public ResponseEntity<List<MealMenuResponse>> getWeeklyMenu(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        List<MealMenuResponse> menu = foodService.getWeeklyMenu(startDate, email);
        return ResponseEntity.ok(menu);
    }

    @PostMapping("/feedback")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<MealFeedbackResponse> recordFeedback(
            @Valid @RequestBody MealFeedbackRequest request,
            Authentication authentication) {
        MealFeedbackResponse response = foodService.recordFeedback(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/opt-out")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<MealOptOutResponse> optOutMeal(
            @Valid @RequestBody MealOptOutRequest request,
            Authentication authentication) {
        MealOptOutResponse response = foodService.optOutMeal(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/opt-out")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<Void> cancelOptOut(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam MealType mealType,
            Authentication authentication) {
        foodService.cancelOptOut(date, mealType, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/opt-out/my")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<List<MealOptOutResponse>> getMyOptOuts(Authentication authentication) {
        List<MealOptOutResponse> optOuts = foodService.getMyOptOuts(authentication.getName());
        return ResponseEntity.ok(optOuts);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<MessSummaryResponse> getMessSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        MessSummaryResponse summary = foodService.getMessSummary(date);
        return ResponseEntity.ok(summary);
    }
}
