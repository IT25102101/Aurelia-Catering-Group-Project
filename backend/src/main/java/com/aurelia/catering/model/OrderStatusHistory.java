package com.aurelia.catering.model;

import java.time.LocalDateTime;

/**
 * Model representing one status change of an order (audit trail) from table Order_Status_History in AureliaCatering2.
 * Columns: StatusHistoryID, OrderID, Status, ChangedDate, ChangedByStaffID
 */
public class OrderStatusHistory {

    private Integer statusHistoryId;
    private Integer orderId;
    private String status;
    private LocalDateTime changedDate;
    private Integer changedByStaffId;

    // OOP - encapsulation (private fields + getters/setters) and constructor overloading (empty + full)
    public OrderStatusHistory() {
    }

    public OrderStatusHistory(Integer statusHistoryId, Integer orderId, String status, LocalDateTime changedDate, Integer changedByStaffId) {
        this.statusHistoryId = statusHistoryId;
        this.orderId = orderId;
        this.status = status;
        this.changedDate = changedDate;
        this.changedByStaffId = changedByStaffId;
    }

    public Integer getStatusHistoryId() {
        return statusHistoryId;
    }

    public void setStatusHistoryId(Integer statusHistoryId) {
        this.statusHistoryId = statusHistoryId;
    }

    public Integer getId() {
        return statusHistoryId;
    }

    public void setId(Integer id) {
        this.statusHistoryId = id;
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

    public LocalDateTime getChangedDate() {
        return changedDate;
    }

    public void setChangedDate(LocalDateTime changedDate) {
        this.changedDate = changedDate;
    }

    public Integer getChangedByStaffId() {
        return changedByStaffId;
    }

    public void setChangedByStaffId(Integer changedByStaffId) {
        this.changedByStaffId = changedByStaffId;
    }
}
