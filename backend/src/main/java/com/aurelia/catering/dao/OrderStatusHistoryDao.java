package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.OrderStatusHistory;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for OrderStatusHistory.
 * Matches table Order_Status_History in AureliaCatering2:
 * Columns: StatusHistoryID, OrderID, Status, ChangedDate, ChangedByStaffID
 *
 * DAO pattern: all SQL for the status audit trail lives here (PreparedStatement + pooled connection).
 * New ids are generated as MAX(StatusHistoryID) + 1.
 */
@Repository
public class OrderStatusHistoryDao {

    // ---------- READ (all history) ----------
    public List<OrderStatusHistory> getAllStatusHistory() {
        List<OrderStatusHistory> list = new ArrayList<>();
        String sql = "SELECT StatusHistoryID, OrderID, Status, ChangedDate, ChangedByStaffID FROM Order_Status_History ORDER BY StatusHistoryID DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all order status history: " + e.getMessage(), e);
        }
        return list;
    }

    public List<OrderStatusHistory> getAll() {
        return getAllStatusHistory();
    }

    // ---------- READ (by StatusHistoryID) ----------
    public OrderStatusHistory getStatusHistoryById(int statusHistoryId) {
        String sql = "SELECT StatusHistoryID, OrderID, Status, ChangedDate, ChangedByStaffID FROM Order_Status_History WHERE StatusHistoryID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, statusHistoryId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching status history with id " + statusHistoryId + ": " + e.getMessage(), e);
        }
        return null;
    }

    public OrderStatusHistory getById(int id) {
        return getStatusHistoryById(id);
    }

    // ---------- READ (by OrderID) ----------
    public List<OrderStatusHistory> getStatusHistoryByOrderId(int orderId) {
        List<OrderStatusHistory> list = new ArrayList<>();
        String sql = "SELECT StatusHistoryID, OrderID, Status, ChangedDate, ChangedByStaffID FROM Order_Status_History WHERE OrderID = ? ORDER BY ChangedDate ASC, StatusHistoryID ASC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching status history for order " + orderId + ": " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- CREATE ----------
    public OrderStatusHistory createStatusHistory(OrderStatusHistory history) {
        int newId = 1;
        String idSql = "SELECT ISNULL(MAX(StatusHistoryID), 0) + 1 FROM Order_Status_History";
        String insertSql = "INSERT INTO Order_Status_History (StatusHistoryID, OrderID, Status, ChangedDate, ChangedByStaffID) VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            if (history.getStatusHistoryId() != null && history.getStatusHistoryId() > 0) {
                newId = history.getStatusHistoryId();
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
                stmt.setInt(2, history.getOrderId());
                stmt.setString(3, history.getStatus());

                // Validation/defaults: if no date is given, the time of the change is recorded automatically
                LocalDateTime changedDate = history.getChangedDate() != null ? history.getChangedDate() : LocalDateTime.now();
                stmt.setTimestamp(4, Timestamp.valueOf(changedDate));

                if (history.getChangedByStaffId() != null) {
                    stmt.setInt(5, history.getChangedByStaffId());
                } else {
                    stmt.setNull(5, Types.INTEGER);
                }

                stmt.executeUpdate();
            }

            history.setStatusHistoryId(newId);
        } catch (SQLException e) {
            // Exception handling: a rejected value (e.g. unknown OrderID -> foreign key error) surfaces here
            throw new RuntimeException("Error creating order status history: " + e.getMessage(), e);
        }
        return history;
    }

    public OrderStatusHistory create(OrderStatusHistory history) {
        return createStatusHistory(history);
    }

    // ---------- DELETE ----------
    public void deleteStatusHistory(int statusHistoryId) {
        String sql = "DELETE FROM Order_Status_History WHERE StatusHistoryID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, statusHistoryId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting status history with id " + statusHistoryId + ": " + e.getMessage(), e);
        }
    }

    public void delete(int id) {
        deleteStatusHistory(id);
    }

    /** Helper method to map ResultSet row to OrderStatusHistory object */
    private OrderStatusHistory mapRow(ResultSet rs) throws SQLException {
        OrderStatusHistory history = new OrderStatusHistory();
        history.setStatusHistoryId(rs.getInt("StatusHistoryID"));
        history.setOrderId(rs.getInt("OrderID"));
        history.setStatus(rs.getString("Status"));

        Timestamp ts = rs.getTimestamp("ChangedDate");
        history.setChangedDate(ts != null ? ts.toLocalDateTime() : null);

        history.setChangedByStaffId(rs.getObject("ChangedByStaffID") != null ? rs.getInt("ChangedByStaffID") : null);

        return history;
    }
}
