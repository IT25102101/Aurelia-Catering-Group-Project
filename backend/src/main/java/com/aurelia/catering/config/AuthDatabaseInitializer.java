package com.aurelia.catering.config;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.util.PasswordUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Automatically initializes required authentication database tables (CUSTOMER,
 * CUSTOMER_ACCOUNT, and STAFF_ACCOUNT) on application startup if they are missing.
 *
 * Designed to be:
 * - 100% Non-destructive: Never drops, truncates, or overwrites existing tables or staff records.
 * - Idempotent: Can be executed multiple times safely without creating duplicates.
 * - Secure: Hashes all initial staff passwords using PasswordUtil (salted PBKDF2) and never logs credentials.
 */
@Component
@Order(1)
public class AuthDatabaseInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AuthDatabaseInitializer.class);

    @Value("${aurelia.auth.auto-init-tables:true}")
    private boolean autoInitTables;

    @Value("${aurelia.auth.bootstrap-staff-accounts:true}")
    private boolean bootstrapStaffAccounts;

    @Value("${aurelia.auth.default-initial-password:password123}")
    private String defaultInitialPassword;

    @Override
    public void run(String... args) {
        if (!autoInitTables) {
            log.info("Automatic authentication table initialization is disabled (aurelia.auth.auto-init-tables=false).");
            return;
        }

        log.info("Checking authentication database schema in AureliaCatering2...");

        try (Connection conn = DBConnection.getConnection()) {
            // 1. Ensure CUSTOMER table exists (required for customer registration and customer accounts)
            ensureCustomerTable(conn);

            // 2. Ensure CUSTOMER_ACCOUNT table exists (depends on CUSTOMER)
            ensureCustomerAccountTable(conn);

            // 3. Ensure STAFF_ACCOUNT table exists (depends on STAFF)
            ensureStaffAccountTable(conn);

            // 4. If enabled, bootstrap accounts for any existing STAFF members who currently lack one
            if (bootstrapStaffAccounts) {
                bootstrapStaffAccountsIfMissing(conn);
            }

            log.info("Authentication database check and initialization completed successfully.");

        } catch (SQLException e) {
            log.error("Failed to initialize authentication database schema: {}", e.getMessage(), e);
        }
    }

    private boolean tableExists(Connection conn, String tableName) throws SQLException {
        String sql = "SELECT OBJECT_ID(?, 'U')";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, "dbo." + tableName);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getObject(1) != null;
                }
            }
        }
        return false;
    }

    private void ensureCustomerTable(Connection conn) throws SQLException {
        if (tableExists(conn, "CUSTOMER")) {
            log.debug("Table 'CUSTOMER' already exists.");
            return;
        }

        log.info("Table 'CUSTOMER' is missing. Creating table 'CUSTOMER'...");
        String ddl = "CREATE TABLE dbo.CUSTOMER (" +
                "    CustomerID INT          NOT NULL," +
                "    Name       VARCHAR(100) NOT NULL," +
                "    Phone      VARCHAR(20)  NOT NULL," +
                "    Email      VARCHAR(100) NOT NULL," +
                "    CONSTRAINT PK_CUSTOMER       PRIMARY KEY (CustomerID)," +
                "    CONSTRAINT UQ_CUSTOMER_EMAIL UNIQUE (Email)," +
                "    CONSTRAINT CK_CUSTOMER_PHONE CHECK (Phone NOT LIKE '%[^0-9+ ]%' AND LEN(Phone) >= 9)," +
                "    CONSTRAINT CK_CUSTOMER_EMAIL CHECK (Email LIKE '%_@_%._%')" +
                ")";

        try (Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(ddl);
            log.info("Table 'CUSTOMER' created successfully.");
        }
    }

    private void ensureCustomerAccountTable(Connection conn) throws SQLException {
        if (tableExists(conn, "CUSTOMER_ACCOUNT")) {
            log.debug("Table 'CUSTOMER_ACCOUNT' already exists.");
            return;
        }

        log.info("Table 'CUSTOMER_ACCOUNT' is missing. Creating table 'CUSTOMER_ACCOUNT'...");
        String ddl = "CREATE TABLE dbo.CUSTOMER_ACCOUNT (" +
                "    AccountID     INT          NOT NULL," +
                "    CustomerID    INT          NOT NULL," +
                "    PasswordHash  VARCHAR(255) NOT NULL," +
                "    AccountStatus VARCHAR(20)  NOT NULL CONSTRAINT DF_CUSTOMER_ACCOUNT_Status DEFAULT ('Active')," +
                "    CreatedDate   DATETIME     NOT NULL CONSTRAINT DF_CUSTOMER_ACCOUNT_Created DEFAULT (GETDATE())," +
                "    LastLoginDate DATETIME     NULL," +
                "    CONSTRAINT PK_CUSTOMER_ACCOUNT          PRIMARY KEY (AccountID)," +
                "    CONSTRAINT UQ_CUSTOMER_ACCOUNT_CUSTOMER UNIQUE (CustomerID)," +
                "    CONSTRAINT CK_CUSTOMER_ACCOUNT_STATUS   CHECK (AccountStatus IN ('Active', 'Inactive', 'Locked'))," +
                "    CONSTRAINT FK_CUSTOMER_ACCOUNT_CUSTOMER FOREIGN KEY (CustomerID) REFERENCES dbo.CUSTOMER (CustomerID)" +
                ")";

        try (Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(ddl);
            log.info("Table 'CUSTOMER_ACCOUNT' created successfully.");
        }
    }

    private void ensureStaffAccountTable(Connection conn) throws SQLException {
        if (tableExists(conn, "STAFF_ACCOUNT")) {
            log.debug("Table 'STAFF_ACCOUNT' already exists.");
            return;
        }

        log.info("Table 'STAFF_ACCOUNT' is missing. Creating table 'STAFF_ACCOUNT'...");
        String ddl = "CREATE TABLE dbo.STAFF_ACCOUNT (" +
                "    AccountID     INT          NOT NULL," +
                "    StaffID       INT          NOT NULL," +
                "    Username      VARCHAR(50)  NOT NULL," +
                "    PasswordHash  VARCHAR(255) NOT NULL," +
                "    AccountStatus VARCHAR(20)  NOT NULL CONSTRAINT DF_STAFF_ACCOUNT_Status DEFAULT ('Active')," +
                "    CreatedDate   DATETIME     NOT NULL CONSTRAINT DF_STAFF_ACCOUNT_Created DEFAULT (GETDATE())," +
                "    LastLoginDate DATETIME     NULL," +
                "    CONSTRAINT PK_STAFF_ACCOUNT          PRIMARY KEY (AccountID)," +
                "    CONSTRAINT UQ_STAFF_ACCOUNT_STAFF    UNIQUE (StaffID)," +
                "    CONSTRAINT UQ_STAFF_ACCOUNT_USERNAME UNIQUE (Username)," +
                "    CONSTRAINT CK_STAFF_ACCOUNT_STATUS   CHECK (AccountStatus IN ('Active', 'Inactive', 'Locked'))," +
                "    CONSTRAINT FK_STAFF_ACCOUNT_STAFF    FOREIGN KEY (StaffID) REFERENCES dbo.STAFF (StaffID)" +
                ")";

        try (Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(ddl);
            log.info("Table 'STAFF_ACCOUNT' created successfully.");
        }
    }

    private void bootstrapStaffAccountsIfMissing(Connection conn) throws SQLException {
        if (!tableExists(conn, "STAFF") || !tableExists(conn, "STAFF_ACCOUNT")) {
            return;
        }

        // Query all existing staff members
        String staffSql = "SELECT StaffID, Name, Email, Role FROM dbo.STAFF ORDER BY StaffID";
        String checkAccountSql = "SELECT COUNT(*) FROM dbo.STAFF_ACCOUNT WHERE StaffID = ?";
        String checkUsernameSql = "SELECT COUNT(*) FROM dbo.STAFF_ACCOUNT WHERE LOWER(Username) = LOWER(?)";
        String insertAccountSql = "INSERT INTO dbo.STAFF_ACCOUNT (AccountID, StaffID, Username, PasswordHash, AccountStatus, CreatedDate) " +
                "VALUES (?, ?, ?, ?, 'Active', GETDATE())";
        String maxIdSql = "SELECT ISNULL(MAX(AccountID), 0) + 1 FROM dbo.STAFF_ACCOUNT";

        try (PreparedStatement staffStmt = conn.prepareStatement(staffSql);
             ResultSet staffRs = staffStmt.executeQuery();
             PreparedStatement checkAccountStmt = conn.prepareStatement(checkAccountSql);
             PreparedStatement checkUsernameStmt = conn.prepareStatement(checkUsernameSql);
             PreparedStatement insertStmt = conn.prepareStatement(insertAccountSql)) {

            int createdCount = 0;
            while (staffRs.next()) {
                int staffId = staffRs.getInt("StaffID");
                String name = staffRs.getString("Name");
                String email = staffRs.getString("Email");
                String role = staffRs.getString("Role");

                // Check if this staff member already has an account
                checkAccountStmt.setInt(1, staffId);
                try (ResultSet accRs = checkAccountStmt.executeQuery()) {
                    if (accRs.next() && accRs.getInt(1) > 0) {
                        continue; // Account already exists; leave untouched
                    }
                }

                // Determine username for this staff member
                String baseUsername = determineDefaultUsername(staffId, role, email);
                String username = baseUsername;
                int suffix = 1;

                // Ensure username uniqueness
                while (true) {
                    checkUsernameStmt.setString(1, username);
                    try (ResultSet uRs = checkUsernameStmt.executeQuery()) {
                        if (uRs.next() && uRs.getInt(1) > 0) {
                            username = baseUsername + suffix++;
                        } else {
                            break;
                        }
                    }
                }

                // Get next AccountID
                int nextAccountId;
                try (Statement idStmt = conn.createStatement();
                     ResultSet idRs = idStmt.executeQuery(maxIdSql)) {
                    idRs.next();
                    nextAccountId = idRs.getInt(1);
                }

                // Hash password using PasswordUtil (PBKDF2 with random salt)
                String passwordHash = PasswordUtil.hash(defaultInitialPassword);

                insertStmt.setInt(1, nextAccountId);
                insertStmt.setInt(2, staffId);
                insertStmt.setString(3, username);
                insertStmt.setString(4, passwordHash);
                insertStmt.executeUpdate();

                createdCount++;
                log.info("Provisioned staff account for Staff ID: {} ({}) with username: '{}'", staffId, name, username);
            }

            if (createdCount > 0) {
                log.info("Successfully provisioned {} staff account(s) linked to existing STAFF records.", createdCount);
            }
        }
    }

    private String determineDefaultUsername(int staffId, String role, String email) {
        switch (staffId) {
            case 1: return "admin";
            case 2: return "ops.supervisor";
            case 3: return "kitchen.tharushi";
            case 4: return "kitchen.sunil";
            case 5: return "delivery.kasun";
            case 6: return "delivery.amal";
            case 7: return "finance";
            case 8: return "inventory";
            default:
                if (email != null && email.contains("@")) {
                    String prefix = email.substring(0, email.indexOf('@')).trim().toLowerCase();
                    if (!prefix.isEmpty()) {
                        return prefix;
                    }
                }
                return "staff" + staffId;
        }
    }
}
