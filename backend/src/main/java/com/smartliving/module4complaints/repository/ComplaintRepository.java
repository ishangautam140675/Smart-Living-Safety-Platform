package com.smartliving.module4complaints.repository;

import com.smartliving.module4complaints.model.Complaint;
import com.smartliving.module4complaints.model.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Data access layer for {@link Complaint} entities.
 *
 * <p>All queries are JPQL so they work with both H2 (tests) and MySQL (production).</p>
 */
@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    // ─── Resident-scoped queries ──────────────────────────────────────────────

    /** All complaints submitted by a specific resident (newest first). */
    List<Complaint> findByResidentIdOrderByCreatedAtDesc(Long residentId);

    // ─── Admin / Staff queries ────────────────────────────────────────────────

    /** All complaints with a specific status (newest first). */
    List<Complaint> findByStatusOrderByCreatedAtDesc(ComplaintStatus status);

    /**
     * Full-text search across title, description, and resident name.
     * Supports optional status filter — pass {@code null} to skip that filter.
     *
     * @param keyword  search term (case-insensitive, substring match). Pass {@code ""} to match all.
     * @param status   filter by status; ignored when {@code null}.
     */
    @Query("""
            SELECT c FROM Complaint c
            JOIN c.resident r
            JOIN r.user u
            WHERE (:status IS NULL OR c.status = :status)
              AND (
                   LOWER(c.title)        LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(c.description)  LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(u.fullName)     LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            ORDER BY c.createdAt DESC
            """)
    List<Complaint> searchComplaints(
            @Param("keyword") String keyword,
            @Param("status")  ComplaintStatus status
    );

    // ─── Summary / count queries ──────────────────────────────────────────────

    long countByStatus(ComplaintStatus status);

    long countByResidentId(Long residentId);
}
