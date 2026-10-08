package com.aurelia.catering.strategy;

import com.aurelia.catering.model.CateringPackage;
import com.aurelia.catering.model.PackageMenuItem;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Concrete Strategy 3: Occasion-Tiered Pricing.
 *
 * Applies specific premium surcharges or commercial concessions based on event occasion:
 *  - Gala: +25% (White-glove staffing, sommelier staging, silver tableware)
 *  - Wedding: +15% (Tiered cake service, bridal table setup, dedicated captain)
 *  - Corporate: -5% (Streamlined buffet catering concession for recurring business)
 *  - Birthday: standard base rate
 *  - General: standard base rate
 */
@Component("occasionTieredPricingStrategy")
public class OccasionTieredPricingStrategy implements PackagePricingStrategy {

    @Override
    public String getStrategyCode() {
        return "occasion";
    }

    @Override
    public String getStrategyName() {
        return "Occasion-Specific Premium/Concession Pricing";
    }

    @Override
    public String getDescription() {
        return "Factors in occasion-specific staffing, luxury setups (Wedding/Gala), or corporate commercial concessions.";
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
        String type = (cateringPackage != null && cateringPackage.getPackageType() != null) ? cateringPackage.getPackageType() : "General";

        double multiplier = 1.0;
        String occasionDetail = "Standard occasion rate";

        switch (type.toLowerCase()) {
            case "gala":
                multiplier = 1.25;
                occasionDetail = "Gala Premium Tier (+25% for white-glove staffing & fine-dining table staging)";
                break;
            case "wedding":
                multiplier = 1.15;
                occasionDetail = "Wedding Prestige Tier (+15% for sommelier service & bridal reception styling)";
                break;
            case "corporate":
                multiplier = 0.95;
                occasionDetail = "Corporate Partner Concession (-5% commercial volume discount)";
                break;
            case "birthday":
                multiplier = 1.0;
                occasionDetail = "Celebration Party Tier (Standard flat pricing with custom dessert setups)";
                break;
            default:
                multiplier = 1.0;
                occasionDetail = "General All-Occasion Rate";
                break;
        }

        double finalPrice = base * multiplier;
        double diff = finalPrice - base;

        breakdown.setBasePrice(base);
        breakdown.setGuestCount(guestCount);
        breakdown.setUnitRate(base);
        breakdown.setRawTotal(base);

        if (diff > 0) {
            breakdown.setSurchargeAmount(diff);
            breakdown.setDiscountAmount(0.0);
        } else if (diff < 0) {
            breakdown.setDiscountAmount(Math.abs(diff));
            breakdown.setSurchargeAmount(0.0);
        } else {
            breakdown.setDiscountAmount(0.0);
            breakdown.setSurchargeAmount(0.0);
        }

        breakdown.setFinalTotalPrice(Math.round(finalPrice * 100.0) / 100.0);
        breakdown.addNote("Occasion identified: " + type);
        breakdown.addNote(occasionDetail);
        breakdown.addNote("Calculated price: LKR " + String.format("%.2f", finalPrice));

        return breakdown;
    }
}
