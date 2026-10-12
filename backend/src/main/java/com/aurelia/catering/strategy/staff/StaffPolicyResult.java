package com.aurelia.catering.strategy.staff;

import java.util.ArrayList;
import java.util.List;

/**
 * Data Transfer Object containing the evaluated operational policy,
 * duty clearance, safety rules, and compensation configuration for a staff member.
 */
public class StaffPolicyResult {

    private Integer staffId;
    private String staffName;
    private String role;
    private String policyName;
    private String category;
    private double baseHourlyRate;
    private double overtimeMultiplier;
    private double specialAllowance;
    private int maxShiftHours;
    private int mandatoryRestHours;
    private List<String> clearances = new ArrayList<>();
    private List<String> operationalDuties = new ArrayList<>();
    private String notes;

    public StaffPolicyResult() {
    }

    public StaffPolicyResult(Integer staffId, String staffName, String role, String policyName,
                             String category, double baseHourlyRate, double overtimeMultiplier,
                             double specialAllowance, int maxShiftHours, int mandatoryRestHours,
                             List<String> clearances, List<String> operationalDuties, String notes) {
        this.staffId = staffId;
        this.staffName = staffName;
        this.role = role;
        this.policyName = policyName;
        this.category = category;
        this.baseHourlyRate = baseHourlyRate;
        this.overtimeMultiplier = overtimeMultiplier;
        this.specialAllowance = specialAllowance;
        this.maxShiftHours = maxShiftHours;
        this.mandatoryRestHours = mandatoryRestHours;
        this.clearances = clearances != null ? clearances : new ArrayList<>();
        this.operationalDuties = operationalDuties != null ? operationalDuties : new ArrayList<>();
        this.notes = notes;
    }

    public Integer getStaffId() {
        return staffId;
    }

    public void setStaffId(Integer staffId) {
        this.staffId = staffId;
    }

    public String getStaffName() {
        return staffName;
    }

    public void setStaffName(String staffName) {
        this.staffName = staffName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPolicyName() {
        return policyName;
    }

    public void setPolicyName(String policyName) {
        this.policyName = policyName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public double getBaseHourlyRate() {
        return baseHourlyRate;
    }

    public void setBaseHourlyRate(double baseHourlyRate) {
        this.baseHourlyRate = baseHourlyRate;
    }

    public double getOvertimeMultiplier() {
        return overtimeMultiplier;
    }

    public void setOvertimeMultiplier(double overtimeMultiplier) {
        this.overtimeMultiplier = overtimeMultiplier;
    }

    public double getSpecialAllowance() {
        return specialAllowance;
    }

    public void setSpecialAllowance(double specialAllowance) {
        this.specialAllowance = specialAllowance;
    }

    public int getMaxShiftHours() {
        return maxShiftHours;
    }

    public void setMaxShiftHours(int maxShiftHours) {
        this.maxShiftHours = maxShiftHours;
    }

    public int getMandatoryRestHours() {
        return mandatoryRestHours;
    }

    public void setMandatoryRestHours(int mandatoryRestHours) {
        this.mandatoryRestHours = mandatoryRestHours;
    }

    public List<String> getClearances() {
        return clearances;
    }

    public void setClearances(List<String> clearances) {
        this.clearances = clearances;
    }

    public List<String> getOperationalDuties() {
        return operationalDuties;
    }

    public void setOperationalDuties(List<String> operationalDuties) {
        this.operationalDuties = operationalDuties;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
