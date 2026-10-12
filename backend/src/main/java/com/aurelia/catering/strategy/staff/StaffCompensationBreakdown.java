package com.aurelia.catering.strategy.staff;

/**
 * Data Transfer Object representing the projected shift compensation calculation
 * based on the role strategy's base rate, overtime multiplier, and special allowance.
 */
public class StaffCompensationBreakdown {

    private Integer staffId;
    private String staffName;
    private String role;
    private String policyName;
    private int regularHours;
    private int overtimeHours;
    private int totalHours;
    private double baseHourlyRate;
    private double overtimeMultiplier;
    private double effectiveOvertimeRate;
    private double regularEarnings;
    private double overtimeEarnings;
    private double specialAllowance;
    private double totalCompensation;
    private String formulaBreakdown;

    public StaffCompensationBreakdown() {
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

    public int getRegularHours() {
        return regularHours;
    }

    public void setRegularHours(int regularHours) {
        this.regularHours = regularHours;
    }

    public int getOvertimeHours() {
        return overtimeHours;
    }

    public void setOvertimeHours(int overtimeHours) {
        this.overtimeHours = overtimeHours;
    }

    public int getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(int totalHours) {
        this.totalHours = totalHours;
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

    public double getEffectiveOvertimeRate() {
        return effectiveOvertimeRate;
    }

    public void setEffectiveOvertimeRate(double effectiveOvertimeRate) {
        this.effectiveOvertimeRate = effectiveOvertimeRate;
    }

    public double getRegularEarnings() {
        return regularEarnings;
    }

    public void setRegularEarnings(double regularEarnings) {
        this.regularEarnings = regularEarnings;
    }

    public double getOvertimeEarnings() {
        return overtimeEarnings;
    }

    public void setOvertimeEarnings(double overtimeEarnings) {
        this.overtimeEarnings = overtimeEarnings;
    }

    public double getSpecialAllowance() {
        return specialAllowance;
    }

    public void setSpecialAllowance(double specialAllowance) {
        this.specialAllowance = specialAllowance;
    }

    public double getTotalCompensation() {
        return totalCompensation;
    }

    public void setTotalCompensation(double totalCompensation) {
        this.totalCompensation = totalCompensation;
    }

    public String getFormulaBreakdown() {
        return formulaBreakdown;
    }

    public void setFormulaBreakdown(String formulaBreakdown) {
        this.formulaBreakdown = formulaBreakdown;
    }
}
