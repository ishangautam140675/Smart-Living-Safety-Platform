package com.smartliving.module11staffroster.repository;

import com.smartliving.module11staffroster.model.PatrolLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PatrolLogRepository extends JpaRepository<PatrolLog, Long> {

    List<PatrolLog> findByShiftIdOrderByVerifiedAtDesc(Long shiftId);

    @Query("SELECT COUNT(p) FROM PatrolLog p WHERE p.verifiedAt >= :from AND p.verifiedAt <= :to")
    long countByVerifiedAtBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(p) FROM PatrolLog p WHERE p.incidentFlag = true AND p.verifiedAt >= :from AND p.verifiedAt <= :to")
    long countIncidentsByVerifiedAtBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
