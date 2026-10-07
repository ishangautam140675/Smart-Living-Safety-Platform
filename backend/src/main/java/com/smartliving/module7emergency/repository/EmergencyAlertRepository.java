package com.smartliving.module7emergency.repository;

import com.smartliving.module7emergency.model.EmergencyAlert;
import com.smartliving.module7emergency.model.EmergencySeverity;
import com.smartliving.module7emergency.model.EmergencyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyAlertRepository extends JpaRepository<EmergencyAlert, Long> {

    Optional<EmergencyAlert> findByAlertCode(String alertCode);

    List<EmergencyAlert> findByStatusOrderByCreatedAtDesc(EmergencyStatus status);

    List<EmergencyAlert> findByResidentIdOrderByCreatedAtDesc(Long residentId);

    @Query("""
            SELECT e FROM EmergencyAlert e
            LEFT JOIN e.resident r
            LEFT JOIN r.user u
            WHERE (:status IS NULL OR e.status = :status)
              AND (:severity IS NULL OR e.severity = :severity)
              AND (
                   LOWER(e.alertCode)        LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(e.locationDetails)  LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(e.description)      LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR (u.fullName IS NOT NULL AND LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))
              )
            ORDER BY e.createdAt DESC
            """)
    List<EmergencyAlert> searchAlerts(@Param("keyword") String keyword,
                                      @Param("status") EmergencyStatus status,
                                      @Param("severity") EmergencySeverity severity);

    long countByStatus(EmergencyStatus status);

    long countBySeverity(EmergencySeverity severity);
}
