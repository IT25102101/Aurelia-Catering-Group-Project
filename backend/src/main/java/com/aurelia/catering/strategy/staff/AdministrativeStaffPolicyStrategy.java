package com.aurelia.catering.strategy.staff;

import com.aurelia.catering.model.Staff;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Concrete Strategy for Administrative & Corporate Staff (ADMIN, FINANCE_OFFICER, INVENTORY_COORDINATOR, DEFAULT).
 *
 * Enforces standard corporate office hours (8-hour cap), fiscal compliance,
 * 1.00x overtime rate (no field overtime hazard premium), and 0 LKR field allowance.
 */
@Component
public class AdministrativeStaffPolicyStrategy implements StaffRolePolicyStrategy {

    private static final String ROLE = "DEFAULT";
    private static final String POLICY_NAME = "Corporate Governance & Office Administration Policy";
    private static final String CATEGORY = "Administration";
    private static final double BASE_HOURLY_RATE = 1000.0;
    private static final double ADMIN_HOURLY_RATE = 1500.0;
    private static final double OVERTIME_MULTIPLIER = 1.00;
    private static final double SPECIAL_ALLOWANCE = 0.0;
    private static final int MAX_SHIFT_HOURS = 8;
    private static final int MANDATORY_REST_HOURS = 16;

    private static final List<String> CLEARANCES = Arrays.asList(
            "CORPORATE_DATA_PROTECTION_CLEARANCE",
            "FINANCIAL_AUDITING_ACCESS",
            "INVENTORY_LEDGER_CONTROLLER",
            "SYSTEM_SECURITY_ADMINISTRATION"
    );

    private static final List<String> DUTIES = Arrays.asList(
            "System configuration & user access management",
            "Financial invoice verification & ledger balancing",
            "Stock procurement auditing & vendor coordination",
            "Executive catering analytics & reporting"
    );

    @Override
    public String getSupportedRole() {
        return ROLE;
    }

    @Override
    public String getPolicyName() {
        return POLICY_NAME;
    }

    @Override
    public String getCategory() {
        return CATEGORY;
    }

    @Override
    public String getDescription() {
        return "Corporate policy governing administrative, executive, finance, and inventory personnel with standard salaried hours and zero field hazard.";
    }

    @Override
    public StaffPolicyResult evaluatePolicy(Staff staff) {
        String name = (staff != null && staff.getName() != null) ? staff.getName() : "Administrative Staff";
        Integer id = (staff != null) ? staff.getId() : null;
        String role = (staff != null && staff.getRole() != null) ? staff.getRole() : "ADMIN";

        double rate = "ADMIN".equalsIgnoreCase(role) ? ADMIN_HOURLY_RATE : BASE_HOURLY_RATE;

        return new StaffPolicyResult(
                id,
                name,
                role,
                POLICY_NAME,
                CATEGORY,
                rate,
                OVERTIME_MULTIPLIER,
                SPECIAL_ALLOWANCE,
                MAX_SHIFT_HOURS,
                MANDATORY_REST_HOURS,
                CLEARANCES,
                DUTIES,
                "Standard administrative desk policy. Authorized for corporate data systems, inventory auditing, or financial ledgers."
        );
    }

    @Override
    public StaffCompensationBreakdown calculateCompensation(Staff staff, int regularHours, int overtimeHours) {
        regularHours = Math.max(0, regularHours);
        overtimeHours = Math.max(0, overtimeHours);
        int totalHours = regularHours + overtimeHours;

        String role = (staff != null && staff.getRole() != null) ? staff.getRole() : "ADMIN";
        double rate = "ADMIN".equalsIgnoreCase(role) ? ADMIN_HOURLY_RATE : BASE_HOURLY_RATE;

        double effectiveOtRate = Math.round(rate * OVERTIME_MULTIPLIER * 100.0) / 100.0;
        double regularEarnings = Math.round(regularHours * rate * 100.0) / 100.0;
        double overtimeEarnings = Math.round(overtimeHours * effectiveOtRate * 100.0) / 100.0;
        double total = Math.round((regularEarnings + overtimeEarnings + SPECIAL_ALLOWANCE) * 100.0) / 100.0;

        StaffCompensationBreakdown breakdown = new StaffCompensationBreakdown();
        breakdown.setStaffId(staff != null ? staff.getId() : null);
        breakdown.setStaffName(staff != null ? staff.getName() : "Administrative Staff");
        breakdown.setRole(role);
        breakdown.setPolicyName(POLICY_NAME);
        breakdown.setRegularHours(regularHours);
        breakdown.setOvertimeHours(overtimeHours);
        breakdown.setTotalHours(totalHours);
        breakdown.setBaseHourlyRate(rate);
        breakdown.setOvertimeMultiplier(OVERTIME_MULTIPLIER);
        breakdown.setEffectiveOvertimeRate(effectiveOtRate);
        breakdown.setRegularEarnings(regularEarnings);
        breakdown.setOvertimeEarnings(overtimeEarnings);
        breakdown.setSpecialAllowance(SPECIAL_ALLOWANCE);
        breakdown.setTotalCompensation(total);
        breakdown.setFormulaBreakdown(String.format(
                "(%d hrs @ %.2f LKR) + (%d ot hrs @ %.2f LKR [1.0x standard]) + %.2f LKR allowance = %.2f LKR",
                regularHours, rate, overtimeHours, effectiveOtRate, SPECIAL_ALLOWANCE, total
        ));

        return breakdown;
    }
}
