package com.smartliving.module5visitors.repository;

import com.smartliving.module5visitors.model.VisitorPass;
import com.smartliving.module5visitors.model.VisitorPassStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VisitorPassRepository extends JpaRepository<VisitorPass, Long> {

    Optional<VisitorPass> findByPassCode(String passCode);

    List<VisitorPass> findByResidentIdOrderByCreatedAtDesc(Long residentId);

    List<VisitorPass> findByStatusOrderByCreatedAtDesc(VisitorPassStatus status);

    @Query("""
            SELECT v FROM VisitorPass v
            JOIN v.resident r
            JOIN r.user u
            WHERE (:status IS NULL OR v.status = :status)
              AND (
                   LOWER(v.passCode)     LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(v.visitorName)  LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(v.visitorPhone) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(u.fullName)     LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            ORDER BY v.createdAt DESC
            """)
    List<VisitorPass> searchVisitorPasses(@Param("keyword") String keyword,
                                          @Param("status") VisitorPassStatus status);

    long countByStatus(VisitorPassStatus status);

    long countByResidentId(Long residentId);

    @Query("SELECT COUNT(v) FROM VisitorPass v WHERE v.expectedDate = :date")
    long countExpectedOnDate(@Param("date") LocalDate date);
}
