package com.smartliving.module9food.repository;

import com.smartliving.module9food.model.MealMenu;
import com.smartliving.module9food.model.MealType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MealMenuRepository extends JpaRepository<MealMenu, Long> {

    Optional<MealMenu> findByMenuDateAndMealType(LocalDate menuDate, MealType mealType);

    List<MealMenu> findByMenuDateOrderByMealTypeAsc(LocalDate menuDate);

    List<MealMenu> findByMenuDateBetweenOrderByMenuDateAscMealTypeAsc(LocalDate startDate, LocalDate endDate);

    long countByMenuDate(LocalDate menuDate);
}
