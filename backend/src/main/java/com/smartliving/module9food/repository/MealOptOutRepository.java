package com.smartliving.module9food.repository;

import com.smartliving.module9food.model.MealOptOut;
import com.smartliving.module9food.model.MealType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MealOptOutRepository extends JpaRepository<MealOptOut, Long> {

    Optional<MealOptOut> findByResidentIdAndOptOutDateAndMealType(Long residentId, LocalDate optOutDate, MealType mealType);

    List<MealOptOut> findByResidentIdAndOptOutDateBetweenOrderByOptOutDateDesc(Long residentId, LocalDate startDate, LocalDate endDate);

    List<MealOptOut> findByResidentIdOrderByOptOutDateDesc(Long residentId);

    long countByOptOutDateAndMealType(LocalDate optOutDate, MealType mealType);

    long countByOptOutDate(LocalDate optOutDate);

    List<MealOptOut> findByOptOutDateAndMealType(LocalDate optOutDate, MealType mealType);
}
