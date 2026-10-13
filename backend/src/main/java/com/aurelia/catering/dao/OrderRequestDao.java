package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.OrderRequest;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for OrderRequest.
 * Matches table Order_Request in AureliaCatering2:
 * Columns: RequestID, OrderID, RequestType, RequestDate, Reason, RequestedEventDate, RequestStatus, ReviewedByStaffID, ReviewDate, Response
 *
 * DAO pattern: all SQL for customer requests lives here (PreparedStatement + pooled connection).
 * New ids are generated as MAX(RequestID) + 1.
 */
@Repository
public class OrderRequestDao {

    // ---------- READ (all requests) ----------
    public List<OrderRequest> getAllRequests() {
        List<OrderRequest> list = new ArrayList<>();
        String sql = "SELECT RequestID, OrderID, RequestType, RequestDate, Reason, RequestedEventDate, RequestStatus, ReviewedByStaffID, ReviewDate, Response FROM Order_Request ORDER BY RequestID DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all order requests: " + e.getMessage(), e);
        }
        return list;
    }

    public List<OrderRequest> getAll() {
        return getAllRequests();
    }

    // ---------- READ (by RequestID) ----------
    public OrderRequest getRequestById(int requestId) {
        String sql = "SELECT RequestID, OrderID, RequestType, RequestDate, Reason, RequestedEventDate, RequestStatus, ReviewedByStaffID, ReviewDate, Response FROM Order_Request WHERE RequestID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, requestId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching order request with id " + requestId + ": " + e.getMessage(), e);
        }
        return null;
    }

    public OrderRequest getById(int id) {
        return getRequestById(id);
    }

    // ---------- READ (by OrderID) ----------
    public List<OrderRequest> getRequestsByOrderId(int orderId) {
        List<OrderRequest> list = new ArrayList<>();
        String sql = "SELECT RequestID, OrderID, RequestType, RequestDate, Reason, RequestedEventDate, RequestStatus, ReviewedByStaffID, ReviewDate, Response FROM Order_Request WHERE OrderID = ? ORDER BY RequestDate DESC, RequestID DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching requests for order " + orderId + ": " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- CREATE ----------
    public OrderRequest createRequest(OrderRequest request) {
        int newId = 1;
        String idSql = "SELECT ISNULL(MAX(RequestID), 0) + 1 FROM Order_Request";
        String insertSql = "INSERT INTO Order_Request (RequestID, OrderID, RequestType, RequestDate, Reason, RequestedEventDate, RequestStatus, ReviewedByStaffID, ReviewDate, Response) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            if (request.getRequestId() != null && request.getRequestId() > 0) {
                newId = request.getRequestId();
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
                stmt.setInt(2, request.getOrderId());
                // Validation/defaults: type falls back to Cancellation, status to Pending. The database
                // CHECK constraints only accept Cancellation/Rescheduling and Pending/Approved/Rejected.
                stmt.setString(3, request.getRequestType() != null ? request.getRequestType() : "Cancellation");

                LocalDateTime reqDate = request.getRequestDate() != null ? request.getRequestDate() : LocalDateTime.now();
                stmt.setTimestamp(4, Timestamp.valueOf(reqDate));

                stmt.setString(5, request.getReason());

                if (request.getRequestedEventDate() != null) {
                    stmt.setDate(6, Date.valueOf(request.getRequestedEventDate()));
                } else {
                    stmt.setNull(6, Types.DATE);
                }

                String status = request.getRequestStatus() != null && !request.getRequestStatus().trim().isEmpty() ? request.getRequestStatus() : "Pending";
                stmt.setString(7, status);

                if (request.getReviewedByStaffId() != null) {
                    stmt.setInt(8, request.getReviewedByStaffId());
                } else {
                    stmt.setNull(8, Types.INTEGER);
                }

                if (request.getReviewDate() != null) {
                    stmt.setTimestamp(9, Timestamp.valueOf(request.getReviewDate()));
                } else {
                    stmt.setNull(9, Types.TIMESTAMP);
                }

                stmt.setString(10, request.getResponse());

                stmt.executeUpdate();
            }

            request.setRequestId(newId);
        } catch (SQLException e) {
            // Exception handling: a rejected value (e.g. unknown OrderID -> foreign key error) surfaces here
            throw new RuntimeException("Error creating order request: " + e.getMessage(), e);
        }
        return request;
    }

    public OrderRequest create(OrderRequest request) {
        return createRequest(request);
    }

    // ---------- UPDATE ----------
    public OrderRequest updateRequest(OrderRequest request) {
        String sql = "UPDATE Order_Request SET OrderID = ?, RequestType = ?, RequestDate = ?, Reason = ?, RequestedEventDate = ?, RequestStatus = ?, ReviewedByStaffID = ?, ReviewDate = ?, Response = ? WHERE RequestID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, request.getOrderId());
            stmt.setString(2, request.getRequestType());

            LocalDateTime reqDate = request.getRequestDate() != null ? request.getRequestDate() : LocalDateTime.now();
            stmt.setTimestamp(3, Timestamp.valueOf(reqDate));

            stmt.setString(4, request.getReason());

            if (request.getRequestedEventDate() != null) {
                stmt.setDate(5, Date.valueOf(request.getRequestedEventDate()));
            } else {
                stmt.setNull(5, Types.DATE);
            }

            stmt.setString(6, request.getRequestStatus());

            if (request.getReviewedByStaffId() != null) {
                stmt.setInt(7, request.getReviewedByStaffId());
            } else {
                stmt.setNull(7, Types.INTEGER);
            }

            if (request.getReviewDate() != null) {
                stmt.setTimestamp(8, Timestamp.valueOf(request.getReviewDate()));
            } else {
                stmt.setNull(8, Types.TIMESTAMP);
            }

            stmt.setString(9, request.getResponse());
            stmt.setInt(10, request.getRequestId());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating order request " + request.getRequestId() + ": " + e.getMessage(), e);
        }
        return request;
    }

    public OrderRequest update(int id, OrderRequest request) {
        request.setRequestId(id);
        return updateRequest(request);
    }

    // ---------- DELETE ----------
    public void deleteRequest(int requestId) {
        String sql = "DELETE FROM Order_Request WHERE RequestID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, requestId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting order request " + requestId + ": " + e.getMessage(), e);
        }
    }

    public void delete(int id) {
        deleteRequest(id);
    }

    /** Helper method to map ResultSet row to OrderRequest object */
    private OrderRequest mapRow(ResultSet rs) throws SQLException {
        OrderRequest request = new OrderRequest();
        request.setRequestId(rs.getInt("RequestID"));
        request.setOrderId(rs.getInt("OrderID"));
        request.setRequestType(rs.getString("RequestType"));

        Timestamp reqTs = rs.getTimestamp("RequestDate");
        request.setRequestDate(reqTs != null ? reqTs.toLocalDateTime() : null);

        request.setReason(rs.getString("Reason"));

        Date eventDate = rs.getDate("RequestedEventDate");
        request.setRequestedEventDate(eventDate != null ? eventDate.toLocalDate() : null);

        request.setRequestStatus(rs.getString("RequestStatus"));
        request.setReviewedByStaffId(rs.getObject("ReviewedByStaffID") != null ? rs.getInt("ReviewedByStaffID") : null);

        Timestamp revTs = rs.getTimestamp("ReviewDate");
        request.setReviewDate(revTs != null ? revTs.toLocalDateTime() : null);

        request.setResponse(rs.getString("Response"));

        return request;
    }
}
