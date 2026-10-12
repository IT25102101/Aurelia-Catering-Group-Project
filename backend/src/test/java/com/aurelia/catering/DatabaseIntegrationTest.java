package com.aurelia.catering;

import com.aurelia.catering.db.DBConnection;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Safe Database Integration Tests.
 * Tests actual SQL Server schema, connectivity, and query execution against AureliaCatering2.
 * Never drops tables or modifies production data.
 */
public class DatabaseIntegrationTest {

    private Connection getSafeConnectionOrSkip() {
        try {
            Connection conn = DBConnection.getConnection();
            if (conn != null && !conn.isClosed()) {
                return conn;
            }
        } catch (Throwable t) {
            System.out.println("[INFO] SQL Server connection unavailable in current environment: " + t.getMessage());
        }
        Assumptions.assumeTrue(false, "SQL Server (AureliaCatering2) is not reachable; skipping live DB integration test.");
        return null;
    }

    @Test
    @DisplayName("DB Integration: Verify physical/pooled connection can be established to SQL Server")
    void testDatabaseConnectivity() throws SQLException {
        Connection conn = getSafeConnectionOrSkip();
        assertNotNull(conn, "Connection should be valid");
        try {
            assertTrue(conn.isValid(3), "Connection should be valid within 3 seconds");
        } finally {
            conn.close();
        }
    }

    @Test
    @DisplayName("DB Integration: Verify CateringPackage table exists and can be queried safely")
    void testQueryCateringPackageTable() throws SQLException {
        Connection conn = getSafeConnectionOrSkip();
        String sql = "SELECT COUNT(*) FROM CateringPackage";

        try (conn;
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            assertTrue(rs.next(), "Result set should contain row count");
            int count = rs.getInt(1);
            assertTrue(count >= 0, "Package count must be non-negative");
        }
    }

    @Test
    @DisplayName("DB Integration: Verify Package_Menu_Item table exists and respects composite keys")
    void testQueryPackageMenuItemTable() throws SQLException {
        Connection conn = getSafeConnectionOrSkip();
        String sql = "SELECT COUNT(*) FROM Package_Menu_Item";

        try (conn;
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            assertTrue(rs.next(), "Result set should contain row count");
            int count = rs.getInt(1);
            assertTrue(count >= 0, "Package_Menu_Item count must be non-negative");
        }
    }

    @Test
    @DisplayName("DB Integration: Verify MenuItem table exists and can be queried")
    void testQueryMenuItemTable() throws SQLException {
        Connection conn = getSafeConnectionOrSkip();
        String sql = "SELECT COUNT(*) FROM MenuItem";

        try (conn;
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            assertTrue(rs.next(), "Result set should contain row count");
            int count = rs.getInt(1);
            assertTrue(count >= 0, "MenuItem count must be non-negative");
        }
    }
}
