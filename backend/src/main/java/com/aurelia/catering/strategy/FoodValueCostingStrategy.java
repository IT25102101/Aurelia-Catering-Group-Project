package com.aurelia.catering.strategy;

import com.aurelia.catering.model.CateringPackage;
import com.aurelia.catering.model.PackageMenuItem;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Concrete Strategy 4: Menu Food-Value Cost-Plus Pricing.
 *
 * Directly calculates the combined value of all menu items contained in the package
 * (matching the database aggregation query SUM(Quantity * Price) from DDD Assignment 02 Query 4)
 * and adds a standard 25% catering culinary preparation and service overhead margin.
 */
@Component("foodValueCostingStrategy")
public class FoodValueCostingStrategy implements PackagePricingStrategy {

    @Override
    public String getStrategyCode() {
        return "food_value";
    }

    @Override
    public String getStrategyName() {
        return "Itemized Menu Food-Value Cost-Plus Pricing";
    }

    @Override
    public String getDescription() {
        return "Aggregates the individual food value of all assigned menu items in PACKAGE_MENU_ITEM plus 25% kitchen prep margin.";
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
        breakdown.setBasePrice(base);
        breakdown.setGuestCount(guestCount);

        double totalFoodValue = 0.0;
        int itemCount = 0;

        if (menuItems != null && !menuItems.isEmpty()) {
            for (PackageMenuItem item : menuItems) {
                double itemPrice = item.getMenuItemPrice() != null ? item.getMenuItemPrice() : 0.0;
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                double lineCost = itemPrice * qty;
                totalFoodValue += lineCost;
                itemCount++;
            }
        }

        breakdown.setEstimatedFoodValue(totalFoodValue);

        if (itemCount > 0) {
            double prepMargin = totalFoodValue * 0.25; // 25% culinary margin
            double finalPrice = totalFoodValue + prepMargin;

            breakdown.setRawTotal(totalFoodValue);
            breakdown.setSurchargeAmount(prepMargin);
            breakdown.setDiscountAmount(0.0);
            breakdown.setFinalTotalPrice(Math.round(finalPrice * 100.0) / 100.0);

            breakdown.addNote("Calculated across " + itemCount + " assigned menu items in PACKAGE_MENU_ITEM.");
            breakdown.addNote("Aggregated Raw Food Value: LKR " + String.format("%.2f", totalFoodValue));
            breakdown.addNote("Culinary Prep & Staging Margin (25%): LKR " + String.format("%.2f", prepMargin));
        } else {
            // Fallback to base package price if no items assigned yet
            breakdown.setRawTotal(base);
            breakdown.setFinalTotalPrice(base);
            breakdown.addNote("No menu items currently linked to package. Defaulted to base package price: LKR " + String.format("%.2f", base));
        }

        return breakdown;
    }
}
