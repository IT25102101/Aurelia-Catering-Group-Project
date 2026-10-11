package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.CateringPackage;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for CateringPackage.
 * Matches table CateringPackage in AureliaCatering2:
 * Columns: PackageID, PackageName, Description, Price, PackageType
 */
@Repository
public class CateringPackageDao {

    // ---------- READ (all rows) ----------
    public List<CateringPackage> getAll() {
        List<CateringPackage> list = new ArrayList<>();
        String sql = "SELECT PackageID, PackageName, Description, Price, PackageType FROM CateringPackage";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all catering packages: " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- READ (one row, by id) ----------
    public CateringPackage getById(int id) {
        String sql = "SELECT PackageID, PackageName, Description, Price, PackageType FROM CateringPackage WHERE PackageID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching catering package with id " + id, e);
        }
        return null;
    }

    // ---------- CREATE ----------
    public CateringPackage create(CateringPackage cateringPackage) {
        int newId = 1;
        String idSql = "SELECT ISNULL(MAX(PackageID), 0) + 1 FROM CateringPackage";
        String insertSql = "INSERT INTO CateringPackage (PackageID, PackageName, Description, Price, PackageType) VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            try (PreparedStatement idStmt = conn.prepareStatement(idSql);
                 ResultSet rs = idStmt.executeQuery()) {
                if (rs.next()) {
                    newId = rs.getInt(1);
                }
            }

            try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                stmt.setInt(1, newId);
                stmt.setString(2, cateringPackage.getName());
                stmt.setString(3, cateringPackage.getDescription());
                if (cateringPackage.getPrice() != null) {
                    stmt.setDouble(4, cateringPackage.getPrice());
                } else {
                    stmt.setNull(4, Types.DECIMAL);
                }
                stmt.setString(5, cateringPackage.getPackageType() != null ? cateringPackage.getPackageType() : "General");
                stmt.executeUpdate();
            }

            cateringPackage.setId(newId);
        } catch (SQLException e) {
            throw new RuntimeException("Error creating catering package: " + e.getMessage(), e);
        }
        return cateringPackage;
    }

    // ---------- UPDATE ----------
    public CateringPackage update(int id, CateringPackage cateringPackage) {
        String sql = "UPDATE CateringPackage SET PackageName = ?, Description = ?, Price = ?, PackageType = ? WHERE PackageID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, cateringPackage.getName());
            stmt.setString(2, cateringPackage.getDescription());
            if (cateringPackage.getPrice() != null) {
                stmt.setDouble(3, cateringPackage.getPrice());
            } else {
                stmt.setNull(3, Types.DECIMAL);
            }
            stmt.setString(4, cateringPackage.getPackageType() != null ? cateringPackage.getPackageType() : "General");
            stmt.setInt(5, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating catering package with id " + id, e);
        }
        cateringPackage.setId(id);
        return cateringPackage;
    }

    // ---------- DELETE ----------
    public void delete(int id) {
        String sql = "DELETE FROM CateringPackage WHERE PackageID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting catering package with id " + id, e);
        }
    }

    /** Turns one row of the ResultSet into a CateringPackage object. */
    private CateringPackage mapRow(ResultSet rs) throws SQLException {
        CateringPackage cateringPackage = new CateringPackage();
        cateringPackage.setId(rs.getInt("PackageID"));
        cateringPackage.setName(rs.getString("PackageName"));
        cateringPackage.setDescription(rs.getString("Description"));
        cateringPackage.setPrice(rs.getDouble("Price"));
        try {
            String pType = rs.getString("PackageType");
            if (pType != null && !pType.trim().isEmpty()) {
                cateringPackage.setPackageType(pType);
            }
        } catch (SQLException ignored) {
            // fallback if column not in select
        }
        return cateringPackage;
    }
}
