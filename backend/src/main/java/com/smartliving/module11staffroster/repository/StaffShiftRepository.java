package com.smartliving.module11staffroster.repository;

import com.smartliving.module11staffroster.model.ShiftStatus;
import com.smartliving.module11staffroster.model.StaffShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StaffShiftRepository extends JpaRepository<StaffShift, Long> {

    List<StaffShift> findByShiftDateOrderByShiftTypeAsc(LocalDate date);

    List<StaffShift> findByShiftDateBetweenOrderByShiftDateAscShiftTypeAsc(LocalDate from, LocalDate to);

    @Query("SELECT COUNT(s) FROM StaffShift s WHERE s.shiftDate = :date")
    long countByShiftDate(@Param("date") LocalDate date);

    @Query("SELECT COUNT(s) FROM StaffShift s WHERE s.shiftDate = :date AND s.status = :status")
    long countByShiftDateAndStatus(@Param("date") LocalDate date, @Param("status") ShiftStatus status);
}
