package com.aurelia.catering.model;

import java.math.BigDecimal;

/**
 * Model representing a quotation item from table Quotation_Item in AureliaCatering2.
 * Columns: QuotationItemID, QuotationID, Description, Quantity, UnitPrice
 */
public class QuotationItem {

    private Integer quotationItemId;
    private Integer quotationId;
    private String description;
    private BigDecimal quantity;
    private BigDecimal unitPrice;

    public QuotationItem() {
    }

    public QuotationItem(Integer quotationItemId, Integer quotationId, String description, BigDecimal quantity, BigDecimal unitPrice) {
        this.quotationItemId = quotationItemId;
        this.quotationId = quotationId;
        this.description = description;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public Integer getQuotationItemId() {
        return quotationItemId;
    }

    public void setQuotationItemId(Integer quotationItemId) {
        this.quotationItemId = quotationItemId;
    }

    public Integer getId() {
        return quotationItemId;
    }

    public void setId(Integer id) {
        this.quotationItemId = id;
    }

    public Integer getQuotationId() {
        return quotationId;
    }

    public void setQuotationId(Integer quotationId) {
        this.quotationId = quotationId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }
}
