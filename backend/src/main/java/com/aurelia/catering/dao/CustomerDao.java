package com.aurelia.catering.dao;

import com.aurelia.catering.util.PasswordUtil;
import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.Customer;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for Customer.
 * Matches table CUSTOMER in AureliaCatering2:
 * Columns: CustomerID, Name, Phone, Email
 */
@Repository
public class CustomerDao {

    // ---------- READ (all customers) ----------
    public List<Customer> getAllCustomers() {
        List<Customer> list = new ArrayList<>();
        String sql = "SELECT CustomerID, Name, Phone, Email FROM Customer ORDER BY CustomerID ASC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all customers: " + e.getMessage(), e);
        }
        return list;
    }

    public List<Customer> getAll() {
        return getAllCustomers();
    }

    // ---------- READ (by CustomerID) ----------
    public Customer getCustomerById(int customerId) {
        String sql = "SELECT CustomerID, Name, Phone, Email FROM Customer WHERE CustomerID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, customerId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching customer with id " + customerId + ": " + e.getMessage(), e);
        }
        return null;
    }

    public Customer getById(int id) {
        return getCustomerById(id);
    }

    // ---------- READ (by Email) ----------
    public Customer findByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return null;
        }
        String sql = "SELECT CustomerID, Name, Phone, Email FROM Customer WHERE LOWER(Email) = LOWER(?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email.trim());
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error finding customer by email: " + e.getMessage(), e);
        }
        return null;
    }

    // ---------- READ (by Phone) ----------
    public Customer findByPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return null;
        }
        String sql = "SELECT CustomerID, Name, Phone, Email FROM Customer WHERE Phone = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, phone.trim());
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error finding customer by phone: " + e.getMessage(), e);
        }
        return null;
    }

    // ---------- FIND OR CREATE CUSTOMER ----------
    public Customer findOrCreateCustomer(String name, String phone, String email) {
        // First check by email if provided
        if (email != null && !email.trim().isEmpty()) {
            Customer existing = findByEmail(email.trim());
            if (existing != null) {
                return existing;
            }
        }

        // Then check by phone if provided
        if (phone != null && !phone.trim().isEmpty()) {
            Customer existing = findByPhone(phone.trim());
            if (existing != null) {
                return existing;
            }
        }

        // Not found, create new customer
        Customer newCustomer = new Customer();
        newCustomer.setName(name != null && !name.trim().isEmpty() ? name.trim() : "Guest Customer");
        newCustomer.setPhone(phone != null && !phone.trim().isEmpty() ? phone.trim() : "N/A");
        newCustomer.setEmail(email != null && !email.trim().isEmpty() ? email.trim() : "guest@aurelia.lk");
        return createCustomer(newCustomer);
    }

    // ---------- CREATE ----------
    public Customer createCustomer(Customer customer) {
        int newId = 1;
        String idSql = "SELECT ISNULL(MAX(CustomerID), 0) + 1 FROM Customer";
        String insertSql = "INSERT INTO Customer (CustomerID, Name, Phone, Email) VALUES (?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            if (customer.getCustomerId() != null && customer.getCustomerId() > 0) {
                newId = customer.getCustomerId();
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
                stmt.setString(2, customer.getName());
                stmt.setString(3, customer.getPhone());
                stmt.setString(4, customer.getEmail());
                stmt.executeUpdate();
            }

            customer.setCustomerId(newId);

            // Auto-create Customer_Account if customer phone is provided and account does not exist
            if (customer.getPhone() != null && !customer.getPhone().trim().isEmpty() && !"N/A".equalsIgnoreCase(customer.getPhone().trim())) {
                try {
                    boolean accExists = false;
                    try (PreparedStatement checkStmt = conn.prepareStatement("SELECT AccountID FROM Customer_Account WHERE CustomerID = ?")) {
                        checkStmt.setInt(1, newId);
                        try (ResultSet rs = checkStmt.executeQuery()) {
                            if (rs.next()) accExists = true;
                        }
                    }

                    if (!accExists) {
                        int newAccId = 1;
                        try (PreparedStatement nextIdStmt = conn.prepareStatement("SELECT ISNULL(MAX(AccountID), 0) + 1 FROM Customer_Account");
                             ResultSet rs = nextIdStmt.executeQuery()) {
                            if (rs.next()) newAccId = rs.getInt(1);
                        }
                        try (PreparedStatement insStmt = conn.prepareStatement(
                                "INSERT INTO Customer_Account (AccountID, CustomerID, PasswordHash, AccountStatus, CreatedDate) VALUES (?, ?, ?, 'Active', GETDATE())")) {
                            insStmt.setInt(1, newAccId);
                            insStmt.setInt(2, newId);
                            insStmt.setString(3, PasswordUtil.hash(customer.getPhone().trim())); // Initial password is the registered phone number
                            insStmt.executeUpdate();
                        }
                    }
                } catch (SQLException ex) {
                    // Non-fatal auto-account creation
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error creating customer: " + e.getMessage(), e);
        }
        return customer;
    }

    public Customer create(Customer customer) {
        return createCustomer(customer);
    }

    // ---------- UPDATE ----------
    public Customer updateCustomer(Customer customer) {
        String sql = "UPDATE Customer SET Name = ?, Phone = ?, Email = ? WHERE CustomerID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, customer.getName());
            stmt.setString(2, customer.getPhone());
            stmt.setString(3, customer.getEmail());
            stmt.setInt(4, customer.getCustomerId());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating customer " + customer.getCustomerId() + ": " + e.getMessage(), e);
        }
        return customer;
    }

    public Customer update(int id, Customer customer) {
        customer.setCustomerId(id);
        return updateCustomer(customer);
    }

    // ---------- DELETE ----------
    public void deleteCustomer(int customerId) {
        String sql = "DELETE FROM Customer WHERE CustomerID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, customerId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting customer " + customerId + ": " + e.getMessage(), e);
        }
    }

    public void delete(int id) {
        deleteCustomer(id);
    }

    /** Helper method to map ResultSet row to Customer object */
    private Customer mapRow(ResultSet rs) throws SQLException {
        Customer c = new Customer();
        c.setCustomerId(rs.getInt("CustomerID"));
        c.setName(rs.getString("Name"));
        c.setPhone(rs.getString("Phone"));
        c.setEmail(rs.getString("Email"));
        return c;
    }
}
