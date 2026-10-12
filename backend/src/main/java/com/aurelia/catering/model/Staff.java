package com.aurelia.catering.model;

/**
 * Model representing staff from the Staff table in AureliaCatering2.
 * Columns: StaffID, Name, Phone, Email, Role
 */
public class Staff {

    private Integer id;
    private String name;
    private String phone;
    private String email;
    private String role;

    private Boolean available = true;

    public Staff() {
    }

    public Staff(Integer id, String name, String phone, String email, String role) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.role = role;
        this.available = true;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getStaffId() {
        return id;
    }

    public void setStaffId(Integer staffId) {
        this.id = staffId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    // Compatibility getters/setters for frontend
    public String getContactNumber() {
        return phone;
    }

    public void setContactNumber(String contactNumber) {
        this.phone = contactNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getAvailable() {
        return available != null ? available : true;
    }

    public void setAvailable(Boolean available) {
        this.available = available != null ? available : true;
    }
}

