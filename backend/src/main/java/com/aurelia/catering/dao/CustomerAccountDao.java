package com.aurelia.catering.dao;

import com.aurelia.catering.util.PasswordUtil;
import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.CustomerAccount;
import org.springframework.stereotype.Repository;

import java.sql.*;

/**
 * Data Access Object for Customer accounts and credentials.
 * Operates directly on CUSTOMER and CUSTOMER_ACCOUNT tables in AureliaCatering2.
 */
@Repository
public class CustomerAccountDao {

    /**
     * Looks up a customer account by customer email or registered phone number, joining CUSTOMER and CUSTOMER_ACCOUNT.
     *
     * @param identifier Customer's email address or registered phone number
     * @return CustomerAccount with populated credentials and customer demographic info, or null if not found
     */
    public CustomerAccount findByCustomerEmail(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            return null;
        }

        String sql = "SELECT ca.AccountID, ca.CustomerID, ca.PasswordHash, ca.AccountStatus, ca.CreatedDate, ca.LastLoginDate, " +
                "c.Name AS CustomerName, c.Phone AS CustomerPhone, c.Email AS CustomerEmail " +
                "FROM Customer_Account ca " +
                "INNER JOIN Customer c ON ca.CustomerID = c.CustomerID " +
                "WHERE LOWER(c.Email) = LOWER(?) OR c.Phone = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, identifier.trim());
            stmt.setString(2, identifier.trim());
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching customer account by identifier: " + e.getMessage(), e);
        }

        return null;
    }

    /**
     * Looks up a customer account by customer ID.
     */
    public CustomerAccount findByCustomerId(int customerId) {
        String sql = "SELECT ca.AccountID, ca.CustomerID, ca.PasswordHash, ca.AccountStatus, ca.CreatedDate, ca.LastLoginDate, " +
                "c.Name AS CustomerName, c.Phone AS CustomerPhone, c.Email AS CustomerEmail " +
                "FROM Customer_Account ca " +
                "INNER JOIN Customer c ON ca.CustomerID = c.CustomerID " +
                "WHERE ca.CustomerID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, customerId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching customer account by customerId: " + e.getMessage(), e);
        }

        return null;
    }

    /**
     * Creates a new standalone customer account record for an existing Customer ID.
     */
    public CustomerAccount create(CustomerAccount account) {
        String sql = "INSERT INTO Customer_Account (AccountID, CustomerID, PasswordHash, AccountStatus, CreatedDate, LastLoginDate) " +
                "VALUES ((SELECT ISNULL(MAX(AccountID), 0) + 1 FROM Customer_Account), ?, ?, ?, GETDATE(), ?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, account.getCustomerId());
            stmt.setString(2, PasswordUtil.hashIfNeeded(account.getPasswordHash()));
            stmt.setString(3, account.getAccountStatus() != null ? account.getAccountStatus() : "Active");
            if (account.getLastLoginDate() != null) {
                stmt.setTimestamp(4, account.getLastLoginDate());
            } else {
                stmt.setNull(4, Types.TIMESTAMP);
            }

            stmt.executeUpdate();

            // Query back the newly created account ID
            try (PreparedStatement idStmt = conn.prepareStatement("SELECT MAX(AccountID) FROM Customer_Account");
                 ResultSet rs = idStmt.executeQuery()) {
                if (rs.next()) {
                    account.setAccountId(rs.getInt(1));
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error creating CustomerAccount: " + e.getMessage(), e);
        }

        return account;
    }

    /**
     * Atomically registers a new customer profile and account credentials in a single JDBC transaction.
     * Prevents orphaned Customer records if Account insertion encounters an error.
     *
     * @param name         Customer's full name
     * @param email        Customer's email address
     * @param phone        Customer's phone number
     * @param passwordHash Hashed password string
     * @return Fully populated CustomerAccount object
     */
    public CustomerAccount registerCustomerWithAccount(String name, String email, String phone, String passwordHash) {
        String getNextCustIdSql = "SELECT ISNULL(MAX(CustomerID), 0) + 1 FROM Customer";
        String insertCustomerSql = "INSERT INTO Customer (CustomerID, Name, Phone, Email) VALUES (?, ?, ?, ?)";
        String getNextAccIdSql = "SELECT ISNULL(MAX(AccountID), 0) + 1 FROM Customer_Account";
        String insertAccountSql = "INSERT INTO Customer_Account (AccountID, CustomerID, PasswordHash, AccountStatus, CreatedDate) " +
                "VALUES (?, ?, ?, 'Active', GETDATE())";

        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false); // Begin transaction

            int newCustomerId;
            try (PreparedStatement nextCustStmt = conn.prepareStatement(getNextCustIdSql);
                 ResultSet rs = nextCustStmt.executeQuery()) {
                rs.next();
                newCustomerId = rs.getInt(1);
            }

            // 1. Insert into Customer
            try (PreparedStatement custStmt = conn.prepareStatement(insertCustomerSql)) {
                custStmt.setInt(1, newCustomerId);
                custStmt.setString(2, name.trim());
                custStmt.setString(3, phone != null && !phone.trim().isEmpty() ? phone.trim() : "N/A");
                custStmt.setString(4, email.trim());
                custStmt.executeUpdate();
            }

            int newAccountId;
            try (PreparedStatement nextAccStmt = conn.prepareStatement(getNextAccIdSql);
                 ResultSet rs = nextAccStmt.executeQuery()) {
                rs.next();
                newAccountId = rs.getInt(1);
            }

            // 2. Insert into Customer_Account
            try (PreparedStatement accStmt = conn.prepareStatement(insertAccountSql)) {
                accStmt.setInt(1, newAccountId);
                accStmt.setInt(2, newCustomerId);
                accStmt.setString(3, PasswordUtil.hashIfNeeded(passwordHash));
                accStmt.executeUpdate();
            }

            conn.commit(); // Commit transaction

            CustomerAccount account = new CustomerAccount();
            account.setAccountId(newAccountId);
            account.setCustomerId(newCustomerId);
            account.setAccountStatus("Active");
            account.setCustomerName(name.trim());
            account.setCustomerEmail(email.trim());
            account.setCustomerPhone(phone != null ? phone.trim() : "N/A");
            account.setCreatedDate(new Timestamp(System.currentTimeMillis()));

            return account;

        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException rbEx) {
                    // Suppress rollback exception
                }
            }
            throw new RuntimeException("Transaction failed while registering customer: " + e.getMessage(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException closeEx) {
                    // Suppress close exception
                }
            }
        }
    }

    /**
     * Checks if a customer account with the given email address already exists.
     */
    public boolean emailExists(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        String sql = "SELECT 1 FROM Customer WHERE LOWER(Email) = LOWER(?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email.trim());
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error checking customer email existence: " + e.getMessage(), e);
        }
    }

    /**
     * Updates the LastLoginDate timestamp to the current server timestamp.
     */
    public void updateLastLogin(int accountId) {
        String sql = "UPDATE Customer_Account SET LastLoginDate = GETDATE() WHERE AccountID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, accountId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating CustomerAccount last login: " + e.getMessage(), e);
        }
    }

    /**
     * Updates a customer's password hash.
     */
    public void updatePassword(int accountId, String newPasswordHash) {
        String sql = "UPDATE Customer_Account SET PasswordHash = ? WHERE AccountID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, PasswordUtil.hashIfNeeded(newPasswordHash));
            stmt.setInt(2, accountId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating CustomerAccount password: " + e.getMessage(), e);
        }
    }

    private CustomerAccount mapRow(ResultSet rs) throws SQLException {
        CustomerAccount acc = new CustomerAccount();
        acc.setAccountId(rs.getInt("AccountID"));
        acc.setCustomerId(rs.getInt("CustomerID"));
        acc.setPasswordHash(rs.getString("PasswordHash"));
        acc.setAccountStatus(rs.getString("AccountStatus"));
        acc.setCreatedDate(rs.getTimestamp("CreatedDate"));
        acc.setLastLoginDate(rs.getTimestamp("LastLoginDate"));

        // Joined customer details
        acc.setCustomerName(rs.getString("CustomerName"));
        acc.setCustomerPhone(rs.getString("CustomerPhone"));
        acc.setCustomerEmail(rs.getString("CustomerEmail"));
        return acc;
    }
}
