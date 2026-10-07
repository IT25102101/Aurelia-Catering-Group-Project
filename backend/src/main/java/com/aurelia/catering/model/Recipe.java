package com.aurelia.catering.model;

/**
 * POJO for the "recipes" table.
 * Links a menu item to an inventory ingredient with quantity required per guest.
 *
 * Formula: Required Quantity = Guest Count * quantityPerGuest
 *
 * Major function: Phase 3 — Recipes & Automatic Inventory Deduction
 */
public class Recipe {

    private Integer id;
    private Integer menuItemId;
    private Integer inventoryItemId;
    private Double quantityPerGuest;
    private String unit;

    // Additional display fields joined from menu_items and inventory_items
    private String menuItemName;
    private String ingredientName;
    private String inventoryUnit;
    private Double quantityInStock;

    public Recipe() {
    }

    public Recipe(Integer id, Integer menuItemId, Integer inventoryItemId, Double quantityPerGuest, String unit) {
        this.id = id;
        this.menuItemId = menuItemId;
        this.inventoryItemId = inventoryItemId;
        this.quantityPerGuest = quantityPerGuest;
        this.unit = unit;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Integer menuItemId) {
        this.menuItemId = menuItemId;
    }

    public Integer getInventoryItemId() {
        return inventoryItemId;
    }

    public void setInventoryItemId(Integer inventoryItemId) {
        this.inventoryItemId = inventoryItemId;
    }

    public Double getQuantityPerGuest() {
        return quantityPerGuest;
    }

    public void setQuantityPerGuest(Double quantityPerGuest) {
        this.quantityPerGuest = quantityPerGuest;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getMenuItemName() {
        return menuItemName;
    }

    public void setMenuItemName(String menuItemName) {
        this.menuItemName = menuItemName;
    }

    public String getIngredientName() {
        return ingredientName;
    }

    public void setIngredientName(String ingredientName) {
        this.ingredientName = ingredientName;
    }

    public String getInventoryUnit() {
        return inventoryUnit;
    }

    public void setInventoryUnit(String inventoryUnit) {
        this.inventoryUnit = inventoryUnit;
    }

    public Double getQuantityInStock() {
        return quantityInStock;
    }

    public void setQuantityInStock(Double quantityInStock) {
        this.quantityInStock = quantityInStock;
    }
}
