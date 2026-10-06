package com.aurelia.catering.model;

import java.sql.Timestamp;

/**
 * Model representing staff credentials and account state in the STAFF_ACCOUNT table (AureliaCatering2).
 * Also contains joined staff details (Name, Email, Role) for authentication workflows.
 */
public class StaffAccount {

    private Integer accountId;
    private Integer staffId;
    private String username;
    private String passwordHash;
    private String accountStatus;
    private Timestamp createdDate;
    private Timestamp lastLoginDate;

    // Joined Staff fields
    private String staffName;
    private String staffPhone;
    private String staffEmail;
    private String staffRole;

    public StaffAccount() {}

    public StaffAccount(Integer accountId, Integer staffId, String username, String passwordHash, String accountStatus, Timestamp createdDate, Timestamp lastLoginDate) {
        this.accountId = accountId;
        this.staffId = staffId;
        this.username = username;
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

    public Integer getStaffId() {
        return staffId;
    }

    public void setStaffId(Integer staffId) {
        this.staffId = staffId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
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

    public String getStaffName() {
        return staffName;
    }

    public void setStaffName(String staffName) {
        this.staffName = staffName;
    }

    public String getStaffPhone() {
        return staffPhone;
    }

    public void setStaffPhone(String staffPhone) {
        this.staffPhone = staffPhone;
    }

    public String getStaffEmail() {
        return staffEmail;
    }

    public void setStaffEmail(String staffEmail) {
        this.staffEmail = staffEmail;
    }

    public String getStaffRole() {
        return staffRole;
    }

    public void setStaffRole(String staffRole) {
        this.staffRole = staffRole;
    }
}
