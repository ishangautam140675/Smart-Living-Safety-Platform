package com.smartliving.module9food.service;

import com.smartliving.common.exception.AppException;
import com.smartliving.common.exception.ResourceNotFoundException;
import com.smartliving.module3residents.model.Resident;
import com.smartliving.module3residents.repository.ResidentRepository;
import com.smartliving.module9food.dto.*;
import com.smartliving.module9food.model.MealFeedback;
import com.smartliving.module9food.model.MealMenu;
import com.smartliving.module9food.model.MealOptOut;
import com.smartliving.module9food.model.MealType;
import com.smartliving.module9food.repository.MealFeedbackRepository;
import com.smartliving.module9food.repository.MealMenuRepository;
import com.smartliving.module9food.repository.MealOptOutRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class FoodService {

    private static final Logger log = LoggerFactory.getLogger(FoodService.class);

    private final MealMenuRepository menuRepository;
    private final MealOptOutRepository optOutRepository;
    private final MealFeedbackRepository feedbackRepository;
    private final ResidentRepository residentRepository;

    public FoodService(MealMenuRepository menuRepository,
                       MealOptOutRepository optOutRepository,
                       MealFeedbackRepository feedbackRepository,
                       ResidentRepository residentRepository) {
        this.menuRepository = menuRepository;
        this.optOutRepository = optOutRepository;
        this.feedbackRepository = feedbackRepository;
        this.residentRepository = residentRepository;
    }

    public MealMenuResponse createOrUpdateMenu(CreateMealMenuRequest request) {
        Optional<MealMenu> existing = menuRepository.findByMenuDateAndMealType(request.getMenuDate(), request.getMealType());

        MealMenu menu;
        if (existing.isPresent()) {
            menu = existing.get();
            menu.setTitle(request.getTitle().trim());
            menu.setItems(request.getItems().trim());
            menu.setVeg(request.isVeg());
            menu.setDietaryNotes(request.getDietaryNotes());
            menu.setCalories(request.getCalories());
            log.info("Updated existing menu for {} [{}]", menu.getMenuDate(), menu.getMealType());
        } else {
            menu = new MealMenu(
                    request.getMenuDate(),
                    request.getMealType(),
                    request.getTitle().trim(),
                    request.getItems().trim(),
                    request.isVeg(),
                    request.getDietaryNotes(),
                    request.getCalories()
            );
            log.info("Created new menu for {} [{}]", menu.getMenuDate(), menu.getMealType());
        }

        MealMenu saved = menuRepository.save(menu);
        return toMenuResponse(saved, null);
    }

    @Transactional(readOnly = true)
    public List<MealMenuResponse> getDailyMenu(LocalDate date, String userEmail) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        Resident currentResident = resolveResident(userEmail);

        return menuRepository.findByMenuDateOrderByMealTypeAsc(queryDate)
                .stream()
                .map(m -> toMenuResponse(m, currentResident))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MealMenuResponse> getWeeklyMenu(LocalDate startDate, String userEmail) {
        LocalDate start = (startDate != null) ? startDate : LocalDate.now();
        LocalDate end = start.plusDays(6);
        Resident currentResident = resolveResident(userEmail);

        return menuRepository.findByMenuDateBetweenOrderByMenuDateAscMealTypeAsc(start, end)
                .stream()
                .map(m -> toMenuResponse(m, currentResident))
                .collect(Collectors.toList());
    }

    public MealFeedbackResponse recordFeedback(MealFeedbackRequest request, String residentEmail) {
        Resident resident = residentRepository.findByUserEmail(residentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Resident profile not found for email: " + residentEmail));

        MealMenu menu = menuRepository.findById(request.getMenuId())
                .orElseThrow(() -> new ResourceNotFoundException("Meal menu not found with id: " + request.getMenuId()));

        MealFeedback feedback = new MealFeedback(menu, resident, request.getRating(), request.getComment());
        MealFeedback saved = feedbackRepository.save(feedback);
        log.info("Resident '{}' rated meal #{} ({}) with {} stars",
                resident.getUser().getFullName(), menu.getId(), menu.getMealType(), request.getRating());

        return new MealFeedbackResponse(
                saved.getId(),
                menu.getId(),
                resident.getUser().getFullName(),
                saved.getRating(),
                saved.getComment(),
                saved.getCreatedAt()
        );
    }

    public MealOptOutResponse optOutMeal(MealOptOutRequest request, String residentEmail) {
        Resident resident = residentRepository.findByUserEmail(residentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Resident profile not found for email: " + residentEmail));

        Optional<MealOptOut> existing = optOutRepository.findByResidentIdAndOptOutDateAndMealType(
                resident.getId(), request.getOptOutDate(), request.getMealType());

        if (existing.isPresent()) {
            throw new AppException("You have already opted out of " + request.getMealType() + " on " + request.getOptOutDate());
        }

        MealOptOut optOut = new MealOptOut(resident, request.getOptOutDate(), request.getMealType(), request.getReason());
        MealOptOut saved = optOutRepository.save(optOut);
        log.info("Resident '{}' opted out of {} on {}",
                resident.getUser().getFullName(), request.getMealType(), request.getOptOutDate());

        return new MealOptOutResponse(
                saved.getId(),
                resident.getId(),
                resident.getUser().getFullName(),
                saved.getOptOutDate(),
                saved.getMealType(),
                saved.getReason(),
                saved.getCreatedAt()
        );
    }

    public void cancelOptOut(LocalDate date, MealType mealType, String residentEmail) {
        Resident resident = residentRepository.findByUserEmail(residentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Resident profile not found for email: " + residentEmail));

        MealOptOut existing = optOutRepository.findByResidentIdAndOptOutDateAndMealType(
                resident.getId(), date, mealType)
                .orElseThrow(() -> new ResourceNotFoundException("No opt-out found for " + mealType + " on " + date));

        optOutRepository.delete(existing);
        log.info("Resident '{}' cancelled opt-out for {} on {}",
                resident.getUser().getFullName(), mealType, date);
    }

    @Transactional(readOnly = true)
    public List<MealOptOutResponse> getMyOptOuts(String residentEmail) {
        Resident resident = residentRepository.findByUserEmail(residentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Resident profile not found for email: " + residentEmail));

        return optOutRepository.findByResidentIdOrderByOptOutDateDesc(resident.getId())
                .stream()
                .map(o -> new MealOptOutResponse(
                        o.getId(),
                        resident.getId(),
                        resident.getUser().getFullName(),
                        o.getOptOutDate(),
                        o.getMealType(),
                        o.getReason(),
                        o.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MessSummaryResponse getMessSummary(LocalDate date) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        long totalMenus = menuRepository.countByMenuDate(queryDate);
        long totalOptOuts = optOutRepository.countByOptOutDate(queryDate);
        Double avgRating = feedbackRepository.calculateOverallAverageRating();
        long totalFeedbacks = feedbackRepository.count();

        return new MessSummaryResponse(
                queryDate,
                totalMenus,
                totalOptOuts,
                avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0,
                totalFeedbacks
        );
    }

    public void deleteMenu(Long menuId) {
        MealMenu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new ResourceNotFoundException("Meal menu not found with id: " + menuId));
        // Delete related opt-outs and feedbacks first
        optOutRepository.deleteAll(
            optOutRepository.findByOptOutDateAndMealType(menu.getMenuDate(), menu.getMealType())
                .stream().collect(java.util.stream.Collectors.toList())
        );
        feedbackRepository.deleteAll(feedbackRepository.findByMealMenuId(menuId));
        menuRepository.delete(menu);
        log.info("Deleted meal menu #{} [{} on {}]", menuId, menu.getMealType(), menu.getMenuDate());
    }

    public long clearOldMenus(LocalDate olderThan) {
        LocalDate cutoff = (olderThan != null) ? olderThan : LocalDate.now().minusDays(7);
        List<MealMenu> old = menuRepository.findByMenuDateBetweenOrderByMenuDateAscMealTypeAsc(LocalDate.of(2000, 1, 1), cutoff);
        long count = old.size();
        old.forEach(m -> {
            optOutRepository.deleteAll(
                optOutRepository.findByOptOutDateAndMealType(m.getMenuDate(), m.getMealType())
                    .stream().collect(java.util.stream.Collectors.toList())
            );
            feedbackRepository.deleteAll(feedbackRepository.findByMealMenuId(m.getId()));
        });
        menuRepository.deleteAll(old);
        log.info("Cleared {} old meal menu entries older than {}", count, cutoff);
        return count;
    }

    private Resident resolveResident(String email) {
        if (email == null) return null;
        return residentRepository.findByUserEmail(email).orElse(null);
    }

    private MealMenuResponse toMenuResponse(MealMenu menu, Resident resident) {
        MealMenuResponse resp = new MealMenuResponse();
        resp.setId(menu.getId());
        resp.setMenuDate(menu.getMenuDate());
        resp.setMealType(menu.getMealType());
        resp.setTitle(menu.getTitle());
        resp.setItems(menu.getItems());
        resp.setVeg(menu.isVeg());
        resp.setDietaryNotes(menu.getDietaryNotes());
        resp.setCalories(menu.getCalories());
        resp.setCreatedAt(menu.getCreatedAt());

        long count = optOutRepository.countByOptOutDateAndMealType(menu.getMenuDate(), menu.getMealType());
        resp.setOptOutCount(count);

        Double avg = feedbackRepository.calculateAverageRatingForMenu(menu.getId());
        resp.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        resp.setTotalFeedbacks(feedbackRepository.countByMealMenuId(menu.getId()));

        if (resident != null) {
            boolean optedOut = optOutRepository.findByResidentIdAndOptOutDateAndMealType(
                    resident.getId(), menu.getMenuDate(), menu.getMealType()).isPresent();
            resp.setUserOptedOut(optedOut);
        } else {
            resp.setUserOptedOut(false);
        }

        return resp;
    }
}
