package com.aurelia.catering.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Model representing a payment from table Payment in AureliaCatering2.
 * Columns: PaymentID, OrderID, PaymentDate, Amount, PaymentType, PaymentStatus
 */
public class Payment {

    private Integer paymentId;
    private Integer orderId;
    private LocalDateTime paymentDate;
    private BigDecimal amount;
    private String paymentType;
    private String paymentStatus;

    public Payment() {
        this.paymentDate = LocalDateTime.now();
        this.paymentStatus = "Pending";
    }

    public Payment(Integer paymentId, Integer orderId, LocalDateTime paymentDate,
                   BigDecimal amount, String paymentType, String paymentStatus) {
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.paymentDate = paymentDate;
        this.amount = amount;
        this.paymentType = paymentType;
        this.paymentStatus = paymentStatus;
    }

    public Integer getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Integer paymentId) {
        this.paymentId = paymentId;
    }

    public Integer getId() {
        return paymentId;
    }

    public void setId(Integer id) {
        this.paymentId = id;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public LocalDateTime getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDateTime paymentDate) {
        this.paymentDate = paymentDate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getStatus() {
        return paymentStatus;
    }

    public void setStatus(String status) {
        this.paymentStatus = status;
    }
}
