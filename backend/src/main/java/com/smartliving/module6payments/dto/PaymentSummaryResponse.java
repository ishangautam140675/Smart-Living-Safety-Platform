package com.smartliving.module6payments.dto;

import java.math.BigDecimal;

public class PaymentSummaryResponse {

    private long totalInvoices;
    private long paidInvoices;
    private long pendingInvoices;
    private long overdueInvoices;
    private BigDecimal totalCollected;
    private BigDecimal totalOutstanding;

    public PaymentSummaryResponse() {}

    public PaymentSummaryResponse(long totalInvoices, long paidInvoices, long pendingInvoices,
                                  long overdueInvoices, BigDecimal totalCollected, BigDecimal totalOutstanding) {
        this.totalInvoices = totalInvoices;
        this.paidInvoices = paidInvoices;
        this.pendingInvoices = pendingInvoices;
        this.overdueInvoices = overdueInvoices;
        this.totalCollected = totalCollected;
        this.totalOutstanding = totalOutstanding;
    }

    public long getTotalInvoices() { return totalInvoices; }
    public void setTotalInvoices(long totalInvoices) { this.totalInvoices = totalInvoices; }

    public long getPaidInvoices() { return paidInvoices; }
    public void setPaidInvoices(long paidInvoices) { this.paidInvoices = paidInvoices; }

    public long getPendingInvoices() { return pendingInvoices; }
    public void setPendingInvoices(long pendingInvoices) { this.pendingInvoices = pendingInvoices; }

    public long getOverdueInvoices() { return overdueInvoices; }
    public void setOverdueInvoices(long overdueInvoices) { this.overdueInvoices = overdueInvoices; }

    public BigDecimal getTotalCollected() { return totalCollected; }
    public void setTotalCollected(BigDecimal totalCollected) { this.totalCollected = totalCollected; }

    public BigDecimal getTotalOutstanding() { return totalOutstanding; }
    public void setTotalOutstanding(BigDecimal totalOutstanding) { this.totalOutstanding = totalOutstanding; }
}
