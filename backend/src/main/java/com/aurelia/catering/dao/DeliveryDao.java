package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.Delivery;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for Delivery Management.
 * Matches table Delivery in AureliaCatering2:
 * Columns: DeliveryID, OrderID, StaffID, DeliveryDate, DeliveryStatus, Location
 */
@Repository
public class DeliveryDao {

    // Helper method to normalize status strings to match CK_DELIVERY_STATUS
    private String normalizeStatus(String raw) {
        if (raw == null || raw.trim().isEmpty()) return "Pending";
        String s = raw.trim().toLowerCase().replace("_", " ").replace("-", " ");
        if (s.contains("out") || s.contains("transit")) return "Out for Delivery";
        if (s.contains("deliv")) return "Delivered";
        if (s.contains("cancel")) return "Cancelled";
        if (s.contains("assign")) return "Assigned";
        if (s.contains("pend")) return "Pending";
        return "Pending";
    }

    // ---------- READ (all rows) ----------
    public List<Delivery> getAll() {
        List<Delivery> list = new ArrayList<>();
        String sql = "SELECT DeliveryID, OrderID, StaffID, DeliveryDate, DeliveryStatus, Location FROM Delivery ORDER BY DeliveryID DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all deliveries: " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- READ (one row, by id) ----------
    public Delivery getById(int id) {
        String sql = "SELECT DeliveryID, OrderID, StaffID, DeliveryDate, DeliveryStatus, Location FROM Delivery WHERE DeliveryID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching delivery with id " + id + ": " + e.getMessage(), e);
        }
        return null;
    }

    // ---------- READ (by OrderID) ----------
    public Delivery getByOrderId(int orderId) {
        String sql = "SELECT DeliveryID, OrderID, StaffID, DeliveryDate, DeliveryStatus, Location FROM Delivery WHERE OrderID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching delivery for order " + orderId + ": " + e.getMessage(), e);
        }
        return null;
    }

    // ---------- READ (by StaffID) ----------
    public List<Delivery> getByStaffId(int staffId) {
        List<Delivery> list = new ArrayList<>();
        String sql = "SELECT DeliveryID, OrderID, StaffID, DeliveryDate, DeliveryStatus, Location FROM Delivery WHERE StaffID = ? ORDER BY DeliveryID DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, staffId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching deliveries for staff " + staffId + ": " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- CREATE ----------
    public Delivery create(Delivery delivery) {
        if (delivery.getOrderId() == null || delivery.getOrderId() <= 0) {
            throw new IllegalArgumentException("Valid OrderID is required to schedule a delivery.");
        }
        if (delivery.getStaffId() == null || delivery.getStaffId() <= 0) {
            throw new IllegalArgumentException("Valid StaffID is required for driver dispatch.");
        }

        String idSql = "SELECT ISNULL(MAX(DeliveryID), 0) + 1 FROM Delivery";
        String insertSql = "INSERT INTO Delivery (DeliveryID, OrderID, StaffID, DeliveryDate, DeliveryStatus, Location) VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            int newId = 1;
            if (delivery.getDeliveryId() != null && delivery.getDeliveryId() > 0) {
                newId = delivery.getDeliveryId();
            } else {
                try (PreparedStatement idStmt = conn.prepareStatement(idSql);
                     ResultSet rs = idStmt.executeQuery()) {
                    if (rs.next()) {
                        newId = rs.getInt(1);
                    }
                }
            }

            String status = normalizeStatus(delivery.getDeliveryStatus() != null ? delivery.getDeliveryStatus() : delivery.getStatus());
            LocalDate dDate = delivery.getDeliveryDate() != null ? delivery.getDeliveryDate() : LocalDate.now();
            String location = delivery.getLocation() != null && !delivery.getLocation().trim().isEmpty() 
                    ? delivery.getLocation().trim() 
                    : (delivery.getVenue() != null && !delivery.getVenue().trim().isEmpty() ? delivery.getVenue().trim() : "Venue TBD");

            try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                stmt.setInt(1, newId);
                stmt.setInt(2, delivery.getOrderId());
                stmt.setInt(3, delivery.getStaffId());
                stmt.setDate(4, Date.valueOf(dDate));
                stmt.setString(5, status);
                stmt.setString(6, location);
                stmt.executeUpdate();
            }

            delivery.setDeliveryId(newId);
            delivery.setDeliveryStatus(status);
            delivery.setDeliveryDate(dDate);
            delivery.setLocation(location);

        } catch (SQLException e) {
            throw new RuntimeException("Error creating delivery: " + e.getMessage(), e);
        }
        return delivery;
    }

    // ---------- UPDATE ----------
    public Delivery update(int id, Delivery delivery) {
        String sql = "UPDATE Delivery SET OrderID = ?, StaffID = ?, DeliveryDate = ?, DeliveryStatus = ?, Location = ? WHERE DeliveryID = ?";

        String status = normalizeStatus(delivery.getDeliveryStatus() != null ? delivery.getDeliveryStatus() : delivery.getStatus());
        LocalDate dDate = delivery.getDeliveryDate() != null ? delivery.getDeliveryDate() : LocalDate.now();
        String location = delivery.getLocation() != null && !delivery.getLocation().trim().isEmpty() 
                ? delivery.getLocation().trim() 
                : (delivery.getVenue() != null && !delivery.getVenue().trim().isEmpty() ? delivery.getVenue().trim() : "Venue TBD");

        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false); // Begin transaction

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, delivery.getOrderId());
                stmt.setInt(2, delivery.getStaffId());
                stmt.setDate(3, Date.valueOf(dDate));
                stmt.setString(4, status);
                stmt.setString(5, location);
                stmt.setInt(6, id);
                stmt.executeUpdate();
            }

            // If delivery is marked as 'Delivered', automatically transition linked Order.Status to 'Delivered'
            if ("Delivered".equalsIgnoreCase(status) && delivery.getOrderId() != null) {
                String updateOrderSql = "UPDATE [Order] SET Status = 'Delivered' WHERE OrderID = ? AND Status IN ('Ready for Delivery', 'Preparing', 'Confirmed')";
                try (PreparedStatement orderStmt = conn.prepareStatement(updateOrderSql)) {
                    orderStmt.setInt(1, delivery.getOrderId());
                    orderStmt.executeUpdate();
                }
            } else if ("Out for Delivery".equalsIgnoreCase(status) && delivery.getOrderId() != null) {
                String updateOrderSql = "UPDATE [Order] SET Status = 'Ready for Delivery' WHERE OrderID = ? AND Status IN ('Preparing', 'Confirmed')";
                try (PreparedStatement orderStmt = conn.prepareStatement(updateOrderSql)) {
                    orderStmt.setInt(1, delivery.getOrderId());
                    orderStmt.executeUpdate();
                }
            }

            conn.commit();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating delivery with id " + id + ": " + e.getMessage(), e);
        }

        delivery.setDeliveryId(id);
        delivery.setDeliveryStatus(status);
        delivery.setDeliveryDate(dDate);
        delivery.setLocation(location);
        return delivery;
    }

    // ---------- DELETE ----------
    public void delete(int id) {
        String sql = "DELETE FROM Delivery WHERE DeliveryID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting delivery with id " + id + ": " + e.getMessage(), e);
        }
    }

    /** Turns one row of the ResultSet into a Delivery object. */
    private Delivery mapRow(ResultSet rs) throws SQLException {
        Delivery delivery = new Delivery();
        delivery.setDeliveryId(rs.getInt("DeliveryID"));
        delivery.setOrderId(rs.getInt("OrderID"));
        delivery.setStaffId(rs.getInt("StaffID"));

        Date dDate = rs.getDate("DeliveryDate");
        if (dDate != null) {
            delivery.setDeliveryDate(dDate.toLocalDate());
        }

        delivery.setDeliveryStatus(rs.getString("DeliveryStatus"));
        delivery.setLocation(rs.getString("Location"));
        return delivery;
    }
}
