package com.aurelia.catering.dao;

import com.aurelia.catering.util.PasswordUtil;
import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.StaffAccount;
import org.springframework.stereotype.Repository;

import java.sql.*;

/**
 * Data Access Object for Staff accounts and credentials.
 * Operates directly on STAFF and STAFF_ACCOUNT tables in AureliaCatering2.
 */
@Repository
public class StaffAccountDao {

    /**
     * Looks up a staff account by username or staff email, joining STAFF and STAFF_ACCOUNT.
     *
     * @param identifier Staff's username or email address
     * @return StaffAccount with populated credentials, role, and staff demographic info, or null if not found
     */
    public StaffAccount findByUsernameOrEmail(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            return null;
        }

        String sql = "SELECT sa.AccountID, sa.StaffID, sa.Username, sa.PasswordHash, sa.AccountStatus, sa.CreatedDate, sa.LastLoginDate, " +
                "s.Name AS StaffName, s.Phone AS StaffPhone, s.Email AS StaffEmail, s.Role AS StaffRole " +
                "FROM Staff_Account sa " +
                "INNER JOIN Staff s ON sa.StaffID = s.StaffID " +
                "WHERE LOWER(sa.Username) = LOWER(?) OR LOWER(s.Email) = LOWER(?)";

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
            throw new RuntimeException("Error fetching staff account by identifier: " + e.getMessage(), e);
        }

        return null;
    }

    /**
     * Creates a new staff account record in STAFF_ACCOUNT.
     */
    public StaffAccount create(StaffAccount account) {
        String sql = "INSERT INTO Staff_Account (AccountID, StaffID, Username, PasswordHash, AccountStatus, CreatedDate, LastLoginDate) " +
                "VALUES ((SELECT ISNULL(MAX(AccountID), 0) + 1 FROM Staff_Account), ?, ?, ?, ?, GETDATE(), ?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, account.getStaffId());
            stmt.setString(2, account.getUsername());
            stmt.setString(3, PasswordUtil.hashIfNeeded(account.getPasswordHash()));
            stmt.setString(4, account.getAccountStatus() != null ? account.getAccountStatus() : "Active");
            if (account.getLastLoginDate() != null) {
                stmt.setTimestamp(5, account.getLastLoginDate());
            } else {
                stmt.setNull(5, Types.TIMESTAMP);
            }

            stmt.executeUpdate();

            // Query back the generated AccountID
            try (PreparedStatement idStmt = conn.prepareStatement("SELECT MAX(AccountID) FROM Staff_Account");
                 ResultSet rs = idStmt.executeQuery()) {
                if (rs.next()) {
                    account.setAccountId(rs.getInt(1));
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error creating StaffAccount: " + e.getMessage(), e);
        }

        return account;
    }

    /**
     * Updates the LastLoginDate timestamp to the current server timestamp.
     */
    public void updateLastLogin(int accountId) {
        String sql = "UPDATE Staff_Account SET LastLoginDate = GETDATE() WHERE AccountID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, accountId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating StaffAccount last login: " + e.getMessage(), e);
        }
    }

    /**
     * Updates a staff member's password hash.
     */
    public void updatePassword(int accountId, String newPasswordHash) {
        String sql = "UPDATE Staff_Account SET PasswordHash = ? WHERE AccountID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, PasswordUtil.hashIfNeeded(newPasswordHash));
            stmt.setInt(2, accountId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating StaffAccount password: " + e.getMessage(), e);
        }
    }

    private StaffAccount mapRow(ResultSet rs) throws SQLException {
        StaffAccount acc = new StaffAccount();
        acc.setAccountId(rs.getInt("AccountID"));
        acc.setStaffId(rs.getInt("StaffID"));
        acc.setUsername(rs.getString("Username"));
        acc.setPasswordHash(rs.getString("PasswordHash"));
        acc.setAccountStatus(rs.getString("AccountStatus"));
        acc.setCreatedDate(rs.getTimestamp("CreatedDate"));
        acc.setLastLoginDate(rs.getTimestamp("LastLoginDate"));

        // Joined staff details
        acc.setStaffName(rs.getString("StaffName"));
        acc.setStaffPhone(rs.getString("StaffPhone"));
        acc.setStaffEmail(rs.getString("StaffEmail"));
        acc.setStaffRole(rs.getString("StaffRole"));
        return acc;
    }
}
