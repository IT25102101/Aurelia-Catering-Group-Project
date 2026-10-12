package com.aurelia.catering;

import com.aurelia.catering.model.Staff;
import com.aurelia.catering.strategy.staff.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests demonstrating the Strategy Pattern for Staff Management.
 */
public class StaffStrategyPatternTest {

    private KitchenStaffPolicyStrategy kitchenStrategy;
    private DeliveryStaffPolicyStrategy deliveryStrategy;
    private OperationsSupervisorPolicyStrategy supervisorStrategy;
    private AdministrativeStaffPolicyStrategy adminStrategy;
    private StaffPolicyContext context;

    @BeforeEach
    public void setUp() {
        kitchenStrategy = new KitchenStaffPolicyStrategy();
        deliveryStrategy = new DeliveryStaffPolicyStrategy();
        supervisorStrategy = new OperationsSupervisorPolicyStrategy();
        adminStrategy = new AdministrativeStaffPolicyStrategy();

        List<StaffRolePolicyStrategy> strategies = new ArrayList<>();
        strategies.add(kitchenStrategy);
        strategies.add(deliveryStrategy);
        strategies.add(supervisorStrategy);
        strategies.add(adminStrategy);

        context = new StaffPolicyContext(strategies);
    }

    @Test
    @DisplayName("KitchenStrategy should enforce 1.5x overtime, 2500 allowance, and HACCP clearance")
    public void testKitchenStrategy() {
        Staff staff = new Staff(3, "Tharushi Silva", "0771234567", "tharushi@aurelia.com", "KITCHEN_STAFF");
        StaffPolicyResult policy = kitchenStrategy.evaluatePolicy(staff);

        assertEquals("KITCHEN_STAFF", policy.getRole());
        assertEquals("Culinary Operations & Food Safety Policy", policy.getPolicyName());
        assertEquals(850.0, policy.getBaseHourlyRate());
        assertEquals(1.50, policy.getOvertimeMultiplier());
        assertEquals(2500.0, policy.getSpecialAllowance());
        assertEquals(10, policy.getMaxShiftHours());
        assertTrue(policy.getClearances().contains("HACCP_FOOD_SAFETY_LEVEL_2"));

        // 40 regular hours, 10 overtime hours
        // Regular: 40 * 850 = 34,000
        // Overtime: 10 * 850 * 1.5 = 12,750
        // Allowance: 2,500
        // Total = 49,250
        StaffCompensationBreakdown comp = kitchenStrategy.calculateCompensation(staff, 40, 10);
        assertEquals(34000.0, comp.getRegularEarnings(), 0.01);
        assertEquals(12750.0, comp.getOvertimeEarnings(), 0.01);
        assertEquals(2500.0, comp.getSpecialAllowance(), 0.01);
        assertEquals(49250.0, comp.getTotalCompensation(), 0.01);
    }

    @Test
    @DisplayName("DeliveryStrategy should enforce 1.35x overtime, 3500 fuel allowance, and 8h shift cap")
    public void testDeliveryStrategy() {
        Staff staff = new Staff(5, "Kasun Perera", "0772345678", "kasun@aurelia.com", "DELIVERY_STAFF");
        StaffPolicyResult policy = deliveryStrategy.evaluatePolicy(staff);

        assertEquals("DELIVERY_STAFF", policy.getRole());
        assertEquals("Logistics Dispatch & Road Transit Policy", policy.getPolicyName());
        assertEquals(750.0, policy.getBaseHourlyRate(), 0.01);
        assertEquals(1.35, policy.getOvertimeMultiplier(), 0.01);
        assertEquals(3500.0, policy.getSpecialAllowance(), 0.01);
        assertEquals(8, policy.getMaxShiftHours());
        assertTrue(policy.getClearances().contains("COMMERCIAL_DRIVING_LICENSE_CLASS_B"));

        // 40 regular hours, 5 overtime hours
        // Regular: 40 * 750 = 30,000
        // Overtime: 5 * 750 * 1.35 = 5,062.50
        // Allowance: 3,500
        // Total = 38,562.50
        StaffCompensationBreakdown comp = deliveryStrategy.calculateCompensation(staff, 40, 5);
        assertEquals(30000.0, comp.getRegularEarnings(), 0.01);
        assertEquals(5062.50, comp.getOvertimeEarnings(), 0.01);
        assertEquals(3500.0, comp.getSpecialAllowance(), 0.01);
        assertEquals(38562.50, comp.getTotalCompensation(), 0.01);
    }

    @Test
    @DisplayName("SupervisorStrategy should enforce 1.25x overtime, 2000 on-call stipend, and 12h endurance limit")
    public void testSupervisorStrategy() {
        Staff staff = new Staff(2, "Ruwan Fernando", "0773456789", "ruwan@aurelia.com", "OPERATIONS_SUPERVISOR");
        StaffPolicyResult policy = supervisorStrategy.evaluatePolicy(staff);

        assertEquals("OPERATIONS_SUPERVISOR", policy.getRole());
        assertEquals(1200.0, policy.getBaseHourlyRate(), 0.01);
        assertEquals(1.25, policy.getOvertimeMultiplier(), 0.01);
        assertEquals(2000.0, policy.getSpecialAllowance(), 0.01);
        assertEquals(12, policy.getMaxShiftHours());

        // 40 regular, 8 overtime
        // Regular: 40 * 1200 = 48,000
        // Overtime: 8 * 1200 * 1.25 = 12,000
        // Allowance: 2000
        // Total = 62,000
        StaffCompensationBreakdown comp = supervisorStrategy.calculateCompensation(staff, 40, 8);
        assertEquals(48000.0, comp.getRegularEarnings(), 0.01);
        assertEquals(12000.0, comp.getOvertimeEarnings(), 0.01);
        assertEquals(2000.0, comp.getSpecialAllowance(), 0.01);
        assertEquals(62000.0, comp.getTotalCompensation(), 0.01);
    }

    @Test
    @DisplayName("Context should resolve interchangeable strategies dynamically without if-else branching")
    public void testContextDynamicResolution() {
        Staff kitchen = new Staff(3, "Tharushi", "0771234567", "tharushi@aurelia.com", "KITCHEN_STAFF");
        Staff delivery = new Staff(5, "Kasun", "0772345678", "kasun@aurelia.com", "DELIVERY_STAFF");
        Staff supervisor = new Staff(2, "Ruwan", "0773456789", "ruwan@aurelia.com", "OPERATIONS_SUPERVISOR");
        Staff admin = new Staff(1, "Admin", "0774567890", "admin@aurelia.com", "ADMIN");

        StaffRolePolicyStrategy s1 = context.getStrategy(kitchen.getRole());
        StaffRolePolicyStrategy s2 = context.getStrategy(delivery.getRole());
        StaffRolePolicyStrategy s3 = context.getStrategy(supervisor.getRole());
        StaffRolePolicyStrategy s4 = context.getStrategy(admin.getRole());

        assertTrue(s1 instanceof KitchenStaffPolicyStrategy);
        assertTrue(s2 instanceof DeliveryStaffPolicyStrategy);
        assertTrue(s3 instanceof OperationsSupervisorPolicyStrategy);
        assertTrue(s4 instanceof AdministrativeStaffPolicyStrategy);

        // Fallback for null/unknown role
        StaffRolePolicyStrategy fallback = context.getStrategy("UNKNOWN_ROLE");
        assertNotNull(fallback);
    }
}
