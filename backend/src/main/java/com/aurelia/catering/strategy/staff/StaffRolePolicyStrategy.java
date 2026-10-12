package com.aurelia.catering.strategy.staff;

import com.aurelia.catering.model.Staff;

/**
 * Strategy interface for Staff Management.
 *
 * Defines interchangeable operational policies, duty clearances, shift safety limits,
 * and compensation formulas across different staff roles.
 */
public interface StaffRolePolicyStrategy {

    /**
     * Unique role code supported by this strategy (e.g., 'KITCHEN_STAFF', 'DELIVERY_STAFF').
     */
    String getSupportedRole();

    /**
     * Human-readable title of the operational policy.
     */
    String getPolicyName();

    /**
     * Operational category (e.g., 'Culinary', 'Logistics', 'Supervisory', 'Administration').
     */
    String getCategory();

    /**
     * Detailed explanation of the policy for audits and reports.
     */
    String getDescription();

    /**
     * Evaluates role-specific operational constraints, safety limits, and clearances.
     */
    StaffPolicyResult evaluatePolicy(Staff staff);

    /**
     * Calculates projected compensation for a given shift duration (regular hours + overtime hours).
     */
    StaffCompensationBreakdown calculateCompensation(Staff staff, int regularHours, int overtimeHours);
}
