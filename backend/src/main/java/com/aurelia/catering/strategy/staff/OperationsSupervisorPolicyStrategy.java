package com.aurelia.catering.strategy.staff;

import com.aurelia.catering.model.Staff;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Concrete Strategy for OPERATIONS_SUPERVISOR.
 *
 * Enforces banquet event supervision authority, shift briefing permissions,
 * extended 12-hour event endurance allowance, 1.25x overtime rate,
 * and a 2,000 LKR mobile on-call connectivity and event coordinator stipend.
 */
@Component
public class OperationsSupervisorPolicyStrategy implements StaffRolePolicyStrategy {

    private static final String ROLE = "OPERATIONS_SUPERVISOR";
    private static final String POLICY_NAME = "Banquet Operations & Roster Supervision Policy";
    private static final String CATEGORY = "Supervisory";
    private static final double BASE_HOURLY_RATE = 1200.0;
    private static final double OVERTIME_MULTIPLIER = 1.25;
    private static final double SPECIAL_ALLOWANCE = 2000.0;
    private static final int MAX_SHIFT_HOURS = 12;
    private static final int MANDATORY_REST_HOURS = 10;

    private static final List<String> CLEARANCES = Arrays.asList(
            "EVENT_SUPERVISION_COMMAND_CLEARANCE",
            "STAFF_ROSTER_OVERRIDE_AUTHORITY",
            "CLIENT_ESCALATION_AUTHORITY",
            "HEALTH_AND_SAFETY_COMPLIANCE_SIGN_OFF"
    );

    private static final List<String> DUTIES = Arrays.asList(
            "Pre-event staff briefing & role assignments",
            "Banquet floor coordination & schedule adherence",
            "Real-time kitchen & delivery dispatch synchronization",
            "Post-event incident reporting & client debrief"
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
        return "Supervisory policy governing banquet floor oversight, on-the-ground team leadership, on-call stipend, and 1.25x overtime.";
    }

    @Override
    public StaffPolicyResult evaluatePolicy(Staff staff) {
        String name = (staff != null && staff.getName() != null) ? staff.getName() : "Operations Supervisor";
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
                "Authorized to manage operational shift rosters, sign off delivery manifests, and handle on-site customer escalations."
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
        breakdown.setStaffName(staff != null ? staff.getName() : "Operations Supervisor");
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
                "(%d hrs @ %.2f LKR) + (%d ot hrs @ %.2f LKR [1.25x]) + %.2f LKR supervisory stipend = %.2f LKR",
                regularHours, BASE_HOURLY_RATE, overtimeHours, effectiveOtRate, SPECIAL_ALLOWANCE, total
        ));

        return breakdown;
    }
}
