package com.smartliving.module6payments.repository;

import com.smartliving.module6payments.model.Invoice;
import com.smartliving.module6payments.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByResidentIdOrderByDueDateDesc(Long residentId);

    List<Invoice> findByStatusOrderByDueDateAsc(PaymentStatus status);

    @Query("""
            SELECT i FROM Invoice i
            JOIN i.resident r
            JOIN r.user u
            WHERE (:status IS NULL OR i.status = :status)
              AND (
                   LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(i.title)         LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(u.fullName)      LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(u.email)         LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            ORDER BY i.dueDate DESC
            """)
    List<Invoice> searchInvoices(@Param("keyword") String keyword,
                                 @Param("status") PaymentStatus status);

    long countByStatus(PaymentStatus status);

    @Query("SELECT SUM(i.paidAmount) FROM Invoice i")
    BigDecimal sumTotalCollected();

    @Query("SELECT SUM(i.amount - i.paidAmount) FROM Invoice i WHERE i.status IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE')")
    BigDecimal sumTotalPending();
}
