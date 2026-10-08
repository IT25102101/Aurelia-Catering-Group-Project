package com.aurelia.catering.strategy;

import com.aurelia.catering.model.CateringPackage;
import com.aurelia.catering.model.PackageMenuItem;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Concrete Strategy 2: Per-Guest Headcount Pricing with Volume Discount Tiers.
 *
 * Evaluates the effective cost per person based on the package baseline,
 * multiplies by guest count, and applies progressive volume discounts:
 *  - 1 to 99 guests: 0% discount
 *  - 100 to 199 guests: 5% bulk discount
 *  - 200 to 499 guests: 10% bulk discount
 *  - 500+ guests: 15% bulk discount
 */
@Component("perGuestPackagePricingStrategy")
public class PerGuestPackagePricingStrategy implements PackagePricingStrategy {

    @Override
    public String getStrategyCode() {
        return "per_guest";
    }

    @Override
    public String getStrategyName() {
        return "Per-Guest Headcount Pricing (with Bulk Tiers)";
    }

    @Override
    public String getDescription() {
        return "Calculates per-attendee cost and applies progressive tiered volume discounts for large events.";
    }

    @Override
    public double calculatePrice(CateringPackage cateringPackage, int guestCount, List<PackageMenuItem> menuItems) {
        PricingBreakdown breakdown = calculateBreakdown(cateringPackage, guestCount, menuItems);
        return breakdown.getFinalTotalPrice();
    }

    @Override
    public PricingBreakdown calculateBreakdown(CateringPackage cateringPackage, int guestCount, List<PackageMenuItem> menuItems) {
        PricingBreakdown breakdown = new PricingBreakdown();
        breakdown.setStrategyCode(getStrategyCode());
        breakdown.setStrategyName(getStrategyName());
        breakdown.setStrategyDescription(getDescription());

        double base = (cateringPackage != null && cateringPackage.getPrice() != null) ? cateringPackage.getPrice() : 0.0;
        int minGuests = (cateringPackage != null && cateringPackage.getMinGuestCount() != null && cateringPackage.getMinGuestCount() > 0)
                ? cateringPackage.getMinGuestCount() : 50;

        int actualGuests = Math.max(guestCount, 1);
        double perGuestRate = base / minGuests;

        double rawTotal = perGuestRate * actualGuests;

        // Progressive volume discount calculation
        double discountPercent = 0.0;
        if (actualGuests >= 500) {
            discountPercent = 0.15; // 15%
        } else if (actualGuests >= 200) {
            discountPercent = 0.10; // 10%
        } else if (actualGuests >= 100) {
            discountPercent = 0.05; // 5%
        }

        double discountAmount = rawTotal * discountPercent;
        double finalPrice = rawTotal - discountAmount;

        breakdown.setBasePrice(base);
        breakdown.setGuestCount(actualGuests);
        breakdown.setUnitRate(perGuestRate);
        breakdown.setRawTotal(rawTotal);
        breakdown.setDiscountAmount(discountAmount);
        breakdown.setSurchargeAmount(0.0);
        breakdown.setFinalTotalPrice(Math.round(finalPrice * 100.0) / 100.0);

        breakdown.addNote("Calculated unit rate per guest: LKR " + String.format("%.2f", perGuestRate));
        breakdown.addNote("Gross total for " + actualGuests + " guests: LKR " + String.format("%.2f", rawTotal));
        if (discountPercent > 0) {
            breakdown.addNote(String.format("Volume tier applied: %.0f%% bulk discount (Saved LKR %.2f)", discountPercent * 100, discountAmount));
        } else {
            breakdown.addNote("Standard headcount rate (volume discounts start at 100+ attendees).");
        }

        return breakdown;
    }
}
