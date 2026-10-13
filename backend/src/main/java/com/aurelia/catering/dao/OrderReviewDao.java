package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.OrderReview;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for OrderReview.
 * Matches table Order_Review in AureliaCatering2:
 * Columns: OrderReviewID, OrderID, StaffID, ReviewDate, ReviewStatus, Comments
 *
 * DAO pattern: all SQL for staff order reviews lives here (PreparedStatement + pooled connection).
 * New ids are generated as MAX(OrderReviewID) + 1.
 */
@Repository
public class OrderReviewDao {

    // ---------- READ (all reviews) ----------
    public List<OrderReview> getAllReviews() {
        List<OrderReview> list = new ArrayList<>();
        String sql = "SELECT OrderReviewID, OrderID, StaffID, ReviewDate, ReviewStatus, Comments FROM Order_Review ORDER BY OrderReviewID DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all order reviews: " + e.getMessage(), e);
        }
        return list;
    }

    public List<OrderReview> getAll() {
        return getAllReviews();
    }

    // ---------- READ (by OrderReviewID) ----------
    public OrderReview getReviewById(int orderReviewId) {
        String sql = "SELECT OrderReviewID, OrderID, StaffID, ReviewDate, ReviewStatus, Comments FROM Order_Review WHERE OrderReviewID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, orderReviewId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching order review with id " + orderReviewId + ": " + e.getMessage(), e);
        }
        return null;
    }

    public OrderReview getById(int id) {
        return getReviewById(id);
    }

    // ---------- READ (by OrderID) ----------
    public List<OrderReview> getReviewsByOrderId(int orderId) {
        List<OrderReview> list = new ArrayList<>();
        String sql = "SELECT OrderReviewID, OrderID, StaffID, ReviewDate, ReviewStatus, Comments FROM Order_Review WHERE OrderID = ? ORDER BY ReviewDate DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching reviews for order " + orderId + ": " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- CREATE ----------
    public OrderReview createReview(OrderReview review) {
        int newId = 1;
        String idSql = "SELECT ISNULL(MAX(OrderReviewID), 0) + 1 FROM Order_Review";
        String insertSql = "INSERT INTO Order_Review (OrderReviewID, OrderID, StaffID, ReviewDate, ReviewStatus, Comments) VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            if (review.getOrderReviewId() != null && review.getOrderReviewId() > 0) {
                newId = review.getOrderReviewId();
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
                stmt.setInt(2, review.getOrderId());
                stmt.setInt(3, review.getStaffId());

                LocalDateTime reviewDate = review.getReviewDate() != null ? review.getReviewDate() : LocalDateTime.now();
                stmt.setTimestamp(4, Timestamp.valueOf(reviewDate));

                // Validation/defaults: date defaults to now. The database CHECK constraint only accepts
                // Approved, Rejected or Changes Requested.
                String status = review.getReviewStatus() != null && !review.getReviewStatus().trim().isEmpty() ? review.getReviewStatus() : "Approved";
                stmt.setString(5, status);
                stmt.setString(6, review.getComments());

                stmt.executeUpdate();
            }

            review.setOrderReviewId(newId);
        } catch (SQLException e) {
            // Exception handling: a rejected value (e.g. unknown StaffID -> foreign key error) surfaces here
            throw new RuntimeException("Error creating order review: " + e.getMessage(), e);
        }
        return review;
    }

    public OrderReview create(OrderReview review) {
        return createReview(review);
    }

    // ---------- UPDATE ----------
    public OrderReview updateReview(OrderReview review) {
        String sql = "UPDATE Order_Review SET OrderID = ?, StaffID = ?, ReviewDate = ?, ReviewStatus = ?, Comments = ? WHERE OrderReviewID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, review.getOrderId());
            stmt.setInt(2, review.getStaffId());

            LocalDateTime reviewDate = review.getReviewDate() != null ? review.getReviewDate() : LocalDateTime.now();
            stmt.setTimestamp(3, Timestamp.valueOf(reviewDate));

            stmt.setString(4, review.getReviewStatus());
            stmt.setString(5, review.getComments());
            stmt.setInt(6, review.getOrderReviewId());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating order review " + review.getOrderReviewId() + ": " + e.getMessage(), e);
        }
        return review;
    }

    public OrderReview update(int id, OrderReview review) {
        review.setOrderReviewId(id);
        return updateReview(review);
    }

    // ---------- DELETE ----------
    public void deleteReview(int orderReviewId) {
        String sql = "DELETE FROM Order_Review WHERE OrderReviewID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, orderReviewId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting order review " + orderReviewId + ": " + e.getMessage(), e);
        }
    }

    public void delete(int id) {
        deleteReview(id);
    }

    /** Helper method to map ResultSet row to OrderReview object */
    private OrderReview mapRow(ResultSet rs) throws SQLException {
        OrderReview review = new OrderReview();
        review.setOrderReviewId(rs.getInt("OrderReviewID"));
        review.setOrderId(rs.getInt("OrderID"));
        review.setStaffId(rs.getInt("StaffID"));

        Timestamp ts = rs.getTimestamp("ReviewDate");
        review.setReviewDate(ts != null ? ts.toLocalDateTime() : null);

        review.setReviewStatus(rs.getString("ReviewStatus"));
        review.setComments(rs.getString("Comments"));

        return review;
    }
}
