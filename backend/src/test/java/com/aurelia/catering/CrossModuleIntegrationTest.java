package com.aurelia.catering;

import com.aurelia.catering.factory.CateringPackageFactory;
import com.aurelia.catering.factory.WeddingPackage;
import com.aurelia.catering.model.*;
import com.aurelia.catering.strategy.*;
import com.aurelia.catering.util.PasswordUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Cross-Module Integration Tests.
 * Simulates end-to-end multi-module business workflows:
 * Auth -> Menu -> Package -> Order -> Quotation -> Payment.
 */
public class CrossModuleIntegrationTest {

    private CateringPackageFactory packageFactory;
    private PackagePricingContext pricingContext;

    @BeforeEach
    void setUp() {
        packageFactory = new CateringPackageFactory();
        pricingContext = new PackagePricingContext(List.of(
                new FixedPackagePricingStrategy(),
                new PerGuestPackagePricingStrategy(),
                new OccasionTieredPricingStrategy(),
                new FoodValueCostingStrategy()
        ));
    }

    @Test
    @DisplayName("End-to-End Workflow: Customer Authentication -> Package Configuration -> Pricing Calculation -> Order -> Quotation -> Payment")
    void testCompleteCustomerBookingWorkflow() {
        // Step 1: Authentication & User Management
        String customerPlainPassword = "CustomerSecure#2026";
        String customerHashed = PasswordUtil.hash(customerPlainPassword);
        CustomerAccount customer = new CustomerAccount();
        customer.setCustomerId(101);
        customer.setCustomerName("Dilshan Fernando");
        customer.setCustomerEmail("dilshan@example.com");
        customer.setAccountStatus("Active");
        customer.setPasswordHash(customerHashed);

        assertTrue(PasswordUtil.matches(customerPlainPassword, customer.getPasswordHash()),
                "Customer credentials must be successfully verified");

        // Step 2: Menu Items Creation
        MenuItem dish1 = new MenuItem(201, "Mutton Biryani", "Special basmati rice", 1200.0, "Main Course");
        MenuItem dish2 = new MenuItem(202, "Chicken Tikka", "Clay-oven grilled", 800.0, "Appetizer");
        MenuItem dish3 = new MenuItem(203, "Watalappan", "Traditional jaggery pudding", 400.0, "Dessert");

        // Step 3: Catering Package Management (Factory Pattern)
        CateringPackage weddingPkg = packageFactory.createPackage(
                "Wedding", "Grand Royal Wedding", "Premium celebration package", 100000.0);

        assertTrue(weddingPkg instanceof WeddingPackage, "Factory must create specialized WeddingPackage subclass");
        assertEquals("Wedding", weddingPkg.getPackageType());

        // Step 4: Package Menu Item Assignments
        List<PackageMenuItem> assignedDishes = new ArrayList<>();
        PackageMenuItem pmi1 = new PackageMenuItem(1, dish1.getId(), 50);
        pmi1.setMenuItemPrice(dish1.getPrice());
        assignedDishes.add(pmi1);

        PackageMenuItem pmi2 = new PackageMenuItem(1, dish2.getId(), 50);
        pmi2.setMenuItemPrice(dish2.getPrice());
        assignedDishes.add(pmi2);

        PackageMenuItem pmi3 = new PackageMenuItem(1, dish3.getId(), 50);
        pmi3.setMenuItemPrice(dish3.getPrice());
        assignedDishes.add(pmi3);

        assertEquals(3, assignedDishes.size());

        // Step 5: Dynamic Pricing Evaluation via Strategy Pattern
        // Calculation across 100 guests with Occasion Strategy (+15% for Wedding)
        PricingBreakdown occasionBreakdown = pricingContext.executeBreakdown(
                "occasion", weddingPkg, 100, assignedDishes);

        // Base: 100,000 + 15% Wedding Surcharge = 115,000
        assertEquals(115000.0, occasionBreakdown.getFinalTotalPrice(), 0.01);
        assertEquals(15000.0, occasionBreakdown.getSurchargeAmount(), 0.01);

        // Step 6: Order Creation
        Order order = new Order();
        order.setOrderId(5001);
        order.setCustomerId(customer.getCustomerId());
        order.setPackageId(weddingPkg.getId());
        order.setStatus("Pending");

        assertEquals(101, order.getCustomerId());
        assertEquals("Pending", order.getStatus());

        // Step 7: Quotation Generation
        Quotation quotation = new Quotation();
        quotation.setQuotationId(9001);
        quotation.setOrderId(order.getOrderId());
        quotation.setTotalAmount(java.math.BigDecimal.valueOf(occasionBreakdown.getFinalTotalPrice()));
        quotation.setStatus("Approved");

        assertEquals(5001, quotation.getOrderId());
        assertEquals(java.math.BigDecimal.valueOf(115000.0), quotation.getTotalAmount());

        // Step 8: Payment Processing (Advance Payment & Balance Tracking)
        Payment advancePayment = new Payment();
        advancePayment.setPaymentId(8001);
        advancePayment.setOrderId(order.getOrderId());
        advancePayment.setAmount(java.math.BigDecimal.valueOf(50000.0));
        advancePayment.setPaymentType("Bank Transfer");
        advancePayment.setStatus("Completed");

        double totalQuoted = quotation.getTotalAmount().doubleValue();
        double paidAmount = advancePayment.getAmount().doubleValue();
        double balanceRemaining = totalQuoted - paidAmount;

        assertEquals(65000.0, balanceRemaining, 0.01);
        assertTrue(balanceRemaining > 0, "Partial payment leaves positive balance due");

        // Step 9: Final Settlement
        Payment finalPayment = new Payment();
        finalPayment.setPaymentId(8002);
        finalPayment.setOrderId(order.getOrderId());
        finalPayment.setAmount(java.math.BigDecimal.valueOf(65000.0));
        finalPayment.setPaymentType("Credit Card");
        finalPayment.setStatus("Completed");

        double totalSettled = paidAmount + finalPayment.getAmount().doubleValue();
        assertEquals(totalQuoted, totalSettled, 0.01, "Total settled payments must match quotation total");
    }
}
