package com.aurelia.catering.model;

/**
 * Model representing an inventory item from the Inventory_Item table in AureliaCatering2.
 * Columns: InventoryItemID, ItemName, Quantity, Unit, ReorderLevel
 */
public class InventoryItem {

    private Integer id;
    private String itemName;
    private Double quantity;
    private String unit;
    private Double reorderLevel;

    public InventoryItem() {
    }

    public InventoryItem(Integer id, String itemName, Double quantity, String unit, Double reorderLevel) {
        this.id = id;
        this.itemName = itemName;
        this.quantity = quantity;
        this.unit = unit;
        this.reorderLevel = reorderLevel;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getInventoryItemId() {
        return id;
    }

    public void setInventoryItemId(Integer inventoryItemId) {
        this.id = inventoryItemId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    // Compatibility getters/setters
    public String getIngredientName() {
        return itemName;
    }

    public void setIngredientName(String ingredientName) {
        this.itemName = ingredientName;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public Double getQuantityInStock() {
        return quantity;
    }

    public void setQuantityInStock(Double quantityInStock) {
        this.quantity = quantityInStock;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Double getReorderLevel() {
        return reorderLevel;
    }

    public void setReorderLevel(Double reorderLevel) {
        this.reorderLevel = reorderLevel;
    }

    public Double getReorderThreshold() {
        return reorderLevel;
    }

    public void setReorderThreshold(Double reorderThreshold) {
        this.reorderLevel = reorderThreshold;
    }
}
