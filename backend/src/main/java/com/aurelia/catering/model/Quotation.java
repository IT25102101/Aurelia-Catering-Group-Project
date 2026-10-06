package com.aurelia.catering.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Model representing a quotation from table Quotation in AureliaCatering2.
 * Columns: QuotationID, OrderID, QuotationDate, TotalAmount, Status
 */
public class Quotation {

    private Integer quotationId;
    private Integer orderId;
    private LocalDateTime quotationDate;
    private BigDecimal totalAmount;
    private String status;

    public Quotation() {
    }

    public Quotation(Integer quotationId, Integer orderId, LocalDateTime quotationDate, BigDecimal totalAmount, String status) {
        this.quotationId = quotationId;
        this.orderId = orderId;
        this.quotationDate = quotationDate;
        this.totalAmount = totalAmount;
        this.status = status;
    }

    public Integer getQuotationId() {
        return quotationId;
    }

    public void setQuotationId(Integer quotationId) {
        this.quotationId = quotationId;
    }

    public Integer getId() {
        return quotationId;
    }

    public void setId(Integer id) {
        this.quotationId = id;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public LocalDateTime getQuotationDate() {
        return quotationDate;
    }

    public void setQuotationDate(LocalDateTime quotationDate) {
        this.quotationDate = quotationDate;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
