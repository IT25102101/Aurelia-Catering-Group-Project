package com.aurelia.catering;

import com.aurelia.catering.factory.CateringPackageFactory;
import com.aurelia.catering.model.CateringPackage;
import com.aurelia.catering.model.PackageMenuItem;
import com.aurelia.catering.strategy.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Deep Boundary and Edge-Case Tests for Strategy Pattern.
 * User's Individual Contribution: Catering Package Management.
 */
public class StrategyEdgeCaseTest {

    private CateringPackageFactory factory;
    private FixedPackagePricingStrategy fixedStrategy;
    private PerGuestPackagePricingStrategy perGuestStrategy;
    private OccasionTieredPricingStrategy occasionStrategy;
    private FoodValueCostingStrategy foodValueStrategy;
    private PackagePricingContext context;

    @BeforeEach
    void setUp() {
        factory = new CateringPackageFactory();
        fixedStrategy = new FixedPackagePricingStrategy();
        perGuestStrategy = new PerGuestPackagePricingStrategy();
        occasionStrategy = new OccasionTieredPricingStrategy();
        foodValueStrategy = new FoodValueCostingStrategy();

        context = new PackagePricingContext(List.of(
                fixedStrategy, perGuestStrategy, occasionStrategy, foodValueStrategy
        ));
    }

    // -------------------------------------------------------------
    // PerGuestPackagePricingStrategy: Tier Boundaries
    // -------------------------------------------------------------

    @Test
    @DisplayName("Boundary: 99 guests should receive 0% discount (rate = 1,000)")
    void testPerGuestTierBoundary99Guests() {
        // Base 50,000 for min 50 guests = 1,000 per guest
        CateringPackage pkg = factory.createPackage("Wedding", "Pkg", "Desc", 50000.0);
        PricingBreakdown b = perGuestStrategy.calculateBreakdown(pkg, 99, new ArrayList<>());

        assertEquals(99000.0, b.getRawTotal(), 0.01);
        assertEquals(0.0, b.getDiscountAmount(), 0.01);
        assertEquals(99000.0, b.getFinalTotalPrice(), 0.01);
    }

    @Test
    @DisplayName("Boundary: 100 guests should trigger exactly 5% bulk discount")
    void testPerGuestTierBoundary100Guests() {
        CateringPackage pkg = factory.createPackage("Wedding", "Pkg", "Desc", 50000.0);
        PricingBreakdown b = perGuestStrategy.calculateBreakdown(pkg, 100, new ArrayList<>());

        // 100 * 1,000 = 100,000. Discount 5% = 5,000. Total = 95,000.
        assertEquals(100000.0, b.getRawTotal(), 0.01);
        assertEquals(5000.0, b.getDiscountAmount(), 0.01);
        assertEquals(95000.0, b.getFinalTotalPrice(), 0.01);
    }

    @Test
    @DisplayName("Boundary: 199 guests should stay in 5% discount tier")
    void testPerGuestTierBoundary199Guests() {
        CateringPackage pkg = factory.createPackage("Wedding", "Pkg", "Desc", 50000.0);
        PricingBreakdown b = perGuestStrategy.calculateBreakdown(pkg, 199, new ArrayList<>());

        // 199 * 1,000 = 199,000. 5% discount = 9,950. Total = 189,050.
        assertEquals(199000.0, b.getRawTotal(), 0.01);
        assertEquals(9950.0, b.getDiscountAmount(), 0.01);
        assertEquals(189050.0, b.getFinalTotalPrice(), 0.01);
    }

    @Test
    @DisplayName("Boundary: 200 guests should trigger exactly 10% bulk discount")
    void testPerGuestTierBoundary200Guests() {
        CateringPackage pkg = factory.createPackage("Wedding", "Pkg", "Desc", 50000.0);
        PricingBreakdown b = perGuestStrategy.calculateBreakdown(pkg, 200, new ArrayList<>());

        // 200 * 1,000 = 200,000. 10% discount = 20,000. Total = 180,000.
        assertEquals(200000.0, b.getRawTotal(), 0.01);
        assertEquals(20000.0, b.getDiscountAmount(), 0.01);
        assertEquals(180000.0, b.getFinalTotalPrice(), 0.01);
    }

    @Test
    @DisplayName("Boundary: 499 guests should stay in 10% discount tier")
    void testPerGuestTierBoundary499Guests() {
        CateringPackage pkg = factory.createPackage("Wedding", "Pkg", "Desc", 50000.0);
        PricingBreakdown b = perGuestStrategy.calculateBreakdown(pkg, 499, new ArrayList<>());

        // 499 * 1,000 = 499,000. 10% discount = 49,900. Total = 449,100.
        assertEquals(499000.0, b.getRawTotal(), 0.01);
        assertEquals(49900.0, b.getDiscountAmount(), 0.01);
        assertEquals(449100.0, b.getFinalTotalPrice(), 0.01);
    }

    @Test
    @DisplayName("Boundary: 500 guests should trigger maximum 15% bulk discount")
    void testPerGuestTierBoundary500Guests() {
        CateringPackage pkg = factory.createPackage("Wedding", "Pkg", "Desc", 50000.0);
        PricingBreakdown b = perGuestStrategy.calculateBreakdown(pkg, 500, new ArrayList<>());

        // 500 * 1,000 = 500,000. 15% discount = 75,000. Total = 425,000.
        assertEquals(500000.0, b.getRawTotal(), 0.01);
        assertEquals(75000.0, b.getDiscountAmount(), 0.01);
        assertEquals(425000.0, b.getFinalTotalPrice(), 0.01);
    }

    @Test
    @DisplayName("Edge Case: Zero or negative guest count should clamp to minimum 1 guest safely")
    void testPerGuestZeroOrNegativeGuests() {
        CateringPackage pkg = factory.createPackage("Wedding", "Pkg", "Desc", 50000.0);

        PricingBreakdown bZero = perGuestStrategy.calculateBreakdown(pkg, 0, new ArrayList<>());
        assertEquals(1, bZero.getGuestCount());
        assertEquals(1000.0, bZero.getFinalTotalPrice(), 0.01);

        PricingBreakdown bNeg = perGuestStrategy.calculateBreakdown(pkg, -25, new ArrayList<>());
        assertEquals(1, bNeg.getGuestCount());
        assertEquals(1000.0, bNeg.getFinalTotalPrice(), 0.01);
    }

    // -------------------------------------------------------------
    // OccasionTieredPricingStrategy: Multipliers & Case Handling
    // -------------------------------------------------------------

    @Test
    @DisplayName("Occasion multiplier case insensitivity ('gala' vs 'GALA')")
    void testOccasionCaseInsensitive() {
        CateringPackage pkg = new CateringPackage(1, "Test", "Desc", 80000.0, "gala");
        PricingBreakdown b = occasionStrategy.calculateBreakdown(pkg, 50, new ArrayList<>());

        // 80,000 * 1.25 = 100,000
        assertEquals(100000.0, b.getFinalTotalPrice(), 0.01);
        assertEquals(20000.0, b.getSurchargeAmount(), 0.01);
    }

    @Test
    @DisplayName("Occasion multiplier unknown type falls back to standard 1.0x")
    void testOccasionUnknownTypeFallback() {
        CateringPackage pkg = new CateringPackage(1, "Test", "Desc", 60000.0, "Anniversary");
        PricingBreakdown b = occasionStrategy.calculateBreakdown(pkg, 50, new ArrayList<>());

        assertEquals(60000.0, b.getFinalTotalPrice(), 0.01);
        assertEquals(0.0, b.getDiscountAmount(), 0.01);
        assertEquals(0.0, b.getSurchargeAmount(), 0.01);
    }

    // -------------------------------------------------------------
    // FoodValueCostingStrategy: Margin & Null Handling
    // -------------------------------------------------------------

    @Test
    @DisplayName("FoodValueCosting: Empty items list should safely fall back to base package price")
    void testFoodValueEmptyItemsFallback() {
        CateringPackage pkg = factory.createPackage("General", "Standard", "Desc", 35000.0);
        PricingBreakdown b = foodValueStrategy.calculateBreakdown(pkg, 50, new ArrayList<>());

        assertEquals(35000.0, b.getFinalTotalPrice(), 0.01);
        assertEquals(0.0, b.getEstimatedFoodValue(), 0.01);
    }

    @Test
    @DisplayName("FoodValueCosting: Null item prices or quantities handled safely")
    void testFoodValueNullPriceOrQty() {
        CateringPackage pkg = factory.createPackage("General", "Standard", "Desc", 35000.0);

        List<PackageMenuItem> items = new ArrayList<>();
        PackageMenuItem itemWithNulls = new PackageMenuItem(1, 10, null);
        itemWithNulls.setMenuItemPrice(null); // Price null -> 0.0, Qty null -> 1
        items.add(itemWithNulls);

        PackageMenuItem itemValid = new PackageMenuItem(1, 11, 20);
        itemValid.setMenuItemPrice(500.0); // 20 * 500 = 10,000
        items.add(itemValid);

        PricingBreakdown b = foodValueStrategy.calculateBreakdown(pkg, 50, items);

        // Raw food value = 10,000. Prep margin 25% = 2,500. Total = 12,500.
        assertEquals(10000.0, b.getEstimatedFoodValue(), 0.01);
        assertEquals(2500.0, b.getSurchargeAmount(), 0.01);
        assertEquals(12500.0, b.getFinalTotalPrice(), 0.01);
    }

    // -------------------------------------------------------------
    // PackagePricingContext: Fallback on unknown code
    // -------------------------------------------------------------

    @Test
    @DisplayName("Context fallback: Unknown strategy code should default to fixed pricing")
    void testContextUnknownStrategyFallback() {
        CateringPackage pkg = factory.createPackage("Wedding", "Wedding Gold", "Desc", 70000.0);

        PricingBreakdown b = context.executeBreakdown("nonexistent_strategy", pkg, 100, new ArrayList<>());

        assertEquals("fixed", b.getStrategyCode());
        assertEquals(70000.0, b.getFinalTotalPrice(), 0.01);
    }
}
