package com.aurelia.catering.strategy.staff;

import com.aurelia.catering.model.Staff;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Concrete Strategy for DELIVERY_STAFF.
 *
 * Enforces road safety and vehicle compliance, commercial driving licenses,
 * strict 8-hour driving limits for fatigue prevention, 1.35x overtime multiplier,
 * and a 3,500 LKR fuel subsidy, vehicle maintenance, and transit risk allowance.
 */
@Component
public class DeliveryStaffPolicyStrategy implements StaffRolePolicyStrategy {

    private static final String ROLE = "DELIVERY_STAFF";
    private static final String POLICY_NAME = "Logistics Dispatch & Road Transit Policy";
    private static final String CATEGORY = "Logistics";
    private static final double BASE_HOURLY_RATE = 750.0;
    private static final double OVERTIME_MULTIPLIER = 1.35;
    private static final double SPECIAL_ALLOWANCE = 3500.0;
    private static final int MAX_SHIFT_HOURS = 8;
    private static final int MANDATORY_REST_HOURS = 14;

    private static final List<String> CLEARANCES = Arrays.asList(
            "COMMERCIAL_DRIVING_LICENSE_CLASS_B",
            "INSULATED_CARRIER_TRANSIT_SAFETY",
            "DEFENSIVE_DRIVING_CERTIFICATION",
            "CASH_AND_EPOS_COLLECTION_BOND"
    );

    private static final List<String> DUTIES = Arrays.asList(
            "Loading insulated banquet carriers & hot boxes",
            "Route dispatch & GPS-monitored navigation",
            "Client order handover and handover signature",
            "Vehicle pre-trip checklist & equipment return"
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
        return "Logistics policy governing catering transport safety, road dispatch regulations, fuel subsidy, and 1.35x overtime.";
    }

    @Override
    public StaffPolicyResult evaluatePolicy(Staff staff) {
        String name = (staff != null && staff.getName() != null) ? staff.getName() : "Delivery Staff Member";
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
                "Requires valid driver license and vehicle roadworthiness inspection. Enforces 8h shift cap for traffic safety."
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
        breakdown.setStaffName(staff != null ? staff.getName() : "Delivery Staff");
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
                "(%d hrs @ %.2f LKR) + (%d ot hrs @ %.2f LKR [1.35x]) + %.2f LKR fuel/vehicle allowance = %.2f LKR",
                regularHours, BASE_HOURLY_RATE, overtimeHours, effectiveOtRate, SPECIAL_ALLOWANCE, total
        ));

        return breakdown;
    }
}
