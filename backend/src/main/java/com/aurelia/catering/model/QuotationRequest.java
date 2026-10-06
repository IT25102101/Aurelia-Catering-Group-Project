package com.aurelia.catering.model;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for creating a Quotation with its line items in a single request.
 */
public class QuotationRequest {

    private Integer orderId;
    private BigDecimal totalAmount;
    private String status;
    private List<QuotationItem> items;

    public QuotationRequest() {
    }

    public QuotationRequest(Integer orderId, BigDecimal totalAmount, String status, List<QuotationItem> items) {
        this.orderId = orderId;
        this.totalAmount = totalAmount;
        this.status = status;
        this.items = items;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
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

    public List<QuotationItem> getItems() {
        return items;
    }

    public void setItems(List<QuotationItem> items) {
        this.items = items;
    }
}
