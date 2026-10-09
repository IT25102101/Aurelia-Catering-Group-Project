package com.aurelia.catering.model;

import java.time.LocalDate;

/**
 * Model representing an event from the EVENT table in AureliaCatering2.
 * Columns: EventID, OrderID, EventDate, Location, GuestCount, EventType
 */
public class Event {

    private Integer eventId;
    private Integer orderId;
    private LocalDate eventDate;
    private String location;
    private Integer guestCount;
    private String eventType;
    public Event() {
    }

    public Event(Integer eventId, Integer orderId, LocalDate eventDate, String location, Integer guestCount, String eventType) {
        this.eventId = eventId;
        this.orderId = orderId;
        this.eventDate = eventDate;
        this.location = location;
        this.guestCount = guestCount;
        this.eventType = eventType;
    }

    public Integer getEventId() {
        return eventId;
    }

    public void setEventId(Integer eventId) {
        this.eventId = eventId;
    }

    public Integer getId() {
        return eventId;
    }

    public void setId(Integer id) {
        this.eventId = id;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
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

    // Compatibility getter/setter for venue
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
}
