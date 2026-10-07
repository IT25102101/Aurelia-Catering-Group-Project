package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.InventoryItem;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for InventoryItem.
 * Matches table Inventory_Item in AureliaCatering2:
 * Columns: InventoryItemID, ItemName, Quantity, Unit, ReorderLevel
 */
@Repository
public class InventoryItemDao {

    // ---------- READ (all rows) ----------
    public List<InventoryItem> getAll() {
        List<InventoryItem> list = new ArrayList<>();
        String sql = "SELECT InventoryItemID, ItemName, Quantity, Unit, ReorderLevel FROM Inventory_Item";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all inventory items: " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- READ (one row, by id) ----------
    public InventoryItem getById(int id) {
        String sql = "SELECT InventoryItemID, ItemName, Quantity, Unit, ReorderLevel FROM Inventory_Item WHERE InventoryItemID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching inventory item with id " + id, e);
        }
        return null;
    }

    // ---------- CREATE ----------
    public InventoryItem create(InventoryItem inventoryItem) {
        int newId = 1;
        String idSql = "SELECT ISNULL(MAX(InventoryItemID), 0) + 1 FROM Inventory_Item";
        String insertSql = "INSERT INTO Inventory_Item (InventoryItemID, ItemName, Quantity, Unit, ReorderLevel) VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            try (PreparedStatement idStmt = conn.prepareStatement(idSql);
                 ResultSet rs = idStmt.executeQuery()) {
                if (rs.next()) {
                    newId = rs.getInt(1);
                }
            }

            try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                stmt.setInt(1, newId);
                stmt.setString(2, inventoryItem.getItemName());
                if (inventoryItem.getQuantity() != null) {
                    stmt.setDouble(3, inventoryItem.getQuantity());
                } else {
                    stmt.setDouble(3, 0.0);
                }
                stmt.setString(4, inventoryItem.getUnit());
                if (inventoryItem.getReorderLevel() != null) {
                    stmt.setDouble(5, inventoryItem.getReorderLevel());
                } else {
                    stmt.setDouble(5, 0.0);
                }
                stmt.executeUpdate();
            }

            inventoryItem.setId(newId);
        } catch (SQLException e) {
            throw new RuntimeException("Error creating inventory item: " + e.getMessage(), e);
        }
        return inventoryItem;
    }

    // ---------- UPDATE ----------
    public InventoryItem update(int id, InventoryItem inventoryItem) {
        String sql = "UPDATE Inventory_Item SET ItemName = ?, Quantity = ?, Unit = ?, ReorderLevel = ? WHERE InventoryItemID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, inventoryItem.getItemName());
            if (inventoryItem.getQuantity() != null) {
                stmt.setDouble(2, inventoryItem.getQuantity());
            } else {
                stmt.setDouble(2, 0.0);
            }
            stmt.setString(3, inventoryItem.getUnit());
            if (inventoryItem.getReorderLevel() != null) {
                stmt.setDouble(4, inventoryItem.getReorderLevel());
            } else {
                stmt.setDouble(4, 0.0);
            }
            stmt.setInt(5, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating inventory item with id " + id, e);
        }
        inventoryItem.setId(id);
        return inventoryItem;
    }

    // ---------- DELETE ----------
    public void delete(int id) {
        String sql = "DELETE FROM Inventory_Item WHERE InventoryItemID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting inventory item with id " + id, e);
        }
    }

    /** Turns one row of the ResultSet into an InventoryItem object. */
    private InventoryItem mapRow(ResultSet rs) throws SQLException {
        InventoryItem inventoryItem = new InventoryItem();
        inventoryItem.setId(rs.getInt("InventoryItemID"));
        inventoryItem.setItemName(rs.getString("ItemName"));
        inventoryItem.setQuantity(rs.getDouble("Quantity"));
        inventoryItem.setUnit(rs.getString("Unit"));
        inventoryItem.setReorderLevel(rs.getDouble("ReorderLevel"));
        return inventoryItem;
    }
}
