package com.aurelia.catering.strategy;

import java.util.ArrayList;
import java.util.List;

/**
 * Detailed breakdown of a pricing calculation result.
 */
public class PricingBreakdown {

    private String strategyCode;
    private String strategyName;
    private String strategyDescription;
    private Double basePrice;
    private Integer guestCount;
    private Double unitRate;
    private Double rawTotal;
    private Double discountAmount = 0.0;
    private Double surchargeAmount = 0.0;
    private Double finalTotalPrice;
    private Double estimatedFoodValue = 0.0;
    private List<String> calculationNotes = new ArrayList<>();

    public PricingBreakdown() {
    }

    public String getStrategyCode() {
        return strategyCode;
    }

    public void setStrategyCode(String strategyCode) {
        this.strategyCode = strategyCode;
    }

    public String getStrategyName() {
        return strategyName;
    }

    public void setStrategyName(String strategyName) {
        this.strategyName = strategyName;
    }

    public String getStrategyDescription() {
        return strategyDescription;
    }

    public void setStrategyDescription(String strategyDescription) {
        this.strategyDescription = strategyDescription;
    }

    public Double getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(Double basePrice) {
        this.basePrice = basePrice;
    }

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }

    public Double getUnitRate() {
        return unitRate;
    }

    public void setUnitRate(Double unitRate) {
        this.unitRate = unitRate;
    }

    public Double getRawTotal() {
        return rawTotal;
    }

    public void setRawTotal(Double rawTotal) {
        this.rawTotal = rawTotal;
    }

    public Double getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(Double discountAmount) {
        this.discountAmount = discountAmount;
    }

    public Double getSurchargeAmount() {
        return surchargeAmount;
    }

    public void setSurchargeAmount(Double surchargeAmount) {
        this.surchargeAmount = surchargeAmount;
    }

    public Double getFinalTotalPrice() {
        return finalTotalPrice;
    }

    public void setFinalTotalPrice(Double finalTotalPrice) {
        this.finalTotalPrice = finalTotalPrice;
    }

    public Double getEstimatedFoodValue() {
        return estimatedFoodValue;
    }

    public void setEstimatedFoodValue(Double estimatedFoodValue) {
        this.estimatedFoodValue = estimatedFoodValue;
    }

    public List<String> getCalculationNotes() {
        return calculationNotes;
    }

    public void setCalculationNotes(List<String> calculationNotes) {
        this.calculationNotes = calculationNotes;
    }

    public void addNote(String note) {
        if (this.calculationNotes == null) {
            this.calculationNotes = new ArrayList<>();
        }
        this.calculationNotes.add(note);
    }
}
