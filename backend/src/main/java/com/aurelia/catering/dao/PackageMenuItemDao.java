package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.PackageMenuItem;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for Package_Menu_Item.
 * Matches table Package_Menu_Item in AureliaCatering2:
 * Columns: PackageID, MenuItemID, Quantity
 */
@Repository
public class PackageMenuItemDao {

    // ---------- READ (all menu items assigned to a package) ----------
    public List<PackageMenuItem> getByPackageId(int packageId) {
        List<PackageMenuItem> list = new ArrayList<>();
        String sql =
            "SELECT pmi.PackageID, pmi.MenuItemID, pmi.Quantity, " +
            "       m.ItemName AS menuItemName, m.Description AS menuItemDescription, " +
            "       m.Price AS menuItemPrice, m.Category AS menuItemCategory, " +
            "       p.PackageName AS packageName " +
            "FROM Package_Menu_Item pmi " +
            "LEFT JOIN MenuItem m ON pmi.MenuItemID = m.MenuItemID " +
            "LEFT JOIN CateringPackage p ON pmi.PackageID = p.PackageID " +
            "WHERE pmi.PackageID = ? " +
            "ORDER BY m.Category, m.ItemName";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, packageId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching package menu items for package " + packageId + ": " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- CHECK DUPLICATE ----------
    public boolean exists(int packageId, int menuItemId) {
        String sql = "SELECT COUNT(*) FROM Package_Menu_Item WHERE PackageID = ? AND MenuItemID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, packageId);
            stmt.setInt(2, menuItemId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error checking duplicate package menu item: " + e.getMessage(), e);
        }
        return false;
    }

    // ---------- CREATE (Assign Menu Item to Package) ----------
    public PackageMenuItem create(PackageMenuItem item) {
        if (exists(item.getPackageId(), item.getMenuItemId())) {
            throw new IllegalArgumentException("This menu item is already assigned to this catering package.");
        }

        String sql = "INSERT INTO Package_Menu_Item (PackageID, MenuItemID, Quantity) VALUES (?, ?, ?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, item.getPackageId());
            stmt.setInt(2, item.getMenuItemId());
            stmt.setInt(3, item.getQuantity() != null ? item.getQuantity() : 1);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error assigning menu item to package: " + e.getMessage(), e);
        }
        return item;
    }

    // ---------- DELETE (Remove Assignment by PackageID and MenuItemID) ----------
    public void delete(int packageId, int menuItemId) {
        String sql = "DELETE FROM Package_Menu_Item WHERE PackageID = ? AND MenuItemID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, packageId);
            stmt.setInt(2, menuItemId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error removing menu item from package: " + e.getMessage(), e);
        }
    }

    // ---------- DELETE (Remove Assignment by MenuItemID only) ----------
    public void deleteByMenuItemId(int menuItemId) {
        String sql = "DELETE FROM Package_Menu_Item WHERE MenuItemID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, menuItemId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error removing package menu item assignment: " + e.getMessage(), e);
        }
    }

    /** Maps a ResultSet row to a PackageMenuItem object */
    private PackageMenuItem mapRow(ResultSet rs) throws SQLException {
        PackageMenuItem item = new PackageMenuItem();
        item.setPackageId(rs.getInt("PackageID"));
        item.setMenuItemId(rs.getInt("MenuItemID"));
        item.setQuantity(rs.getInt("Quantity"));
        item.setMenuItemName(rs.getString("menuItemName"));
        item.setMenuItemDescription(rs.getString("menuItemDescription"));
        item.setMenuItemPrice(rs.getObject("menuItemPrice") != null ? rs.getDouble("menuItemPrice") : null);
        item.setMenuItemCategory(rs.getString("menuItemCategory"));
        item.setPackageName(rs.getString("packageName"));
        return item;
    }
}
