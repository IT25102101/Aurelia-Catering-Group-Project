package com.aurelia.catering.model;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO representing the total inventory readiness check for an order.
 * If canConfirm is false, the manager must not confirm the order.
 */
public class InventoryCheckResult {

    private Integer orderId;
    private Integer guestCount;
    private String packageName;
    private boolean canConfirm;
    private String message;
    private List<InventoryCheckItem> items = new ArrayList<>();

    public InventoryCheckResult() {
    }

    public InventoryCheckResult(Integer orderId, Integer guestCount, String packageName, boolean canConfirm, String message) {
        this.orderId = orderId;
        this.guestCount = guestCount;
        this.packageName = packageName;
        this.canConfirm = canConfirm;
        this.message = message;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public boolean isCanConfirm() {
        return canConfirm;
    }

    public void setCanConfirm(boolean canConfirm) {
        this.canConfirm = canConfirm;
    }

    // Alias methods for Part 5 REST API JSON format
    public boolean isInventoryAvailable() {
        return canConfirm;
    }

    public void setInventoryAvailable(boolean inventoryAvailable) {
        this.canConfirm = inventoryAvailable;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<InventoryCheckItem> getItems() {
        return items;
    }

    public void setItems(List<InventoryCheckItem> items) {
        this.items = items;
    }
}
