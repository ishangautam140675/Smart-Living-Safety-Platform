package com.smartliving.module3residents.repository;

import com.smartliving.module3residents.model.Resident;
import com.smartliving.module3residents.model.ResidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResidentRepository extends JpaRepository<Resident, Long> {

    Optional<Resident> findByUserId(Long userId);

    Optional<Resident> findByUserEmail(String email);

    Optional<Resident> findByAdmissionNumber(String admissionNumber);

    boolean existsByAdmissionNumber(String admissionNumber);

    boolean existsByUserId(Long userId);

    List<Resident> findByStatus(ResidentStatus status);

    Optional<Resident> findByBedId(Long bedId);

    List<Resident> findByBedRoomId(Long roomId);

    long countByStatus(ResidentStatus status);

    @Query("SELECT r FROM Resident r " +
           "JOIN FETCH r.user u " +
           "LEFT JOIN FETCH r.bed b " +
           "WHERE (:status IS NULL OR r.status = :status) AND " +
           "(:keyword IS NULL OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.admissionNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.phone) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Resident> searchResidents(@Param("keyword") String keyword,
                                   @Param("status") ResidentStatus status);
}
