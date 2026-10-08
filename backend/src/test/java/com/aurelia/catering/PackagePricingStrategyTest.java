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
 * Unit Tests for Strategy Pattern Implementation.
 */
public class PackagePricingStrategyTest {

    private CateringPackageFactory factory;
    private FixedPackagePricingStrategy fixedStrategy;
    private PerGuestPackagePricingStrategy perGuestStrategy;
    private OccasionTieredPricingStrategy occasionStrategy;
    private FoodValueCostingStrategy foodValueStrategy;
    private PackagePricingContext context;

    @BeforeEach
    public void setUp() {
        factory = new CateringPackageFactory();
        fixedStrategy = new FixedPackagePricingStrategy();
        perGuestStrategy = new PerGuestPackagePricingStrategy();
        occasionStrategy = new OccasionTieredPricingStrategy();
        foodValueStrategy = new FoodValueCostingStrategy();

        List<PackagePricingStrategy> list = new ArrayList<>();
        list.add(fixedStrategy);
        list.add(perGuestStrategy);
        list.add(occasionStrategy);
        list.add(foodValueStrategy);

        context = new PackagePricingContext(list);
    }

    @Test
    @DisplayName("FixedStrategy should return constant base price")
    public void testFixedPricingStrategy() {
        CateringPackage pkg = factory.createPackage("General", "Buffet Package", "Desc", 30000.0);
        double price = fixedStrategy.calculatePrice(pkg, 150, new ArrayList<>());
        assertEquals(30000.0, price);
    }

    @Test
    @DisplayName("PerGuestStrategy should calculate unit rate with volume bulk discounts")
    public void testPerGuestPricingStrategyWithDiscount() {
        // Base: 50,000 for 50 guests = 1,000 per guest
        CateringPackage pkg = factory.createPackage("Wedding", "Wedding Gold", "Desc", 50000.0);

        // 100 guests -> 5% discount (100 * 1000 = 100,000 -> 95,000)
        PricingBreakdown b100 = perGuestStrategy.calculateBreakdown(pkg, 100, new ArrayList<>());
        assertEquals(95000.0, b100.getFinalTotalPrice());
        assertEquals(5000.0, b100.getDiscountAmount());

        // 250 guests -> 10% discount (250 * 1000 = 250,000 -> 225,000)
        PricingBreakdown b250 = perGuestStrategy.calculateBreakdown(pkg, 250, new ArrayList<>());
        assertEquals(225000.0, b250.getFinalTotalPrice());
        assertEquals(25000.0, b250.getDiscountAmount());
    }

    @Test
    @DisplayName("OccasionTieredStrategy should apply multipliers according to occasion")
    public void testOccasionTieredPricingStrategy() {
        CateringPackage gala = factory.createPackage("Gala", "Grand Gala", "Desc", 100000.0);
        PricingBreakdown galaBreakdown = occasionStrategy.calculateBreakdown(gala, 100, new ArrayList<>());
        // Gala +25% = 125,000
        assertEquals(125000.0, galaBreakdown.getFinalTotalPrice());
        assertEquals(25000.0, galaBreakdown.getSurchargeAmount());

        CateringPackage corp = factory.createPackage("Corporate", "Corp Meet", "Desc", 100000.0);
        PricingBreakdown corpBreakdown = occasionStrategy.calculateBreakdown(corp, 100, new ArrayList<>());
        // Corporate -5% = 95,000
        assertEquals(95000.0, corpBreakdown.getFinalTotalPrice());
        assertEquals(5000.0, corpBreakdown.getDiscountAmount());
    }

    @Test
    @DisplayName("FoodValueCostingStrategy should aggregate menu item line costs plus 25% margin")
    public void testFoodValueCostingStrategy() {
        CateringPackage pkg = factory.createPackage("Wedding", "Wedding Feast", "Desc", 50000.0);

        List<PackageMenuItem> items = new ArrayList<>();
        PackageMenuItem item1 = new PackageMenuItem(1, 101, 50); // 50 * 800 = 40,000
        item1.setMenuItemPrice(800.0);
        PackageMenuItem item2 = new PackageMenuItem(1, 102, 50); // 50 * 400 = 20,000
        item2.setMenuItemPrice(400.0);

        items.add(item1);
        items.add(item2);

        // Total raw food value = 60,000
        // +25% prep margin = 15,000
        // Total = 75,000
        PricingBreakdown breakdown = foodValueStrategy.calculateBreakdown(pkg, 50, items);
        assertEquals(60000.0, breakdown.getEstimatedFoodValue());
        assertEquals(15000.0, breakdown.getSurchargeAmount());
        assertEquals(75000.0, breakdown.getFinalTotalPrice());
    }

    @Test
    @DisplayName("Context should allow switching strategies dynamically at runtime")
    public void testContextDynamicStrategySwitching() {
        CateringPackage pkg = factory.createPackage("Wedding", "Wedding Standard", "Desc", 50000.0);

        // Calculate using fixed strategy
        PricingBreakdown bFixed = context.executeBreakdown("fixed", pkg, 50, new ArrayList<>());
        assertEquals(50000.0, bFixed.getFinalTotalPrice());

        // Switch to per_guest
        PricingBreakdown bGuest = context.executeBreakdown("per_guest", pkg, 100, new ArrayList<>());
        assertEquals(95000.0, bGuest.getFinalTotalPrice());

        // Switch to occasion
        PricingBreakdown bOccasion = context.executeBreakdown("occasion", pkg, 50, new ArrayList<>());
        assertEquals(57500.0, bOccasion.getFinalTotalPrice()); // 50,000 * 1.15
    }
}
