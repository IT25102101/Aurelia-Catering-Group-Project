package com.aurelia.catering.model;

/**
 * DTO representing an evaluated ingredient requirement for an order.
 * Used to verify stock availability before order confirmation.
 */
public class InventoryCheckItem {

    private Integer inventoryItemId;
    private String ingredientName;
    private Double requiredQuantity;
    private Double availableQuantity;
    private Double shortage;
    private String unit;
    private boolean sufficient;
    private boolean unitMismatch;

    public InventoryCheckItem() {
    }

    public InventoryCheckItem(Integer inventoryItemId, String ingredientName, Double requiredQuantity,
                              Double availableQuantity, Double shortage, String unit,
                              boolean sufficient, boolean unitMismatch) {
        this.inventoryItemId = inventoryItemId;
        this.ingredientName = ingredientName;
        this.requiredQuantity = requiredQuantity;
        this.availableQuantity = availableQuantity;
        this.shortage = shortage;
        this.unit = unit;
        this.sufficient = sufficient;
        this.unitMismatch = unitMismatch;
    }

    public Integer getInventoryItemId() {
        return inventoryItemId;
    }

    public void setInventoryItemId(Integer inventoryItemId) {
        this.inventoryItemId = inventoryItemId;
    }

    public String getIngredientName() {
        return ingredientName;
    }

    public void setIngredientName(String ingredientName) {
        this.ingredientName = ingredientName;
    }

    public Double getRequiredQuantity() {
        return requiredQuantity;
    }

    public void setRequiredQuantity(Double requiredQuantity) {
        this.requiredQuantity = requiredQuantity;
    }

    public Double getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(Double availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public Double getShortage() {
        return shortage;
    }

    public void setShortage(Double shortage) {
        this.shortage = shortage;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public boolean isSufficient() {
        return sufficient;
    }

    public void setSufficient(boolean sufficient) {
        this.sufficient = sufficient;
    }

    public boolean isUnitMismatch() {
        return unitMismatch;
    }

    public void setUnitMismatch(boolean unitMismatch) {
        this.unitMismatch = unitMismatch;
    }

    // Alias methods for Part 5 REST API JSON format
    public Double getShortageQuantity() {
        return shortage;
    }

    public void setShortageQuantity(Double shortageQuantity) {
        this.shortage = shortageQuantity;
    }

    public boolean isAvailable() {
        return sufficient;
    }

    public void setAvailable(boolean available) {
        this.sufficient = available;
    }
}
