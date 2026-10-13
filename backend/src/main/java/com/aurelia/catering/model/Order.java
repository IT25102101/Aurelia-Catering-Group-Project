package com.aurelia.catering.model;

import java.time.LocalDate;

/**
 * Model representing an order from the ORDER table in AureliaCatering2.
 * Columns: OrderID, CustomerID, PackageID, OrderDate, Status, SpecialRequests, PreparedByStaffID, CustomerConfirmedDate
 *
 * OOP: a plain model class with private fields (encapsulation) and public getters/setters.
 * Jackson turns it to and from JSON, so the same object travels between React, controller and DAO.
 * Wrapper types (Integer, LocalDate) are used so optional columns can be null.
 */
public class Order {

    private Integer orderId;
    private Integer customerId;
    private Integer packageId;
    private LocalDate orderDate;
    private String status;
    private String specialRequests;
    private Integer preparedByStaffId;
    private LocalDate customerConfirmedDate;

    // OOP - constructor overloading: the empty one is used by Jackson/DAO, the full one builds an order in one call
    public Order() {
    }

    public Order(Integer orderId, Integer customerId, Integer packageId, LocalDate orderDate,
                 String status, String specialRequests, Integer preparedByStaffId, LocalDate customerConfirmedDate) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.packageId = packageId;
        this.orderDate = orderDate;
        this.status = status;
        this.specialRequests = specialRequests;
        this.preparedByStaffId = preparedByStaffId;
        this.customerConfirmedDate = customerConfirmedDate;
    }

    // OOP - encapsulation: fields are private and only reachable through these getters/setters
    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    // short alias so the frontend can read the order id as "id" as well as "orderId"
    public Integer getId() {
        return orderId;
    }

    public void setId(Integer id) {
        this.orderId = id;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public Integer getPackageId() {
        return packageId;
    }

    public void setPackageId(Integer packageId) {
        this.packageId = packageId;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDate orderDate) {
        this.orderDate = orderDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSpecialRequests() {
        return specialRequests;
    }

    public void setSpecialRequests(String specialRequests) {
        this.specialRequests = specialRequests;
    }

    public Integer getPreparedByStaffId() {
        return preparedByStaffId;
    }

    public void setPreparedByStaffId(Integer preparedByStaffId) {
        this.preparedByStaffId = preparedByStaffId;
    }

    public LocalDate getCustomerConfirmedDate() {
        return customerConfirmedDate;
    }

    public void setCustomerConfirmedDate(LocalDate customerConfirmedDate) {
        this.customerConfirmedDate = customerConfirmedDate;
    }
}
