package com.aurelia.catering.strategy;

import com.aurelia.catering.model.CateringPackage;
import com.aurelia.catering.model.PackageMenuItem;

import java.util.List;

/**
 * Strategy Pattern Interface (Behavioral).
 *
 * Defines the contract for interchangeable package pricing algorithms.
 * Allows pricing models (fixed, per-guest, occasion-tiered, food-value based)
 * to vary independently without modifying the client/controller.
 */
public interface PackagePricingStrategy {

    /**
     * Unique identifier code for the strategy (e.g., 'fixed', 'per_guest', 'occasion', 'food_value').
     */
    String getStrategyCode();

    /**
     * Human-readable name for the pricing strategy.
     */
    String getStrategyName();

    /**
     * Description explaining how this pricing algorithm calculates the final price.
     */
    String getDescription();

    /**
     * Calculates the total package price based on package details, guest count, and assigned menu items.
     */
    double calculatePrice(CateringPackage cateringPackage, int guestCount, List<PackageMenuItem> menuItems);

    /**
     * Calculates a complete transparent pricing breakdown.
     */
    PricingBreakdown calculateBreakdown(CateringPackage cateringPackage, int guestCount, List<PackageMenuItem> menuItems);
}
