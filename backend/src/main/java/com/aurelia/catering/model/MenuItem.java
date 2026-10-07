package com.aurelia.catering.model;

/**
 * Model representing a menu item from the MenuItem table in AureliaCatering2.
 * Columns: MenuItemID, ItemName, Description, Price, Category
 */
public class MenuItem {

    private Integer id;
    private String name;
    private String description;
    private Double price;
    private String category;

    public MenuItem() {
    }

    public MenuItem(Integer id, String name, String description, Double price, String category) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getMenuItemId() {
        return id;
    }

    public void setMenuItemId(Integer menuItemId) {
        this.id = menuItemId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getItemName() {
        return name;
    }

    public void setItemName(String itemName) {
        this.name = itemName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
