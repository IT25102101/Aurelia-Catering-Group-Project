package com.aurelia.catering.config;

import com.aurelia.catering.db.DBConnection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Runs once when the server has started and writes a clear message to the log if the database
 * is unreachable or Aurelia_Database.sql has not been run. It never stops the server.
 */
@Component
public class DatabaseStartupCheck implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseStartupCheck.class);

    @Override
    public void run(String... args) {
        try (Connection conn = DBConnection.getConnection()) {
            boolean ok = true;
            ok &= exists(conn, "SELECT OBJECT_ID('dbo.DeductInventoryForOrder', 'P')", "stored procedure DeductInventoryForOrder");
            ok &= exists(conn, "SELECT OBJECT_ID('dbo.GetInventoryNeedForOrder', 'IF')", "function GetInventoryNeedForOrder");
            ok &= exists(conn, "SELECT COL_LENGTH('dbo.RECIPE_INGREDIENT', 'RecipeIngredientID')", "column RECIPE_INGREDIENT.RecipeIngredientID");
            ok &= exists(conn, "SELECT COL_LENGTH('dbo.[ORDER]', 'InventoryDeducted')", "column ORDER.InventoryDeducted");
            if (ok) {
                log.info("Database check passed: connected to SQL Server and the Aurelia objects are present.");
            } else {
                log.warn("The database is reachable but out of date. Run Aurelia_Database.sql in SSMS, then restart.");
            }
        } catch (SQLException e) {
            log.warn("Database check failed - the server is running but API calls that need the database will fail. {}",
                    e.getMessage());
        }
    }

    private boolean exists(Connection conn, String sql, String what) throws SQLException {
        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            rs.next();
            rs.getObject(1);
            if (rs.wasNull()) {
                log.warn("Missing in database: {}", what);
                return false;
            }
            return true;
        }
    }
}
