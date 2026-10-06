package com.aurelia.catering.model;

/**
 * Model representing an order menu item assignment from table Order_Menu_Item in AureliaCatering2.
 * Columns: OrderID, MenuItemID, Quantity
 * Plus helper fields from JOIN with Menu_Item for frontend display.
 */
public class OrderMenuItem {

    private Integer orderId;
    private Integer menuItemId;
    private Integer quantity = 1;

    // Helper fields from JOIN with Menu_Item
    private String menuItemName;
    private Double price;
    private String category;

    public OrderMenuItem() {
    }

    public OrderMenuItem(Integer orderId, Integer menuItemId, Integer quantity) {
        this.orderId = orderId;
        this.menuItemId = menuItemId;
        this.quantity = quantity;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public Integer getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Integer menuItemId) {
        this.menuItemId = menuItemId;
    }

    public Integer getId() {
        return menuItemId;
    }

    public void setId(Integer id) {
        if (this.menuItemId == null) {
            this.menuItemId = id;
        }
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

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
