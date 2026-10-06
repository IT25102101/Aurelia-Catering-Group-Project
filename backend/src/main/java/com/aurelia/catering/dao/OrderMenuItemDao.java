package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.OrderMenuItem;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for Order_Menu_Item table in AureliaCatering2.
 * Columns: OrderID, MenuItemID, Quantity
 */
@Repository
public class OrderMenuItemDao {

    // ---------- READ (by OrderID) ----------
    public List<OrderMenuItem> getByOrderId(int orderId) {
        List<OrderMenuItem> list = new ArrayList<>();
        String sql =
            "SELECT omi.OrderID, omi.MenuItemID, omi.Quantity, " +
            "       m.ItemName AS menuItemName, m.Price AS menuItemPrice, m.Category AS menuItemCategory " +
            "FROM Order_Menu_Item omi " +
            "LEFT JOIN MenuItem m ON omi.MenuItemID = m.MenuItemID " +
            "WHERE omi.OrderID = ? " +
            "ORDER BY omi.MenuItemID";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching menu items for order " + orderId + ": " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- CREATE ----------
    public OrderMenuItem create(OrderMenuItem item) {
        String sql = "INSERT INTO Order_Menu_Item (OrderID, MenuItemID, Quantity) VALUES (?, ?, ?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, item.getOrderId());
            stmt.setInt(2, item.getMenuItemId());
            stmt.setInt(3, item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error adding menu item to order: " + e.getMessage(), e);
        }
        return item;
    }

    // ---------- DELETE (by OrderID and MenuItemID) ----------
    public void delete(int orderId, int menuItemId) {
        String sql = "DELETE FROM Order_Menu_Item WHERE OrderID = ? AND MenuItemID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, orderId);
            stmt.setInt(2, menuItemId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error removing menu item from order: " + e.getMessage(), e);
        }
    }

    // ---------- DELETE (all items for an OrderID) ----------
    public void deleteByOrderId(int orderId) {
        String sql = "DELETE FROM Order_Menu_Item WHERE OrderID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, orderId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error removing all menu items for order: " + e.getMessage(), e);
        }
    }

    /** Helper method to map ResultSet row to OrderMenuItem */
    private OrderMenuItem mapRow(ResultSet rs) throws SQLException {
        OrderMenuItem item = new OrderMenuItem();
        item.setOrderId(rs.getInt("OrderID"));
        item.setMenuItemId(rs.getInt("MenuItemID"));
        item.setQuantity(rs.getInt("Quantity"));
        item.setMenuItemName(rs.getString("menuItemName"));
        item.setPrice(rs.getObject("menuItemPrice") != null ? rs.getDouble("menuItemPrice") : null);
        item.setCategory(rs.getString("menuItemCategory"));
        return item;
    }
}
