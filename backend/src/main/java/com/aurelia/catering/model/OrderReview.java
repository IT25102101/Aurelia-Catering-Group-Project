package com.aurelia.catering.model;

import java.time.LocalDateTime;

/**
 * Model representing a staff review for an order from table Order_Review in AureliaCatering2.
 * Columns: OrderReviewID, OrderID, StaffID, ReviewDate, ReviewStatus, Comments
 */
public class OrderReview {

    private Integer orderReviewId;
    private Integer orderId;
    private Integer staffId;
    private LocalDateTime reviewDate;
    private String reviewStatus;
    private String comments;

    public OrderReview() {
    }

    public OrderReview(Integer orderReviewId, Integer orderId, Integer staffId, LocalDateTime reviewDate, String reviewStatus, String comments) {
        this.orderReviewId = orderReviewId;
        this.orderId = orderId;
        this.staffId = staffId;
        this.reviewDate = reviewDate;
        this.reviewStatus = reviewStatus;
        this.comments = comments;
    }

    public Integer getOrderReviewId() {
        return orderReviewId;
    }

    public void setOrderReviewId(Integer orderReviewId) {
        this.orderReviewId = orderReviewId;
    }

    public Integer getId() {
        return orderReviewId;
    }

    public void setId(Integer id) {
        this.orderReviewId = id;
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

    public LocalDateTime getReviewDate() {
        return reviewDate;
    }

    public void setReviewDate(LocalDateTime reviewDate) {
        this.reviewDate = reviewDate;
    }

    public String getReviewStatus() {
        return reviewStatus;
    }

    public void setReviewStatus(String reviewStatus) {
        this.reviewStatus = reviewStatus;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }
}
