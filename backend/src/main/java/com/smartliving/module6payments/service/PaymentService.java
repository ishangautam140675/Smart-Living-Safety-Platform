package com.smartliving.module6payments.service;

import com.smartliving.common.exception.AppException;
import com.smartliving.common.exception.ResourceNotFoundException;
import com.smartliving.module3residents.model.Resident;
import com.smartliving.module3residents.repository.ResidentRepository;
import com.smartliving.module6payments.dto.*;
import com.smartliving.module6payments.model.Invoice;
import com.smartliving.module6payments.model.PaymentStatus;
import com.smartliving.module6payments.model.PaymentTransaction;
import com.smartliving.module6payments.repository.InvoiceRepository;
import com.smartliving.module6payments.repository.PaymentTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final InvoiceRepository invoiceRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final ResidentRepository residentRepository;
    private final com.smartliving.module3residents.service.ResidentService residentService;

    public PaymentService(InvoiceRepository invoiceRepository,
                          PaymentTransactionRepository transactionRepository,
                          ResidentRepository residentRepository,
                          com.smartliving.module3residents.service.ResidentService residentService) {
        this.invoiceRepository = invoiceRepository;
        this.transactionRepository = transactionRepository;
        this.residentRepository = residentRepository;
        this.residentService = residentService;
    }

    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        Resident resident = residentRepository.findById(request.getResidentId())
                .orElseThrow(() -> new ResourceNotFoundException("Resident not found with id: " + request.getResidentId()));

        String invoiceNumber = "INV-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setResident(resident);
        invoice.setTitle(request.getTitle().trim());
        invoice.setDescription(request.getDescription());
        invoice.setAmount(request.getAmount());
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setDueDate(request.getDueDate());
        invoice.setBillingMonth(request.getBillingMonth());
        invoice.setStatus(PaymentStatus.PENDING);

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Created invoice [{}] for resident '{}', amount: ₹{}",
                saved.getInvoiceNumber(), resident.getUser().getFullName(), saved.getAmount());

        return toResponse(saved);
    }

    @Transactional
    public List<InvoiceResponse> getMyInvoices(String residentEmail) {
        Resident resident = residentService.getOrCreateResidentForUser(residentEmail);
        return invoiceRepository.findByResidentIdOrderByDueDateDesc(resident.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> searchInvoices(String keyword, PaymentStatus status) {
        String kw = (keyword == null) ? "" : keyword.trim();
        return invoiceRepository.searchInvoices(kw, status)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByNumber(String invoiceNumber) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with number: " + invoiceNumber));
        return toResponse(invoice);
    }

    public InvoiceResponse recordPayment(String invoiceNumber, RecordPaymentRequest request, String recordedBy) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with number: " + invoiceNumber));

        if (invoice.getStatus() == PaymentStatus.PAID) {
            throw new AppException("Invoice " + invoiceNumber + " is already fully paid.");
        }
        if (invoice.getStatus() == PaymentStatus.CANCELLED) {
            throw new AppException("Cannot record payment for a cancelled invoice.");
        }

        BigDecimal balance = invoice.getAmount().subtract(invoice.getPaidAmount());
        if (request.getAmount().compareTo(balance) > 0) {
            throw new AppException("Payment amount (₹" + request.getAmount() +
                    ") exceeds remaining balance (₹" + balance + ").");
        }

        String txnRef = "TXN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();

        PaymentTransaction txn = new PaymentTransaction(
                txnRef,
                invoice,
                request.getAmount(),
                request.getPaymentMethod(),
                request.getNotes(),
                recordedBy
        );
        transactionRepository.save(txn);

        BigDecimal newPaidAmount = invoice.getPaidAmount().add(request.getAmount());
        invoice.setPaidAmount(newPaidAmount);

        if (newPaidAmount.compareTo(invoice.getAmount()) >= 0) {
            invoice.setStatus(PaymentStatus.PAID);
        } else {
            invoice.setStatus(PaymentStatus.PARTIALLY_PAID);
        }

        Invoice updated = invoiceRepository.save(invoice);
        log.info("Recorded payment of ₹{} for invoice [{}] via {}. New status: {}",
                request.getAmount(), updated.getInvoiceNumber(), request.getPaymentMethod(), updated.getStatus());

        return toResponse(updated);
    }

    public InvoiceResponse cancelInvoice(String invoiceNumber) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with number: " + invoiceNumber));

        if (invoice.getStatus() == PaymentStatus.PAID) {
            throw new AppException("Cannot cancel an already paid invoice.");
        }
        invoice.setStatus(PaymentStatus.CANCELLED);
        Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice [{}] cancelled.", invoiceNumber);
        return toResponse(saved);
    }

    public void deleteInvoice(String invoiceNumber) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with number: " + invoiceNumber));

        List<PaymentTransaction> transactions = transactionRepository.findByInvoiceIdOrderByTransactionTimeDesc(invoice.getId());
        if (!transactions.isEmpty()) {
            transactionRepository.deleteAll(transactions);
            log.info("Deleted {} transaction record(s) linked to invoice [{}]", transactions.size(), invoiceNumber);
        }

        invoiceRepository.delete(invoice);
        log.info("Invoice [{}] permanently deleted.", invoiceNumber);
    }

    public long clearPaidInvoices() {
        List<Invoice> paid = invoiceRepository.findByStatusOrderByDueDateAsc(PaymentStatus.PAID);
        List<Invoice> cancelled = invoiceRepository.findByStatusOrderByDueDateAsc(PaymentStatus.CANCELLED);
        List<Invoice> toDelete = new java.util.ArrayList<>();
        toDelete.addAll(paid);
        toDelete.addAll(cancelled);

        long count = toDelete.size();
        for (Invoice inv : toDelete) {
            List<PaymentTransaction> txs = transactionRepository.findByInvoiceIdOrderByTransactionTimeDesc(inv.getId());
            if (!txs.isEmpty()) {
                transactionRepository.deleteAll(txs);
            }
        }

        invoiceRepository.deleteAll(toDelete);
        log.info("Cleared {} paid/cancelled invoices and their transaction records from the ledger.", count);
        return count;
    }

    @Transactional(readOnly = true)
    public PaymentSummaryResponse getSummary() {
        long total = invoiceRepository.count();
        long paid = invoiceRepository.countByStatus(PaymentStatus.PAID);
        long pending = invoiceRepository.countByStatus(PaymentStatus.PENDING);
        long overdue = invoiceRepository.countByStatus(PaymentStatus.OVERDUE);
        BigDecimal collected = invoiceRepository.sumTotalCollected();
        BigDecimal outstanding = invoiceRepository.sumTotalPending();

        return new PaymentSummaryResponse(
                total, paid, pending, overdue,
                collected != null ? collected : BigDecimal.ZERO,
                outstanding != null ? outstanding : BigDecimal.ZERO);
    }

    private InvoiceResponse toResponse(Invoice invoice) {
        InvoiceResponse resp = new InvoiceResponse();
        resp.setId(invoice.getId());
        resp.setInvoiceNumber(invoice.getInvoiceNumber());
        resp.setTitle(invoice.getTitle());
        resp.setDescription(invoice.getDescription());
        resp.setAmount(invoice.getAmount());
        resp.setPaidAmount(invoice.getPaidAmount());
        resp.setBalanceAmount(invoice.getAmount().subtract(invoice.getPaidAmount()));
        resp.setDueDate(invoice.getDueDate());
        resp.setStatus(invoice.getStatus());
        resp.setBillingMonth(invoice.getBillingMonth());
        resp.setCreatedAt(invoice.getCreatedAt());
        resp.setUpdatedAt(invoice.getUpdatedAt());

        if (invoice.getResident() != null) {
            Resident resident = invoice.getResident();
            resp.setResidentId(resident.getId());
            if (resident.getUser() != null) {
                resp.setResidentName(resident.getUser().getFullName());
                resp.setResidentEmail(resident.getUser().getEmail());
            }
            if (resident.getBed() != null && resident.getBed().getRoom() != null) {
                resp.setRoomNumber(resident.getBed().getRoom().getRoomNumber());
                if (resident.getBed().getRoom().getFloor() != null &&
                        resident.getBed().getRoom().getFloor().getBuilding() != null) {
                    resp.setBuildingName(resident.getBed().getRoom().getFloor().getBuilding().getName());
                }
            }
        }

        List<PaymentTransaction> txns = transactionRepository.findByInvoiceIdOrderByTransactionTimeDesc(invoice.getId());
        resp.setTransactions(txns.stream().map(this::toTxnResponse).collect(Collectors.toList()));

        return resp;
    }

    private PaymentTransactionResponse toTxnResponse(PaymentTransaction txn) {
        PaymentTransactionResponse resp = new PaymentTransactionResponse();
        resp.setId(txn.getId());
        resp.setTransactionReference(txn.getTransactionReference());
        resp.setInvoiceId(txn.getInvoice().getId());
        resp.setInvoiceNumber(txn.getInvoice().getInvoiceNumber());
        resp.setAmountPaid(txn.getAmountPaid());
        resp.setPaymentMethod(txn.getPaymentMethod());
        resp.setNotes(txn.getNotes());
        resp.setRecordedBy(txn.getRecordedBy());
        resp.setTransactionTime(txn.getTransactionTime());
        return resp;
    }
}
