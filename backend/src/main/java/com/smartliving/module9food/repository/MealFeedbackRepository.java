package com.smartliving.module9food.repository;

import com.smartliving.module9food.model.MealFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MealFeedbackRepository extends JpaRepository<MealFeedback, Long> {

    List<MealFeedback> findByMealMenuIdOrderByCreatedAtDesc(Long mealMenuId);

    List<MealFeedback> findByMealMenuId(Long mealMenuId);

    long countByMealMenuId(Long mealMenuId);

    @Query("SELECT AVG(f.rating) FROM MealFeedback f WHERE f.mealMenu.id = :menuId")
    Double calculateAverageRatingForMenu(@Param("menuId") Long menuId);

    @Query("SELECT AVG(f.rating) FROM MealFeedback f")
    Double calculateOverallAverageRating();
}
