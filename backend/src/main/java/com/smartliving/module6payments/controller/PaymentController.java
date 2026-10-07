package com.smartliving.module6payments.controller;

import com.smartliving.module6payments.dto.*;
import com.smartliving.module6payments.model.PaymentStatus;
import com.smartliving.module6payments.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/invoices")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        InvoiceResponse response = paymentService.createInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-invoices")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<List<InvoiceResponse>> getMyInvoices(Authentication authentication) {
        List<InvoiceResponse> invoices = paymentService.getMyInvoices(authentication.getName());
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<InvoiceResponse>> searchInvoices(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) PaymentStatus status) {
        List<InvoiceResponse> invoices = paymentService.searchInvoices(keyword, status);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/invoices/{invoiceNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'RESIDENT')")
    public ResponseEntity<InvoiceResponse> getInvoiceByNumber(@PathVariable String invoiceNumber) {
        InvoiceResponse invoice = paymentService.getInvoiceByNumber(invoiceNumber);
        return ResponseEntity.ok(invoice);
    }

    @PostMapping("/invoices/{invoiceNumber}/pay")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESIDENT', 'STAFF')")
    public ResponseEntity<InvoiceResponse> recordPayment(
            @PathVariable String invoiceNumber,
            @Valid @RequestBody RecordPaymentRequest request,
            Authentication authentication) {
        InvoiceResponse response = paymentService.recordPayment(invoiceNumber, request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentSummaryResponse> getSummary() {
        PaymentSummaryResponse summary = paymentService.getSummary();
        return ResponseEntity.ok(summary);
    }

    @PutMapping("/invoices/{invoiceNumber}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InvoiceResponse> cancelInvoice(@PathVariable String invoiceNumber) {
        InvoiceResponse response = paymentService.cancelInvoice(invoiceNumber);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/invoices/{invoiceNumber}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteInvoice(@PathVariable String invoiceNumber) {
        paymentService.deleteInvoice(invoiceNumber);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/invoices/clear-paid")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> clearPaidInvoices() {
        long count = paymentService.clearPaidInvoices();
        return ResponseEntity.ok(java.util.Map.of("message", "Cleared paid/cancelled invoices", "count", count));
    }
}
