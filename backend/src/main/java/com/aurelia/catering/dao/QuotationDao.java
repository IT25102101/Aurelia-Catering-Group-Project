package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.Quotation;
import com.aurelia.catering.model.QuotationItem;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for Quotation.
 * Matches table Quotation in AureliaCatering2:
 * Columns: QuotationID, OrderID, QuotationDate, TotalAmount, Status
 */
@Repository
public class QuotationDao {

    // ---------- READ (all quotations) ----------
    public List<Quotation> getAllQuotations() {
        List<Quotation> list = new ArrayList<>();
        String sql = "SELECT QuotationID, OrderID, QuotationDate, TotalAmount, Status FROM Quotation ORDER BY QuotationID DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all quotations: " + e.getMessage(), e);
        }
        return list;
    }

    public List<Quotation> getAll() {
        return getAllQuotations();
    }

    // ---------- READ (by QuotationID) ----------
    public Quotation getQuotationById(int quotationId) {
        String sql = "SELECT QuotationID, OrderID, QuotationDate, TotalAmount, Status FROM Quotation WHERE QuotationID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, quotationId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching quotation with id " + quotationId + ": " + e.getMessage(), e);
        }
        return null;
    }

    public Quotation getById(int id) {
        return getQuotationById(id);
    }

    // ---------- READ (by OrderID) ----------
    public Quotation getQuotationByOrderId(int orderId) {
        String sql = "SELECT QuotationID, OrderID, QuotationDate, TotalAmount, Status FROM Quotation WHERE OrderID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching quotation for order " + orderId + ": " + e.getMessage(), e);
        }
        return null;
    }

    // ---------- READ (by CustomerID, excluding Draft) ----------
    public List<Quotation> getQuotationsByCustomerId(int customerId) {
        List<Quotation> list = new ArrayList<>();
        String sql = "SELECT q.QuotationID, q.OrderID, q.QuotationDate, q.TotalAmount, q.Status " +
                     "FROM Quotation q " +
                     "INNER JOIN [Order] o ON q.OrderID = o.OrderID " +
                     "WHERE o.CustomerID = ? AND q.Status <> 'Draft' " +
                     "ORDER BY q.QuotationID DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, customerId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching quotations for customer " + customerId + ": " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- GET CUSTOMER ID FOR QUOTATION ----------
    public Integer getQuotationCustomerId(int quotationId) {
        String sql = "SELECT o.CustomerID FROM Quotation q INNER JOIN [Order] o ON q.OrderID = o.OrderID WHERE q.QuotationID = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, quotationId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching customer for quotation " + quotationId + ": " + e.getMessage(), e);
        }
        return null;
    }

    // ---------- VERIFY CUSTOMER OWNERSHIP ----------
    public boolean isCustomerQuotationOwner(int quotationId, int customerId) {
        Integer ownerId = getQuotationCustomerId(quotationId);
        return ownerId != null && ownerId.intValue() == customerId;
    }

    // ---------- ATOMIC ACCEPT/REJECT WITH ORDER STATUS UPDATE (TRANSACTION) ----------
    /**
     * Atomically updates Quotation.Status AND Order.Status in a single JDBC transaction.
     *
     * Acceptance:  Quotation Sent → Accepted  |  Order Quotation Ready → Payment Pending  |  sets CustomerConfirmedDate
     * Rejection:   Quotation Sent → Rejected  |  Order Quotation Ready → Rejected
     *
     * The existing DB trigger (trg_Order_StatusHistory) records the Order status change automatically.
     *
     * @return the updated Quotation object
     * @throws RuntimeException with a descriptive message on any validation or DB failure
     */
    public Quotation acceptOrRejectWithOrderUpdate(int quotationId, int customerId, String targetStatus) {
        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false); // Begin atomic transaction

            // 1. Fetch current Quotation state inside transaction
            Quotation quotation;
            String fetchQuotSql = "SELECT QuotationID, OrderID, QuotationDate, TotalAmount, Status FROM Quotation WHERE QuotationID = ?";
            try (PreparedStatement ps = conn.prepareStatement(fetchQuotSql)) {
                ps.setInt(1, quotationId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        throw new RuntimeException("NOT_FOUND: Quotation #" + quotationId + " does not exist.");
                    }
                    quotation = mapRow(rs);
                }
            }

            // 2. Verify ownership: Quotation -> Order -> CustomerID
            int orderIdForQuot = quotation.getOrderId();
            String ownerSql = "SELECT CustomerID, Status FROM [Order] WHERE OrderID = ?";
            int ownerCustomerId;
            String currentOrderStatus;
            try (PreparedStatement ps = conn.prepareStatement(ownerSql)) {
                ps.setInt(1, orderIdForQuot);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        throw new RuntimeException("NOT_FOUND: Related Order #" + orderIdForQuot + " not found.");
                    }
                    ownerCustomerId = rs.getInt("CustomerID");
                    currentOrderStatus = rs.getString("Status");
                }
            }
            if (ownerCustomerId != customerId) {
                throw new RuntimeException("FORBIDDEN: Quotation #" + quotationId + " does not belong to customer #" + customerId + ".");
            }

            // 3. Validate Quotation current status is 'Sent'
            String currentQuotStatus = quotation.getStatus();
            if ("Draft".equalsIgnoreCase(currentQuotStatus)) {
                throw new RuntimeException("INVALID: Cannot respond — Quotation #" + quotationId + " is still in Draft state.");
            }
            if (!"Sent".equalsIgnoreCase(currentQuotStatus)) {
                throw new RuntimeException("INVALID: Cannot respond — Quotation #" + quotationId + " is already '" + currentQuotStatus + "'.");
            }

            // 4. Validate Order current status is 'Quotation Ready'
            if (!"Quotation Ready".equalsIgnoreCase(currentOrderStatus)) {
                throw new RuntimeException("INVALID: Cannot respond — Order #" + orderIdForQuot + " is in status '" + currentOrderStatus + "', expected 'Quotation Ready'.");
            }

            // 5. Determine the target Order status
            String targetOrderStatus;
            if ("Accepted".equalsIgnoreCase(targetStatus)) {
                targetOrderStatus = "Payment Pending";
            } else if ("Rejected".equalsIgnoreCase(targetStatus)) {
                targetOrderStatus = "Rejected";
            } else {
                throw new RuntimeException("INVALID: Target status must be 'Accepted' or 'Rejected', got: '" + targetStatus + "'.");
            }

            // 6. Update Quotation.Status
            String updateQuotSql = "UPDATE Quotation SET Status = ? WHERE QuotationID = ?";
            try (PreparedStatement ps = conn.prepareStatement(updateQuotSql)) {
                ps.setString(1, targetStatus);
                ps.setInt(2, quotationId);
                ps.executeUpdate();
            }

            // 7. Update Order.Status (and CustomerConfirmedDate if Accepted)
            String updateOrderSql;
            if ("Accepted".equalsIgnoreCase(targetStatus)) {
                updateOrderSql = "UPDATE [Order] SET Status = ?, CustomerConfirmedDate = CAST(GETDATE() AS DATE) WHERE OrderID = ?";
            } else {
                updateOrderSql = "UPDATE [Order] SET Status = ? WHERE OrderID = ?";
            }
            try (PreparedStatement ps = conn.prepareStatement(updateOrderSql)) {
                ps.setString(1, targetOrderStatus);
                ps.setInt(2, orderIdForQuot);
                ps.executeUpdate();
                // NOTE: trg_Order_StatusHistory fires here automatically — no manual history insert needed.
            }

            conn.commit(); // Commit both updates atomically

            quotation.setStatus(targetStatus);
            return quotation;

        } catch (SQLException e) {
            if (conn != null) { try { conn.rollback(); } catch (SQLException ignored) {} }
            throw new RuntimeException("Transaction failed during quotation response: " + e.getMessage(), e);
        } catch (RuntimeException e) {
            if (conn != null) { try { conn.rollback(); } catch (SQLException ignored) {} }
            throw e; // Re-throw validation/business exceptions as-is
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ignored) {}
            }
        }
    }

    // ---------- CREATE ----------
    public Quotation createQuotation(Quotation quotation) {
        int newId = 1;
        String idSql = "SELECT ISNULL(MAX(QuotationID), 0) + 1 FROM Quotation";
        String insertSql = "INSERT INTO Quotation (QuotationID, OrderID, QuotationDate, TotalAmount, Status) VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            if (quotation.getQuotationId() != null && quotation.getQuotationId() > 0) {
                newId = quotation.getQuotationId();
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
                stmt.setInt(2, quotation.getOrderId());

                LocalDateTime qDate = quotation.getQuotationDate() != null ? quotation.getQuotationDate() : LocalDateTime.now();
                stmt.setTimestamp(3, Timestamp.valueOf(qDate));

                BigDecimal amount = quotation.getTotalAmount() != null ? quotation.getTotalAmount() : BigDecimal.ZERO;
                stmt.setBigDecimal(4, amount);

                String status = quotation.getStatus() != null && !quotation.getStatus().trim().isEmpty() ? quotation.getStatus() : "Draft";
                stmt.setString(5, status);

                stmt.executeUpdate();
            }

            quotation.setQuotationId(newId);
        } catch (SQLException e) {
            throw new RuntimeException("Error creating quotation: " + e.getMessage(), e);
        }
        return quotation;
    }

    // ---------- CHECK IF QUOTATION EXISTS FOR ORDER ----------
    public boolean quotationExistsForOrder(int orderId) {
        String sql = "SELECT COUNT(1) FROM Quotation WHERE OrderID = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error checking quotation existence for order " + orderId + ": " + e.getMessage(), e);
        }
        return false;
    }

    // ---------- ATOMIC CREATE QUOTATION WITH ITEMS (TRANSACTION) ----------
    public Quotation createQuotationWithItems(Quotation quotation, List<QuotationItem> items) {
        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false); // Begin ACID Transaction

            // Check duplicate
            String checkSql = "SELECT COUNT(1) FROM Quotation WHERE OrderID = ?";
            try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                checkStmt.setInt(1, quotation.getOrderId());
                try (ResultSet rs = checkStmt.executeQuery()) {
                    if (rs.next() && rs.getInt(1) > 0) {
                        throw new RuntimeException("Quotation already exists for Order #" + quotation.getOrderId());
                    }
                }
            }

            // Calculate total amount from items if items are provided
            BigDecimal totalAmount = BigDecimal.ZERO;
            if (items != null && !items.isEmpty()) {
                for (QuotationItem item : items) {
                    BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ONE;
                    BigDecimal price = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                    totalAmount = totalAmount.add(qty.multiply(price));
                }
            } else if (quotation.getTotalAmount() != null) {
                totalAmount = quotation.getTotalAmount();
            }
            quotation.setTotalAmount(totalAmount);

            // 1. Generate QuotationID
            int newQuotationId = 1;
            String idSql = "SELECT ISNULL(MAX(QuotationID), 0) + 1 FROM Quotation";
            try (PreparedStatement idStmt = conn.prepareStatement(idSql);
                 ResultSet rs = idStmt.executeQuery()) {
                if (rs.next()) {
                    newQuotationId = rs.getInt(1);
                }
            }

            // 2. Insert Quotation
            String insertQuotationSql = "INSERT INTO Quotation (QuotationID, OrderID, QuotationDate, TotalAmount, Status) VALUES (?, ?, ?, ?, ?)";
            try (PreparedStatement stmt = conn.prepareStatement(insertQuotationSql)) {
                stmt.setInt(1, newQuotationId);
                stmt.setInt(2, quotation.getOrderId());

                LocalDateTime qDate = quotation.getQuotationDate() != null ? quotation.getQuotationDate() : LocalDateTime.now();
                stmt.setTimestamp(3, Timestamp.valueOf(qDate));
                stmt.setBigDecimal(4, totalAmount);

                String status = quotation.getStatus() != null && !quotation.getStatus().trim().isEmpty() ? quotation.getStatus() : "Draft";
                stmt.setString(5, status);

                stmt.executeUpdate();
            }

            // 3. Insert Quotation Items
            if (items != null && !items.isEmpty()) {
                int startItemId = 1;
                String itemIdSql = "SELECT ISNULL(MAX(QuotationItemID), 0) + 1 FROM Quotation_Item";
                try (PreparedStatement itemIdStmt = conn.prepareStatement(itemIdSql);
                     ResultSet rs = itemIdStmt.executeQuery()) {
                    if (rs.next()) {
                        startItemId = rs.getInt(1);
                    }
                }

                String insertItemSql = "INSERT INTO Quotation_Item (QuotationItemID, QuotationID, Description, Quantity, UnitPrice) VALUES (?, ?, ?, ?, ?)";
                try (PreparedStatement itemStmt = conn.prepareStatement(insertItemSql)) {
                    for (QuotationItem item : items) {
                        itemStmt.setInt(1, startItemId++);
                        itemStmt.setInt(2, newQuotationId);
                        itemStmt.setString(3, item.getDescription() != null ? item.getDescription().trim() : "Quotation Item");

                        BigDecimal qty = item.getQuantity() != null && item.getQuantity().compareTo(BigDecimal.ZERO) > 0 ? item.getQuantity() : BigDecimal.ONE;
                        itemStmt.setBigDecimal(4, qty);

                        BigDecimal unitPrice = item.getUnitPrice() != null && item.getUnitPrice().compareTo(BigDecimal.ZERO) >= 0 ? item.getUnitPrice() : BigDecimal.ZERO;
                        itemStmt.setBigDecimal(5, unitPrice);

                        itemStmt.executeUpdate();
                    }
                }
            }

            conn.commit(); // Commit transaction!
            quotation.setQuotationId(newQuotationId);
            return quotation;

        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException rbEx) {
                    // Suppress rollback exception
                }
            }
            throw new RuntimeException("Transaction failed while creating quotation: " + e.getMessage(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException closeEx) {
                    // Suppress close exception
                }
            }
        }
    }

    public Quotation create(Quotation quotation) {
        return createQuotation(quotation);
    }

    // ---------- UPDATE STATUS ----------
    public void updateQuotationStatus(int quotationId, String status) {
        String sql = "UPDATE Quotation SET Status = ? WHERE QuotationID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, status);
            stmt.setInt(2, quotationId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating status for quotation " + quotationId + ": " + e.getMessage(), e);
        }
    }


    // ---------- UPDATE ----------
    public Quotation updateQuotation(Quotation quotation) {
        String sql = "UPDATE Quotation SET OrderID = ?, QuotationDate = ?, TotalAmount = ?, Status = ? WHERE QuotationID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, quotation.getOrderId());

            LocalDateTime qDate = quotation.getQuotationDate() != null ? quotation.getQuotationDate() : LocalDateTime.now();
            stmt.setTimestamp(2, Timestamp.valueOf(qDate));

            BigDecimal amount = quotation.getTotalAmount() != null ? quotation.getTotalAmount() : BigDecimal.ZERO;
            stmt.setBigDecimal(3, amount);

            stmt.setString(4, quotation.getStatus());
            stmt.setInt(5, quotation.getQuotationId());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating quotation " + quotation.getQuotationId() + ": " + e.getMessage(), e);
        }
        return quotation;
    }

    public Quotation update(int id, Quotation quotation) {
        quotation.setQuotationId(id);
        return updateQuotation(quotation);
    }

    // ---------- DELETE ----------
    public void deleteQuotation(int quotationId) {
        try (Connection conn = DBConnection.getConnection()) {
            // Delete dependent quotation items first
            try (PreparedStatement s1 = conn.prepareStatement("DELETE FROM Quotation_Item WHERE QuotationID = ?")) {
                s1.setInt(1, quotationId);
                s1.executeUpdate();
            }

            try (PreparedStatement stmt = conn.prepareStatement("DELETE FROM Quotation WHERE QuotationID = ?")) {
                stmt.setInt(1, quotationId);
                stmt.executeUpdate();
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting quotation " + quotationId + ": " + e.getMessage(), e);
        }
    }

    public void delete(int id) {
        deleteQuotation(id);
    }

    /** Helper method to map ResultSet row to Quotation object */
    private Quotation mapRow(ResultSet rs) throws SQLException {
        Quotation quotation = new Quotation();
        quotation.setQuotationId(rs.getInt("QuotationID"));
        quotation.setOrderId(rs.getInt("OrderID"));

        Timestamp ts = rs.getTimestamp("QuotationDate");
        quotation.setQuotationDate(ts != null ? ts.toLocalDateTime() : null);

        quotation.setTotalAmount(rs.getBigDecimal("TotalAmount"));
        quotation.setStatus(rs.getString("Status"));

        return quotation;
    }
}
