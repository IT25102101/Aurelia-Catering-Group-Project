package com.aurelia.catering.model;

import java.time.LocalDate;

/**
 * Data Transfer Object for public guest order tracking.
 * 
 * In accordance with Phase 1 privacy rules:
 * - NO customer name, email, or contact information is included.
 * - Payment fields are included as placeholders (Phase 2) without fabricated data.
 * - Only operational event and package details are exposed.
 *
 * OOP - abstraction / data hiding: the public page only sees this small class, never the full
 * Order or Customer objects, so private details cannot leak. Fields are private (encapsulation).
 */
public class OrderTracking {

    private Integer orderId;
    private String status;
    private LocalDate eventDate;
    private String location;
    private Integer guestCount;
    private String packageName;
    private String paymentStatus;
    private Double totalAmount;
    private Double amountPaid;
    private Double remainingBalance;

    // OOP - constructor overloading; both set safe defaults for the payment placeholders
    public OrderTracking() {
        this.paymentStatus = "Not Available";
        this.totalAmount = null;
        this.amountPaid = null;
        this.remainingBalance = null;
    }

    public OrderTracking(Integer orderId, String status, LocalDate eventDate, String location,
                         Integer guestCount, String packageName) {
        this.orderId = orderId;
        this.status = status;
        this.eventDate = eventDate;
        this.location = location;
        this.guestCount = guestCount;
        this.packageName = packageName;
        this.paymentStatus = "Not Available";
        this.totalAmount = null;
        this.amountPaid = null;
        this.remainingBalance = null;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
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
}
