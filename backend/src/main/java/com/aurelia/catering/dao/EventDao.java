package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.Event;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for Event.
 * Matches table [Event] in AureliaCatering2:
 * Columns: EventID, OrderID, EventDate, Location, GuestCount, EventType
 */
@Repository
public class EventDao {

    // ---------- READ (all events) ----------
    public List<Event> getAllEvents() {
        List<Event> list = new ArrayList<>();
        String sql = "SELECT EventID, OrderID, EventDate, Location, GuestCount, EventType FROM [Event]";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all events: " + e.getMessage(), e);
        }
        return list;
    }

    public List<Event> getAll() {
        return getAllEvents();
    }

    // ---------- READ (by EventID) ----------
    public Event getEventById(int eventId) {
        String sql = "SELECT EventID, OrderID, EventDate, Location, GuestCount, EventType FROM [Event] WHERE EventID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, eventId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching event with id " + eventId + ": " + e.getMessage(), e);
        }
        return null;
    }

    public Event getById(int id) {
        return getEventById(id);
    }

    // ---------- READ (by OrderID) ----------
    public Event getEventByOrderId(int orderId) {
        String sql = "SELECT EventID, OrderID, EventDate, Location, GuestCount, EventType FROM [Event] WHERE OrderID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching event for order " + orderId + ": " + e.getMessage(), e);
        }
        return null;
    }

    // ---------- CREATE ----------
    public Event createEvent(Event event) {
        int newId = 1;
        String idSql = "SELECT ISNULL(MAX(EventID), 0) + 1 FROM [Event]";
        String insertSql = "INSERT INTO [Event] (EventID, OrderID, EventDate, Location, GuestCount, EventType) VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            if (event.getEventId() != null && event.getEventId() > 0) {
                newId = event.getEventId();
            } else {
                try (PreparedStatement idStmt = conn.prepareStatement(idSql);
                     ResultSet rs = idStmt.executeQuery()) {
                    if (rs.next()) {
                        newId = rs.getInt(1);
                    }
                }
            }

            try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                stmt.setInt(1, newId);
                stmt.setInt(2, event.getOrderId());

                LocalDate eventDate = event.getEventDate() != null ? event.getEventDate() : LocalDate.now();
                stmt.setDate(3, Date.valueOf(eventDate));

                stmt.setString(4, event.getLocation() != null ? event.getLocation() : "");
                stmt.setInt(5, event.getGuestCount() != null ? event.getGuestCount() : 0);
                stmt.setString(6, event.getEventType() != null ? event.getEventType() : "General");

                stmt.executeUpdate();
            }

            event.setEventId(newId);
        } catch (SQLException e) {
            throw new RuntimeException("Error creating event: " + e.getMessage(), e);
        }
        return event;
    }

    public Event create(Event event) {
        return createEvent(event);
    }

    // ---------- UPDATE ----------
    public Event updateEvent(Event event) {
        String sql = "UPDATE [Event] SET OrderID = ?, EventDate = ?, Location = ?, GuestCount = ?, EventType = ? WHERE EventID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, event.getOrderId());

            LocalDate eventDate = event.getEventDate() != null ? event.getEventDate() : LocalDate.now();
            stmt.setDate(2, Date.valueOf(eventDate));

            stmt.setString(3, event.getLocation() != null ? event.getLocation() : "");
            stmt.setInt(4, event.getGuestCount() != null ? event.getGuestCount() : 0);
            stmt.setString(5, event.getEventType() != null ? event.getEventType() : "General");
            stmt.setInt(6, event.getEventId());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating event with id " + event.getEventId() + ": " + e.getMessage(), e);
        }
        return event;
    }

    public Event update(int id, Event event) {
        event.setEventId(id);
        return updateEvent(event);
    }

    // ---------- DELETE ----------
    public void deleteEvent(int eventId) {
        String sql = "DELETE FROM [Event] WHERE EventID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, eventId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting event with id " + eventId + ": " + e.getMessage(), e);
        }
    }

    public void delete(int id) {
        deleteEvent(id);
    }

    /** Helper method to map ResultSet row to Event object */
    private Event mapRow(ResultSet rs) throws SQLException {
        Event event = new Event();
        event.setEventId(rs.getInt("EventID"));
        event.setOrderId(rs.getInt("OrderID"));

        Date eventDate = rs.getDate("EventDate");
        event.setEventDate(eventDate != null ? eventDate.toLocalDate() : null);

        event.setLocation(rs.getString("Location"));
        event.setGuestCount(rs.getInt("GuestCount"));
        event.setEventType(rs.getString("EventType"));

        return event;
    }
}
