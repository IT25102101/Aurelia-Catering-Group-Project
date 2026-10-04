package com.aurelia.catering.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Model representing a catering delivery from table Delivery in AureliaCatering2.
 * Columns: DeliveryID, OrderID, StaffID, DeliveryDate, DeliveryStatus, Location
 */
public class Delivery {

    private Integer deliveryId;
    private Integer orderId;
    private Integer staffId;
    private LocalDate deliveryDate;
    private String deliveryStatus;
    private String location;

    public Delivery() {
        this.deliveryDate = LocalDate.now();
        this.deliveryStatus = "Pending";
    }

    public Delivery(Integer deliveryId, Integer orderId, Integer staffId, LocalDate deliveryDate, String deliveryStatus, String location) {
        this.deliveryId = deliveryId;
        this.orderId = orderId;
        this.staffId = staffId;
        this.deliveryDate = deliveryDate;
        this.deliveryStatus = deliveryStatus;
        this.location = location;
    }

    // Primary Getters & Setters
    public Integer getDeliveryId() {
        return deliveryId;
    }

    public void setDeliveryId(Integer deliveryId) {
        this.deliveryId = deliveryId;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public Integer getStaffId() {
        return staffId;
    }

    public void setStaffId(Integer staffId) {
        this.staffId = staffId;
    }

    public LocalDate getDeliveryDate() {
        return deliveryDate;
    }

    public void setDeliveryDate(LocalDate deliveryDate) {
        this.deliveryDate = deliveryDate;
    }

    public String getDeliveryStatus() {
        return deliveryStatus;
    }

    public void setDeliveryStatus(String deliveryStatus) {
        this.deliveryStatus = deliveryStatus;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    // Compatibility aliases for ID
    public Integer getId() {
        return deliveryId;
    }

    public void setId(Integer id) {
        this.deliveryId = id;
    }

    // Compatibility aliases for Status
    public String getStatus() {
        return deliveryStatus;
    }

    public void setStatus(String status) {
        this.deliveryStatus = status;
    }

    // Compatibility aliases for Location/Venue
    public String getVenue() {
        return location;
    }

    public void setVenue(String venue) {
        this.location = venue;
    }

    // Compatibility aliases for Scheduled Date/Time
    public LocalDateTime getScheduledTime() {
        return deliveryDate != null ? deliveryDate.atStartOfDay() : null;
    }

    public void setScheduledTime(LocalDateTime scheduledTime) {
        if (scheduledTime != null) {
            this.deliveryDate = scheduledTime.toLocalDate();
        }
    }
}
