package com.aurelia.catering.strategy;

import com.aurelia.catering.model.CateringPackage;
import com.aurelia.catering.model.PackageMenuItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Context class for the Strategy Pattern (Behavioral).
 *
 * Maintains a reference to one of the PackagePricingStrategy objects and communicates
 * with it solely through the PackagePricingStrategy interface.
 *
 * Clients can switch strategies at runtime to estimate and compute package pricing
 * under different commercial models without modifying context or controller code.
 */
@Component
public class PackagePricingContext {

    private final Map<String, PackagePricingStrategy> strategies = new HashMap<>();
    private PackagePricingStrategy currentStrategy;

    @Autowired
    public PackagePricingContext(List<PackagePricingStrategy> strategyList) {
        if (strategyList != null) {
            for (PackagePricingStrategy strat : strategyList) {
                strategies.put(strat.getStrategyCode().toLowerCase(), strat);
            }
        }
        // Default to fixed pricing if available
        this.currentStrategy = strategies.getOrDefault("fixed",
                strategyList != null && !strategyList.isEmpty() ? strategyList.get(0) : null);
    }

    /**
     * Sets the active pricing strategy dynamically.
     */
    public void setStrategy(PackagePricingStrategy strategy) {
        if (strategy != null) {
            this.currentStrategy = strategy;
        }
    }

    /**
     * Switches strategy by its string code (e.g. 'fixed', 'per_guest', 'occasion', 'food_value').
     */
    public boolean setStrategyByCode(String code) {
        if (code == null) return false;
        PackagePricingStrategy found = strategies.get(code.trim().toLowerCase());
        if (found != null) {
            this.currentStrategy = found;
            return true;
        }
        return false;
    }

    /**
     * Retrieves a strategy by code without changing the active default.
     */
    public PackagePricingStrategy getStrategy(String code) {
        if (code == null) return currentStrategy;
        return strategies.getOrDefault(code.trim().toLowerCase(), currentStrategy);
    }

    /**
     * Executes the pricing calculation using the current or specified strategy.
     */
    public double executeCalculation(CateringPackage cateringPackage, int guestCount, List<PackageMenuItem> menuItems) {
        if (currentStrategy == null) {
            return (cateringPackage != null && cateringPackage.getPrice() != null) ? cateringPackage.getPrice() : 0.0;
        }
        return currentStrategy.calculatePrice(cateringPackage, guestCount, menuItems);
    }

    /**
     * Executes pricing calculation with detailed breakdown.
     */
    public PricingBreakdown executeBreakdown(String strategyCode, CateringPackage cateringPackage, int guestCount, List<PackageMenuItem> menuItems) {
        PackagePricingStrategy strategyToUse = getStrategy(strategyCode);
        if (strategyToUse == null) {
            strategyToUse = currentStrategy;
        }
        if (strategyToUse == null) {
            PricingBreakdown fallback = new PricingBreakdown();
            fallback.setFinalTotalPrice((cateringPackage != null && cateringPackage.getPrice() != null) ? cateringPackage.getPrice() : 0.0);
            return fallback;
        }
        return strategyToUse.calculateBreakdown(cateringPackage, guestCount, menuItems);
    }

    /**
     * Returns a list of all registered pricing strategies for frontend discovery.
     */
    public List<Map<String, String>> getAvailableStrategies() {
        List<Map<String, String>> list = new ArrayList<>();
        for (PackagePricingStrategy strat : strategies.values()) {
            Map<String, String> map = new LinkedHashMap<>();
            map.put("code", strat.getStrategyCode());
            map.put("name", strat.getStrategyName());
            map.put("description", strat.getDescription());
            list.add(map);
        }
        return list;
    }
}
