package com.aurelia.catering.model;

/**
 * Model representing a package menu item assignment from Package_Menu_Item table in AureliaCatering2.
 * Columns: PackageID, MenuItemID, Quantity
 * Plus helper fields from joins for frontend presentation.
 */
public class PackageMenuItem {

    private Integer packageId;
    private Integer menuItemId;
    private Integer quantity = 1;

    // Helper fields from JOIN with MenuItem and CateringPackage
    private String menuItemName;
    private String menuItemDescription;
    private Double menuItemPrice;
    private String menuItemCategory;
    private String packageName;

    public PackageMenuItem() {
    }

    public PackageMenuItem(Integer packageId, Integer menuItemId, Integer quantity) {
        this.packageId = packageId;
        this.menuItemId = menuItemId;
        this.quantity = quantity;
    }

    // ID helper for frontend compatibility (returns menuItemId)
    public Integer getId() {
        return menuItemId;
    }

    public void setId(Integer id) {
        if (this.menuItemId == null) {
            this.menuItemId = id;
        }
    }

    public Integer getPackageId() {
        return packageId;
    }

    public void setPackageId(Integer packageId) {
        this.packageId = packageId;
    }

    public Integer getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Integer menuItemId) {
        this.menuItemId = menuItemId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getMenuItemName() {
        return menuItemName;
    }

    public void setMenuItemName(String menuItemName) {
        this.menuItemName = menuItemName;
    }

    public String getMenuItemDescription() {
        return menuItemDescription;
    }

    public void setMenuItemDescription(String menuItemDescription) {
        this.menuItemDescription = menuItemDescription;
    }

    public Double getMenuItemPrice() {
        return menuItemPrice;
    }

    public void setMenuItemPrice(Double menuItemPrice) {
        this.menuItemPrice = menuItemPrice;
    }

    public String getMenuItemCategory() {
        return menuItemCategory;
    }

    public void setMenuItemCategory(String menuItemCategory) {
        this.menuItemCategory = menuItemCategory;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }
}
