package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.MenuItem;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for MenuItem.
 * Matches table MenuItem in AureliaCatering2:
 * Columns: MenuItemID, ItemName, Description, Price, Category
 */
@Repository
public class MenuItemDao {

    // ---------- READ (all rows) ----------
    public List<MenuItem> getAll() {
        List<MenuItem> list = new ArrayList<>();
        String sql = "SELECT MenuItemID, ItemName, Description, Price, Category FROM MenuItem";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all menu items: " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- READ (one row, by id) ----------
    public MenuItem getById(int id) {
        String sql = "SELECT MenuItemID, ItemName, Description, Price, Category FROM MenuItem WHERE MenuItemID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching menu item with id " + id, e);
        }
        return null;
    }

    // ---------- CREATE ----------
    public MenuItem create(MenuItem menuItem) {
        int newId = 1;
        String idSql = "SELECT ISNULL(MAX(MenuItemID), 0) + 1 FROM MenuItem";
        String insertSql = "INSERT INTO MenuItem (MenuItemID, ItemName, Description, Price, Category) VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            try (PreparedStatement idStmt = conn.prepareStatement(idSql);
                 ResultSet rs = idStmt.executeQuery()) {
                if (rs.next()) {
                    newId = rs.getInt(1);
                }
            }

            try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                stmt.setInt(1, newId);
                stmt.setString(2, menuItem.getName());
                stmt.setString(3, menuItem.getDescription());
                if (menuItem.getPrice() != null) {
                    stmt.setDouble(4, menuItem.getPrice());
                } else {
                    stmt.setNull(4, Types.DECIMAL);
                }
                stmt.setString(5, menuItem.getCategory());
                stmt.executeUpdate();
            }

            menuItem.setId(newId);
        } catch (SQLException e) {
            throw new RuntimeException("Error creating menu item: " + e.getMessage(), e);
        }
        return menuItem;
    }

    // ---------- UPDATE ----------
    public MenuItem update(int id, MenuItem menuItem) {
        String sql = "UPDATE MenuItem SET ItemName = ?, Description = ?, Price = ?, Category = ? WHERE MenuItemID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, menuItem.getName());
            stmt.setString(2, menuItem.getDescription());
            if (menuItem.getPrice() != null) {
                stmt.setDouble(3, menuItem.getPrice());
            } else {
                stmt.setNull(3, Types.DECIMAL);
            }
            stmt.setString(4, menuItem.getCategory());
            stmt.setInt(5, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating menu item with id " + id, e);
        }
        menuItem.setId(id);
        return menuItem;
    }

    // ---------- DELETE ----------
    public void delete(int id) {
        String sql = "DELETE FROM MenuItem WHERE MenuItemID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting menu item with id " + id, e);
        }
    }

    /** Turns one row of the ResultSet into a MenuItem object. */
    private MenuItem mapRow(ResultSet rs) throws SQLException {
        MenuItem menuItem = new MenuItem();
        menuItem.setId(rs.getInt("MenuItemID"));
        menuItem.setName(rs.getString("ItemName"));
        menuItem.setDescription(rs.getString("Description"));
        menuItem.setPrice(rs.getDouble("Price"));
        menuItem.setCategory(rs.getString("Category"));
        return menuItem;
    }
}
