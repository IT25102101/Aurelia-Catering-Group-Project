package com.aurelia.catering.model;

import java.sql.Timestamp;

/**
 * Model representing customer credentials and account state in the CUSTOMER_ACCOUNT table (AureliaCatering2).
 * Also contains joined customer demographic fields for seamless authentication workflows.
 */
public class CustomerAccount {

    private Integer accountId;
    private Integer customerId;
    private String passwordHash;
    private String accountStatus;
    private Timestamp createdDate;
    private Timestamp lastLoginDate;

    // Joined Customer fields
    private String customerName;
    private String customerPhone;
    private String customerEmail;

    public CustomerAccount() {}

    public CustomerAccount(Integer accountId, Integer customerId, String passwordHash, String accountStatus, Timestamp createdDate, Timestamp lastLoginDate) {
        this.accountId = accountId;
        this.customerId = customerId;
        this.passwordHash = passwordHash;
        this.accountStatus = accountStatus;
        this.createdDate = createdDate;
        this.lastLoginDate = lastLoginDate;
    }

    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }

    public Timestamp getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Timestamp createdDate) {
        this.createdDate = createdDate;
    }

    public Timestamp getLastLoginDate() {
        return lastLoginDate;
    }

    public void setLastLoginDate(Timestamp lastLoginDate) {
        this.lastLoginDate = lastLoginDate;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }
}
