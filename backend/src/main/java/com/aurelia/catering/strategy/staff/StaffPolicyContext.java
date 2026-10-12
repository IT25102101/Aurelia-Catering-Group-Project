package com.aurelia.catering.strategy.staff;

import com.aurelia.catering.model.Staff;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Context class for the Strategy Pattern in Staff Management.
 *
 * Maintains a runtime registry of interchangeable StaffRolePolicyStrategy implementations
 * injected cleanly via Spring Dependency Injection.
 *
 * Adheres strictly to:
 * - Open/Closed Principle (OCP): New roles can be introduced simply by implementing StaffRolePolicyStrategy.
 * - Single Responsibility Principle (SRP): Isolates strategy resolution from business logic and controllers.
 * - Zero long if-else or switch statements for selecting strategies.
 */
@Component
public class StaffPolicyContext {

    private final Map<String, StaffRolePolicyStrategy> strategyRegistry = new ConcurrentHashMap<>();
    private StaffRolePolicyStrategy defaultStrategy;

    @Autowired
    public StaffPolicyContext(List<StaffRolePolicyStrategy> strategies) {
        if (strategies != null) {
            for (StaffRolePolicyStrategy strategy : strategies) {
                String roleKey = strategy.getSupportedRole().trim().toUpperCase();
                strategyRegistry.put(roleKey, strategy);

                if ("DEFAULT".equalsIgnoreCase(roleKey)) {
                    this.defaultStrategy = strategy;
                }
            }
        }

        // If no explicit DEFAULT was registered, pick the first available as fallback
        if (this.defaultStrategy == null && strategies != null && !strategies.isEmpty()) {
            this.defaultStrategy = strategies.get(0);
        }

        // Map administrative/corporate roles to the default administrative strategy if present
        if (this.defaultStrategy != null) {
            strategyRegistry.putIfAbsent("ADMIN", this.defaultStrategy);
            strategyRegistry.putIfAbsent("FINANCE_OFFICER", this.defaultStrategy);
            strategyRegistry.putIfAbsent("INVENTORY_COORDINATOR", this.defaultStrategy);
        }
    }

    /**
     * Resolves the appropriate strategy for the given role via dictionary lookup (O(1)).
     * Avoids if-else or switch ladders.
     */
    public StaffRolePolicyStrategy getStrategy(String role) {
        if (role == null || role.trim().isEmpty()) {
            return defaultStrategy;
        }
        return strategyRegistry.getOrDefault(role.trim().toUpperCase(), defaultStrategy);
    }

    /**
     * Evaluates the operational policy for a staff member using their role's active strategy.
     */
    public StaffPolicyResult evaluate(Staff staff) {
        String role = (staff != null) ? staff.getRole() : null;
        StaffRolePolicyStrategy strategy = getStrategy(role);
        return strategy.evaluatePolicy(staff);
    }

    /**
     * Calculates shift compensation and overtime breakdown using the role's active strategy.
     */
    public StaffCompensationBreakdown calculateCompensation(Staff staff, int regularHours, int overtimeHours) {
        String role = (staff != null) ? staff.getRole() : null;
        StaffRolePolicyStrategy strategy = getStrategy(role);
        return strategy.calculateCompensation(staff, regularHours, overtimeHours);
    }

    /**
     * Returns metadata for all available role policies for UI discovery and lecturer demonstration.
     */
    public List<Map<String, Object>> getAvailablePolicies() {
        Set<StaffRolePolicyStrategy> uniqueStrategies = new LinkedHashSet<>(strategyRegistry.values());
        List<Map<String, Object>> list = new ArrayList<>();

        for (StaffRolePolicyStrategy strat : uniqueStrategies) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("role", strat.getSupportedRole());
            map.put("policyName", strat.getPolicyName());
            map.put("category", strat.getCategory());
            map.put("description", strat.getDescription());
            list.add(map);
        }
        return list;
    }
}
