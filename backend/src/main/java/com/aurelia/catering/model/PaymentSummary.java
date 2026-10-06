package com.aurelia.catering.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Financial summary DTO for an order.
 * 
 * Computes:
 * - Total Amount
 * - Advance Required (30%)
 * - Total Amount Paid
 * - Remaining Balance
 * - Payment Status (UNPAID, ADVANCE_PAID, PARTIALLY_PAID, FULLY_PAID, REFUNDED)
 * - Complete List of Payments
 */
public class PaymentSummary {

    private Integer orderId;
    private Double totalAmount;
    private Double advanceRequired;
    private Double amountPaid;
    private Double remainingBalance;
    private String paymentStatus;
    private List<Payment> payments = new ArrayList<>();

    public PaymentSummary() {
    }

    public PaymentSummary(Integer orderId, Double totalAmount, Double advanceRequired,
                          Double amountPaid, Double remainingBalance, String paymentStatus,
                          List<Payment> payments) {
        this.orderId = orderId;
        this.totalAmount = totalAmount;
        this.advanceRequired = advanceRequired;
        this.amountPaid = amountPaid;
        this.remainingBalance = remainingBalance;
        this.paymentStatus = paymentStatus;
        this.payments = payments;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public Double getAdvanceRequired() {
        return advanceRequired;
    }

    public void setAdvanceRequired(Double advanceRequired) {
        this.advanceRequired = advanceRequired;
    }

    public Double getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(Double amountPaid) {
        this.amountPaid = amountPaid;
    }

    public Double getRemainingBalance() {
        return remainingBalance;
    }

    public void setRemainingBalance(Double remainingBalance) {
        this.remainingBalance = remainingBalance;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public List<Payment> getPayments() {
        return payments;
    }

    public void setPayments(List<Payment> payments) {
        this.payments = payments;
    }
}
