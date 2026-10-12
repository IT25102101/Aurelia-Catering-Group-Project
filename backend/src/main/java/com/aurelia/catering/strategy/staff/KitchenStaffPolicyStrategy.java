package com.aurelia.catering.strategy.staff;

import com.aurelia.catering.model.Staff;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Concrete Strategy for KITCHEN_STAFF.
 *
 * Enforces culinary hygiene certifications, hot kitchen safety standards,
 * 1.5x overtime multiplier for high-temperature kitchen environments,
 * and a 2,500 LKR culinary gear and sanitation allowance.
 */
@Component
public class KitchenStaffPolicyStrategy implements StaffRolePolicyStrategy {

    private static final String ROLE = "KITCHEN_STAFF";
    private static final String POLICY_NAME = "Culinary Operations & Food Safety Policy";
    private static final String CATEGORY = "Culinary";
    private static final double BASE_HOURLY_RATE = 850.0;
    private static final double OVERTIME_MULTIPLIER = 1.50;
    private static final double SPECIAL_ALLOWANCE = 2500.0;
    private static final int MAX_SHIFT_HOURS = 10;
    private static final int MANDATORY_REST_HOURS = 12;

    private static final List<String> CLEARANCES = Arrays.asList(
            "HACCP_FOOD_SAFETY_LEVEL_2",
            "HOT_KITCHEN_SAFETY_CLEARANCE",
            "ALLERGEN_AWARENESS_CERTIFIED",
            "COLD_CHAIN_TEMPERATURE_MONITORING"
    );

    private static final List<String> DUTIES = Arrays.asList(
            "Recipe ingredient prep & batch cooking",
            "Banquet dish portioning & temperature checks",
            "Kitchen sanitization & waste segregation",
            "Ingredient FIFO inspection & expiry tracking"
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
        return "Culinary policy governing commercial food production, HACCP standards, hot-kitchen hazard allowance, and 1.5x overtime.";
    }

    @Override
    public StaffPolicyResult evaluatePolicy(Staff staff) {
        String name = (staff != null && staff.getName() != null) ? staff.getName() : "Kitchen Staff Member";
        Integer id = (staff != null) ? staff.getId() : null;

        return new StaffPolicyResult(
                id,
                name,
                ROLE,
                POLICY_NAME,
                CATEGORY,
                BASE_HOURLY_RATE,
                OVERTIME_MULTIPLIER,
                SPECIAL_ALLOWANCE,
                MAX_SHIFT_HOURS,
                MANDATORY_REST_HOURS,
                CLEARANCES,
                DUTIES,
                "Requires valid Food Hygiene Card before entering hot line stations. Max 10 consecutive hours due to thermal fatigue."
        );
    }

    @Override
    public StaffCompensationBreakdown calculateCompensation(Staff staff, int regularHours, int overtimeHours) {
        regularHours = Math.max(0, regularHours);
        overtimeHours = Math.max(0, overtimeHours);
        int totalHours = regularHours + overtimeHours;

        double effectiveOtRate = Math.round(BASE_HOURLY_RATE * OVERTIME_MULTIPLIER * 100.0) / 100.0;
        double regularEarnings = Math.round(regularHours * BASE_HOURLY_RATE * 100.0) / 100.0;
        double overtimeEarnings = Math.round(overtimeHours * effectiveOtRate * 100.0) / 100.0;
        double total = Math.round((regularEarnings + overtimeEarnings + SPECIAL_ALLOWANCE) * 100.0) / 100.0;

        StaffCompensationBreakdown breakdown = new StaffCompensationBreakdown();
        breakdown.setStaffId(staff != null ? staff.getId() : null);
        breakdown.setStaffName(staff != null ? staff.getName() : "Kitchen Staff");
        breakdown.setRole(ROLE);
        breakdown.setPolicyName(POLICY_NAME);
        breakdown.setRegularHours(regularHours);
        breakdown.setOvertimeHours(overtimeHours);
        breakdown.setTotalHours(totalHours);
        breakdown.setBaseHourlyRate(BASE_HOURLY_RATE);
        breakdown.setOvertimeMultiplier(OVERTIME_MULTIPLIER);
        breakdown.setEffectiveOvertimeRate(effectiveOtRate);
        breakdown.setRegularEarnings(regularEarnings);
        breakdown.setOvertimeEarnings(overtimeEarnings);
        breakdown.setSpecialAllowance(SPECIAL_ALLOWANCE);
        breakdown.setTotalCompensation(total);
        breakdown.setFormulaBreakdown(String.format(
                "(%d hrs @ %.2f LKR) + (%d ot hrs @ %.2f LKR [1.5x]) + %.2f LKR culinary kit allowance = %.2f LKR",
                regularHours, BASE_HOURLY_RATE, overtimeHours, effectiveOtRate, SPECIAL_ALLOWANCE, total
        ));

        return breakdown;
    }
}
