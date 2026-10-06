package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.QuotationItem;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for QuotationItem.
 * Matches table Quotation_Item in AureliaCatering2:
 * Columns: QuotationItemID, QuotationID, Description, Quantity, UnitPrice
 */
@Repository
public class QuotationItemDao {

    // ---------- READ (all quotation items) ----------
    public List<QuotationItem> getAllQuotationItems() {
        List<QuotationItem> list = new ArrayList<>();
        String sql = "SELECT QuotationItemID, QuotationID, Description, Quantity, UnitPrice FROM Quotation_Item ORDER BY QuotationItemID ASC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all quotation items: " + e.getMessage(), e);
        }
        return list;
    }

    public List<QuotationItem> getAll() {
        return getAllQuotationItems();
    }

    // ---------- READ (by QuotationItemID) ----------
    public QuotationItem getQuotationItemById(int quotationItemId) {
        String sql = "SELECT QuotationItemID, QuotationID, Description, Quantity, UnitPrice FROM Quotation_Item WHERE QuotationItemID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, quotationItemId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching quotation item with id " + quotationItemId + ": " + e.getMessage(), e);
        }
        return null;
    }

    public QuotationItem getById(int id) {
        return getQuotationItemById(id);
    }

    // ---------- READ (by QuotationID) ----------
    public List<QuotationItem> getItemsByQuotationId(int quotationId) {
        List<QuotationItem> list = new ArrayList<>();
        String sql = "SELECT QuotationItemID, QuotationID, Description, Quantity, UnitPrice FROM Quotation_Item WHERE QuotationID = ? ORDER BY QuotationItemID ASC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, quotationId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching quotation items for quotation " + quotationId + ": " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- CREATE ----------
    public QuotationItem createQuotationItem(QuotationItem item) {
        int newId = 1;
        String idSql = "SELECT ISNULL(MAX(QuotationItemID), 0) + 1 FROM Quotation_Item";
        String insertSql = "INSERT INTO Quotation_Item (QuotationItemID, QuotationID, Description, Quantity, UnitPrice) VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            if (item.getQuotationItemId() != null && item.getQuotationItemId() > 0) {
                newId = item.getQuotationItemId();
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
                stmt.setInt(2, item.getQuotationId());
                stmt.setString(3, item.getDescription());

                BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ONE;
                stmt.setBigDecimal(4, qty);

                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                stmt.setBigDecimal(5, unitPrice);

                stmt.executeUpdate();
            }

            item.setQuotationItemId(newId);
        } catch (SQLException e) {
            throw new RuntimeException("Error creating quotation item: " + e.getMessage(), e);
        }
        return item;
    }

    public QuotationItem create(QuotationItem item) {
        return createQuotationItem(item);
    }

    // ---------- UPDATE ----------
    public QuotationItem updateQuotationItem(QuotationItem item) {
        String sql = "UPDATE Quotation_Item SET QuotationID = ?, Description = ?, Quantity = ?, UnitPrice = ? WHERE QuotationItemID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, item.getQuotationId());
            stmt.setString(2, item.getDescription());

            BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ONE;
            stmt.setBigDecimal(3, qty);

            BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
            stmt.setBigDecimal(4, unitPrice);

            stmt.setInt(5, item.getQuotationItemId());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating quotation item " + item.getQuotationItemId() + ": " + e.getMessage(), e);
        }
        return item;
    }

    public QuotationItem update(int id, QuotationItem item) {
        item.setQuotationItemId(id);
        return updateQuotationItem(item);
    }

    // ---------- DELETE ----------
    public void deleteQuotationItem(int quotationItemId) {
        String sql = "DELETE FROM Quotation_Item WHERE QuotationItemID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, quotationItemId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting quotation item " + quotationItemId + ": " + e.getMessage(), e);
        }
    }

    public void delete(int id) {
        deleteQuotationItem(id);
    }

    /** Helper method to map ResultSet row to QuotationItem object */
    private QuotationItem mapRow(ResultSet rs) throws SQLException {
        QuotationItem item = new QuotationItem();
        item.setQuotationItemId(rs.getInt("QuotationItemID"));
        item.setQuotationId(rs.getInt("QuotationID"));
        item.setDescription(rs.getString("Description"));
        item.setQuantity(rs.getBigDecimal("Quantity"));
        item.setUnitPrice(rs.getBigDecimal("UnitPrice"));
        return item;
    }
}
