package com.aurelia.catering.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Transfer Object for guest catering booking submissions.
 * Combines Customer, Order, Event, and selected Menu Item data into a single request.
 *
 * DTO pattern: carries the whole booking form in one object, so the public page makes a single
 * API call and OrderDao.createGuestOrder saves everything in one transaction.
 */
public class GuestOrderRequest {

    // Customer info
    private String name;
    private String phone;
    private String email;

    // Order info
    private Integer packageId;
    private String specialRequests;

    // Event info
    private LocalDate eventDate;
    private String location;
    private Integer guestCount;
    private String eventType;
    private String startTime;

    // Selected menu items (for Order_Menu_Item)
    // OOP - composition: a booking "has a" list of items; the list always starts empty, never null
    private List<GuestOrderItem> menuItems = new ArrayList<>();

    public GuestOrderRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCustomerName() {
        return name;
    }

    public void setCustomerName(String customerName) {
        this.name = customerName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getPackageId() {
        return packageId;
    }

    public void setPackageId(Integer packageId) {
        this.packageId = packageId;
    }

    public String getSpecialRequests() {
        return specialRequests;
    }

    public void setSpecialRequests(String specialRequests) {
        this.specialRequests = specialRequests;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getVenue() {
        return location;
    }

    public void setVenue(String venue) {
        this.location = venue;
    }

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public List<GuestOrderItem> getMenuItems() {
        return menuItems;
    }

    // OOP - encapsulation: the setter protects the object's state by replacing null with an empty list
    public void setMenuItems(List<GuestOrderItem> menuItems) {
        this.menuItems = menuItems != null ? menuItems : new ArrayList<>();
    }

    /**
     * Inner helper class representing a single menu item selection in the guest booking.
     * OOP - static nested class: it only exists to serve GuestOrderRequest, so it is kept inside it.
     */
    public static class GuestOrderItem {
        private Integer menuItemId;
        private Integer quantity = 1;

        public GuestOrderItem() {
        }

        public GuestOrderItem(Integer menuItemId, Integer quantity) {
            this.menuItemId = menuItemId;
            this.quantity = quantity;
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
    }
}
