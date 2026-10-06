package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.Payment;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Data Access Object for Payment.
 * Matches table Payment in AureliaCatering2:
 * Columns: PaymentID, OrderID, PaymentDate, Amount, PaymentType, PaymentStatus
 */
@Repository
public class PaymentDao {

    // ---------- READ (all payments) ----------
    public List<Payment> getAllPayments() {
        List<Payment> list = new ArrayList<>();
        String sql = "SELECT PaymentID, OrderID, PaymentDate, Amount, PaymentType, PaymentStatus FROM Payment ORDER BY PaymentID DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all payments: " + e.getMessage(), e);
        }
        return list;
    }

    public List<Payment> getAll() {
        return getAllPayments();
    }

    // ---------- READ (by PaymentID) ----------
    public Payment getPaymentById(int paymentId) {
        String sql = "SELECT PaymentID, OrderID, PaymentDate, Amount, PaymentType, PaymentStatus FROM Payment WHERE PaymentID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, paymentId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching payment with id " + paymentId + ": " + e.getMessage(), e);
        }
        return null;
    }

    public Payment getById(int id) {
        return getPaymentById(id);
    }

    // ---------- READ (by OrderID) ----------
    public List<Payment> getPaymentsByOrderId(int orderId) {
        List<Payment> list = new ArrayList<>();
        String sql = "SELECT PaymentID, OrderID, PaymentDate, Amount, PaymentType, PaymentStatus FROM Payment WHERE OrderID = ? ORDER BY PaymentID ASC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching payments for order " + orderId + ": " + e.getMessage(), e);
        }
        return list;
    }

    public List<Payment> getByOrderId(int orderId) {
        return getPaymentsByOrderId(orderId);
    }

    // ---------- CREATE ----------
    public Payment createPayment(Payment payment) {
        int newId = 1;
        String idSql = "SELECT ISNULL(MAX(PaymentID), 0) + 1 FROM Payment";
        String insertSql = "INSERT INTO Payment (PaymentID, OrderID, PaymentDate, Amount, PaymentType, PaymentStatus) VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            if (payment.getPaymentId() != null && payment.getPaymentId() > 0) {
                newId = payment.getPaymentId();
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
                stmt.setInt(2, payment.getOrderId());

                LocalDateTime pDate = payment.getPaymentDate() != null ? payment.getPaymentDate() : LocalDateTime.now();
                stmt.setTimestamp(3, Timestamp.valueOf(pDate));

                BigDecimal amount = payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO;
                stmt.setBigDecimal(4, amount);

                stmt.setString(5, payment.getPaymentType());

                String status = payment.getPaymentStatus() != null && !payment.getPaymentStatus().trim().isEmpty() 
                        ? payment.getPaymentStatus() : "Pending";
                stmt.setString(6, status);

                stmt.executeUpdate();
            }

            payment.setPaymentId(newId);
        } catch (SQLException e) {
            throw new RuntimeException("Error creating payment: " + e.getMessage(), e);
        }
        return payment;
    }

    public Payment create(Payment payment) {
        return createPayment(payment);
    }

    // ---------- UPDATE ----------
    public Payment updatePayment(Payment payment) {
        String sql = "UPDATE Payment SET OrderID = ?, PaymentDate = ?, Amount = ?, PaymentType = ?, PaymentStatus = ? WHERE PaymentID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, payment.getOrderId());

            LocalDateTime pDate = payment.getPaymentDate() != null ? payment.getPaymentDate() : LocalDateTime.now();
            stmt.setTimestamp(2, Timestamp.valueOf(pDate));

            BigDecimal amount = payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO;
            stmt.setBigDecimal(3, amount);

            stmt.setString(4, payment.getPaymentType());
            stmt.setString(5, payment.getPaymentStatus());
            stmt.setInt(6, payment.getPaymentId());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating payment " + payment.getPaymentId() + ": " + e.getMessage(), e);
        }
        return payment;
    }

    public Payment update(int id, Payment payment) {
        payment.setPaymentId(id);
        return updatePayment(payment);
    }

    // ---------- DELETE ----------
    public void deletePayment(int paymentId) {
        String sql = "DELETE FROM Payment WHERE PaymentID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, paymentId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting payment " + paymentId + ": " + e.getMessage(), e);
        }
    }

    public void delete(int id) {
        deletePayment(id);
    }

    // ---------- GET ORDER PAYMENT SUMMARY ----------
    public Map<String, Object> getOrderPaymentSummary(int orderId) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("orderId", orderId);

        String orderSql = "SELECT OrderID, CustomerID, Status FROM [Order] WHERE OrderID = ?";
        String quotSql = "SELECT QuotationID, TotalAmount, Status FROM Quotation WHERE OrderID = ? ORDER BY QuotationID DESC";
        String paySql = "SELECT PaymentID, OrderID, PaymentDate, Amount, PaymentType, PaymentStatus FROM Payment WHERE OrderID = ? ORDER BY PaymentID ASC";

        try (Connection conn = DBConnection.getConnection()) {
            // 1. Order details
            String orderStatus = null;
            Integer customerId = null;
            try (PreparedStatement stmt = conn.prepareStatement(orderSql)) {
                stmt.setInt(1, orderId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        orderStatus = rs.getString("Status");
                        customerId = rs.getInt("CustomerID");
                    }
                }
            }

            if (orderStatus == null) {
                return null; // Order not found
            }
            summary.put("orderStatus", orderStatus);
            summary.put("customerId", customerId);

            // 2. Quotation details
            BigDecimal totalAmount = BigDecimal.ZERO;
            Integer quotationId = null;
            String quotationStatus = null;
            try (PreparedStatement stmt = conn.prepareStatement(quotSql)) {
                stmt.setInt(1, orderId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        quotationId = rs.getInt("QuotationID");
                        totalAmount = rs.getBigDecimal("TotalAmount") != null ? rs.getBigDecimal("TotalAmount") : BigDecimal.ZERO;
                        quotationStatus = rs.getString("Status");
                    }
                }
            }
            summary.put("quotationId", quotationId);
            summary.put("quotationStatus", quotationStatus);
            summary.put("totalAmount", totalAmount);

            // 3. Payments ledger
            List<Payment> payments = new ArrayList<>();
            BigDecimal totalPaid = BigDecimal.ZERO;
            try (PreparedStatement stmt = conn.prepareStatement(paySql)) {
                stmt.setInt(1, orderId);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        Payment p = mapRow(rs);
                        payments.add(p);
                        if ("Paid".equalsIgnoreCase(p.getPaymentStatus()) && p.getAmount() != null) {
                            totalPaid = totalPaid.add(p.getAmount());
                        }
                    }
                }
            }
            summary.put("payments", payments);
            summary.put("totalPaid", totalPaid);

            BigDecimal balance = totalAmount.subtract(totalPaid);
            if (balance.compareTo(BigDecimal.ZERO) < 0) {
                balance = BigDecimal.ZERO;
            }
            summary.put("balance", balance);
            summary.put("isFullyPaid", totalAmount.compareTo(BigDecimal.ZERO) > 0 && totalPaid.compareTo(totalAmount) >= 0);
            summary.put("hasAdvancePaid", totalPaid.compareTo(BigDecimal.ZERO) > 0);

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching payment summary for order " + orderId + ": " + e.getMessage(), e);
        }

        return summary;
    }

    // ---------- TRANSACTIONAL RECORD PAYMENT ----------
    public Map<String, Object> recordOrderPayment(Payment payment) {
        if (payment.getOrderId() == null || payment.getOrderId() <= 0) {
            throw new IllegalArgumentException("Valid OrderID is required.");
        }
        if (payment.getAmount() == null || payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }

        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false); // Begin atomic transaction

            // 1. Validate Order
            String orderStatus = null;
            String checkOrderSql = "SELECT Status FROM [Order] WHERE OrderID = ?";
            try (PreparedStatement stmt = conn.prepareStatement(checkOrderSql)) {
                stmt.setInt(1, payment.getOrderId());
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        orderStatus = rs.getString("Status");
                    }
                }
            }

            if (orderStatus == null) {
                throw new IllegalArgumentException("Order #" + payment.getOrderId() + " does not exist.");
            }

            // Only allow payment on active, payable order states
            if ("Cancelled".equalsIgnoreCase(orderStatus) || "Rejected".equalsIgnoreCase(orderStatus)) {
                throw new IllegalStateException("Cannot record payment for order #" + payment.getOrderId() + " because it is " + orderStatus + ".");
            }
            if (!"Payment Pending".equalsIgnoreCase(orderStatus) 
                && !"Confirmed".equalsIgnoreCase(orderStatus) 
                && !"Customer Confirmation Pending".equalsIgnoreCase(orderStatus) 
                && !"Quotation Ready".equalsIgnoreCase(orderStatus)) {
                throw new IllegalStateException("Order #" + payment.getOrderId() + " is in status '" + orderStatus + "' and is not awaiting payment.");
            }

            // 2. Fetch Quotation Amount
            BigDecimal totalAmount = BigDecimal.ZERO;
            String checkQuotSql = "SELECT TotalAmount FROM Quotation WHERE OrderID = ? ORDER BY QuotationID DESC";
            try (PreparedStatement stmt = conn.prepareStatement(checkQuotSql)) {
                stmt.setInt(1, payment.getOrderId());
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        totalAmount = rs.getBigDecimal("TotalAmount") != null ? rs.getBigDecimal("TotalAmount") : BigDecimal.ZERO;
                    }
                }
            }

            if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("No quotation amount found for Order #" + payment.getOrderId() + ".");
            }

            // 3. Check current paid amount & remaining balance
            BigDecimal totalPaid = BigDecimal.ZERO;
            String sumPaySql = "SELECT ISNULL(SUM(Amount), 0) FROM Payment WHERE OrderID = ? AND PaymentStatus = 'Paid'";
            try (PreparedStatement stmt = conn.prepareStatement(sumPaySql)) {
                stmt.setInt(1, payment.getOrderId());
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        totalPaid = rs.getBigDecimal(1);
                    }
                }
            }

            BigDecimal remainingBalance = totalAmount.subtract(totalPaid);
            if (remainingBalance.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("Order #" + payment.getOrderId() + " is already fully paid (Total: Rs. " + totalAmount + ", Paid: Rs. " + totalPaid + ").");
            }

            if (payment.getAmount().compareTo(remainingBalance) > 0) {
                throw new IllegalArgumentException("Payment amount (Rs. " + payment.getAmount() + ") exceeds remaining balance (Rs. " + remainingBalance + ").");
            }

            // 4. Determine PaymentType ('Advance' or 'Balance')
            String paymentType = payment.getPaymentType();
            if (paymentType == null || (!"Advance".equalsIgnoreCase(paymentType) && !"Balance".equalsIgnoreCase(paymentType))) {
                BigDecimal newTotal = totalPaid.add(payment.getAmount());
                if (newTotal.compareTo(totalAmount) >= 0) {
                    paymentType = "Balance";
                } else {
                    paymentType = "Advance";
                }
            } else {
                // Capitalize first letter to match constraint
                paymentType = "Advance".equalsIgnoreCase(paymentType) ? "Advance" : "Balance";
            }

            // 5. PaymentStatus ('Paid' by default for external payments)
            String paymentStatus = payment.getPaymentStatus();
            if (paymentStatus == null || (!"Paid".equalsIgnoreCase(paymentStatus) && !"Pending".equalsIgnoreCase(paymentStatus) && !"Failed".equalsIgnoreCase(paymentStatus))) {
                paymentStatus = "Paid";
            } else {
                paymentStatus = "Paid".equalsIgnoreCase(paymentStatus) ? "Paid" : ("Pending".equalsIgnoreCase(paymentStatus) ? "Pending" : "Failed");
            }

            // 6. Generate next PaymentID
            int newPaymentId = 1;
            String idSql = "SELECT ISNULL(MAX(PaymentID), 0) + 1 FROM Payment";
            try (PreparedStatement idStmt = conn.prepareStatement(idSql);
                 ResultSet rs = idStmt.executeQuery()) {
                if (rs.next()) {
                    newPaymentId = rs.getInt(1);
                }
            }

            // 7. Insert Payment record (Trigger trg_Payment_UpdateOrderStatus will fire automatically if totalPaid >= totalAmount)
            String insertSql = "INSERT INTO Payment (PaymentID, OrderID, PaymentDate, Amount, PaymentType, PaymentStatus) VALUES (?, ?, ?, ?, ?, ?)";
            LocalDateTime pDate = payment.getPaymentDate() != null ? payment.getPaymentDate() : LocalDateTime.now();
            try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                stmt.setInt(1, newPaymentId);
                stmt.setInt(2, payment.getOrderId());
                stmt.setTimestamp(3, Timestamp.valueOf(pDate));
                stmt.setBigDecimal(4, payment.getAmount());
                stmt.setString(5, paymentType);
                stmt.setString(6, paymentStatus);
                stmt.executeUpdate();
            }

            // 8. Commit Transaction
            conn.commit();

            payment.setPaymentId(newPaymentId);
            payment.setPaymentType(paymentType);
            payment.setPaymentStatus(paymentStatus);
            payment.setPaymentDate(pDate);

            // Fetch final order status after trigger execution
            String finalOrderStatus = orderStatus;
            try (PreparedStatement stmt = conn.prepareStatement("SELECT Status FROM [Order] WHERE OrderID = ?")) {
                stmt.setInt(1, payment.getOrderId());
                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        finalOrderStatus = rs.getString("Status");
                    }
                }
            }

            BigDecimal updatedPaid = totalPaid.add(payment.getAmount());
            BigDecimal updatedBalance = totalAmount.subtract(updatedPaid);
            if (updatedBalance.compareTo(BigDecimal.ZERO) < 0) updatedBalance = BigDecimal.ZERO;

            Map<String, Object> result = new HashMap<>();
            result.put("payment", payment);
            result.put("paymentId", newPaymentId);
            result.put("orderId", payment.getOrderId());
            result.put("amount", payment.getAmount());
            result.put("paymentType", paymentType);
            result.put("paymentStatus", paymentStatus);
            result.put("orderStatus", finalOrderStatus);
            result.put("totalAmount", totalAmount);
            result.put("totalPaid", updatedPaid);
            result.put("balance", updatedBalance);
            result.put("isFullyPaid", updatedPaid.compareTo(totalAmount) >= 0);
            result.put("message", "Payment of Rs. " + payment.getAmount() + " recorded successfully. Order status is now '" + finalOrderStatus + "'.");

            return result;

        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException ex) {
                    // Suppress
                }
            }
            throw new RuntimeException("Transaction failed while recording payment: " + e.getMessage(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException ex) {
                    // Suppress
                }
            }
        }
    }

    /** Helper method to map ResultSet row to Payment object */
    private Payment mapRow(ResultSet rs) throws SQLException {
        Payment p = new Payment();
        p.setPaymentId(rs.getInt("PaymentID"));
        p.setOrderId(rs.getInt("OrderID"));

        Timestamp ts = rs.getTimestamp("PaymentDate");
        if (ts != null) {
            p.setPaymentDate(ts.toLocalDateTime());
        }

        p.setAmount(rs.getBigDecimal("Amount"));
        p.setPaymentType(rs.getString("PaymentType"));
        p.setPaymentStatus(rs.getString("PaymentStatus"));

        return p;
    }
}
