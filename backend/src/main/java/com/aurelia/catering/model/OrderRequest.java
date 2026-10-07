package com.aurelia.catering.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Model representing a customer request for an order from table Order_Request in AureliaCatering2.
 * Columns: RequestID, OrderID, RequestType, RequestDate, Reason, RequestedEventDate, RequestStatus, ReviewedByStaffID, ReviewDate, Response
 */
public class OrderRequest {

    private Integer requestId;
    private Integer orderId;
    private String requestType;
    private LocalDateTime requestDate;
    private String reason;
    private LocalDate requestedEventDate;
    private String requestStatus;
    private Integer reviewedByStaffId;
    private LocalDateTime reviewDate;
    private String response;

    public OrderRequest() {
    }

    public OrderRequest(Integer requestId, Integer orderId, String requestType, LocalDateTime requestDate,
                        String reason, LocalDate requestedEventDate, String requestStatus,
                        Integer reviewedByStaffId, LocalDateTime reviewDate, String response) {
        this.requestId = requestId;
        this.orderId = orderId;
        this.requestType = requestType;
        this.requestDate = requestDate;
        this.reason = reason;
        this.requestedEventDate = requestedEventDate;
        this.requestStatus = requestStatus;
        this.reviewedByStaffId = reviewedByStaffId;
        this.reviewDate = reviewDate;
        this.response = response;
    }

    public Integer getRequestId() {
        return requestId;
    }

    public void setRequestId(Integer requestId) {
        this.requestId = requestId;
    }

    public Integer getId() {
        return requestId;
    }

    public void setId(Integer id) {
        this.requestId = id;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public LocalDateTime getRequestDate() {
        return requestDate;
    }

    public void setRequestDate(LocalDateTime requestDate) {
        this.requestDate = requestDate;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDate getRequestedEventDate() {
        return requestedEventDate;
    }

    public void setRequestedEventDate(LocalDate requestedEventDate) {
        this.requestedEventDate = requestedEventDate;
    }

    public String getRequestStatus() {
        return requestStatus;
    }

    public void setRequestStatus(String requestStatus) {
        this.requestStatus = requestStatus;
    }

    public Integer getReviewedByStaffId() {
        return reviewedByStaffId;
    }

    public void setReviewedByStaffId(Integer reviewedByStaffId) {
        this.reviewedByStaffId = reviewedByStaffId;
    }

    public LocalDateTime getReviewDate() {
        return reviewDate;
    }

    public void setReviewDate(LocalDateTime reviewDate) {
        this.reviewDate = reviewDate;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }
}
