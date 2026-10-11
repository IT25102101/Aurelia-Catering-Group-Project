package com.aurelia.catering.strategy;

import com.aurelia.catering.model.CateringPackage;
import com.aurelia.catering.model.PackageMenuItem;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Concrete Strategy 1: Fixed Package Pricing.
 *
 * Charges the predefined fixed base price of the package, regardless of guest count
 * (suitable for standard fixed packages up to the package capacity).
 */
@Component("fixedPackagePricingStrategy")
public class FixedPackagePricingStrategy implements PackagePricingStrategy {

    @Override
    public String getStrategyCode() {
        return "fixed";
    }

    @Override
    public String getStrategyName() {
        return "Fixed Base Package Pricing";
    }

    @Override
    public String getDescription() {
        return "Applies the standard flat base package price regardless of guest count.";
    }

    @Override
    public double calculatePrice(CateringPackage cateringPackage, int guestCount, List<PackageMenuItem> menuItems) {
        if (cateringPackage == null || cateringPackage.getPrice() == null) {
            return 0.0;
        }
        return cateringPackage.getPrice();
    }

    @Override
    public PricingBreakdown calculateBreakdown(CateringPackage cateringPackage, int guestCount, List<PackageMenuItem> menuItems) {
        PricingBreakdown breakdown = new PricingBreakdown();
        breakdown.setStrategyCode(getStrategyCode());
        breakdown.setStrategyName(getStrategyName());
        breakdown.setStrategyDescription(getDescription());

        double base = (cateringPackage != null && cateringPackage.getPrice() != null) ? cateringPackage.getPrice() : 0.0;
        breakdown.setBasePrice(base);
        breakdown.setGuestCount(guestCount);
        breakdown.setUnitRate(base);
        breakdown.setRawTotal(base);
        breakdown.setDiscountAmount(0.0);
        breakdown.setSurchargeAmount(0.0);
        breakdown.setFinalTotalPrice(base);

        breakdown.addNote("Base flat fee applied: LKR " + String.format("%.2f", base));
        breakdown.addNote("Guest capacity covered: up to " + (cateringPackage != null ? cateringPackage.getMaxGuestCount() : 300) + " attendees.");
        return breakdown;
    }
}
