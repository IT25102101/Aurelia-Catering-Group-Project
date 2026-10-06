package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.Staff;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for Staff.
 * Matches table Staff in AureliaCatering2:
 * Columns: StaffID, Name, Phone, Email, Role
 */
@Repository
public class StaffDao {

    // ---------- READ (all rows) ----------
    public List<Staff> getAll() {
        List<Staff> list = new ArrayList<>();
        String sql = "SELECT StaffID, Name, Phone, Email, Role FROM Staff";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all staff: " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- READ (one row, by id) ----------
    public Staff getById(int id) {
        String sql = "SELECT StaffID, Name, Phone, Email, Role FROM Staff WHERE StaffID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching staff with id " + id, e);
        }
        return null;
    }

    // ---------- CREATE ----------
    public Staff create(Staff staff) {
        int newId = 1;
        String idSql = "SELECT ISNULL(MAX(StaffID), 0) + 1 FROM Staff";
        String insertSql = "INSERT INTO Staff (StaffID, Name, Phone, Email, Role) VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            try (PreparedStatement idStmt = conn.prepareStatement(idSql);
                 ResultSet rs = idStmt.executeQuery()) {
                if (rs.next()) {
                    newId = rs.getInt(1);
                }
            }

            try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                stmt.setInt(1, newId);
                stmt.setString(2, staff.getName());
                stmt.setString(3, staff.getPhone());
                stmt.setString(4, staff.getEmail());
                stmt.setString(5, staff.getRole());
                stmt.executeUpdate();
            }

            staff.setId(newId);
        } catch (SQLException e) {
            throw new RuntimeException("Error creating staff: " + e.getMessage(), e);
        }
        return staff;
    }

    // ---------- UPDATE ----------
    public Staff update(int id, Staff staff) {
        String sql = "UPDATE Staff SET Name = ?, Phone = ?, Email = ?, Role = ? WHERE StaffID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, staff.getName());
            stmt.setString(2, staff.getPhone());
            stmt.setString(3, staff.getEmail());
            stmt.setString(4, staff.getRole());
            stmt.setInt(5, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating staff with id " + id, e);
        }
        staff.setId(id);
        return staff;
    }

    // ---------- DELETE ----------
    public void delete(int id) {
        String sql = "DELETE FROM Staff WHERE StaffID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting staff with id " + id, e);
        }
    }

    /** Turns one row of the ResultSet into a Staff object. */
    private Staff mapRow(ResultSet rs) throws SQLException {
        Staff staff = new Staff();
        staff.setId(rs.getInt("StaffID"));
        staff.setName(rs.getString("Name"));
        staff.setPhone(rs.getString("Phone"));
        staff.setEmail(rs.getString("Email"));
        staff.setRole(rs.getString("Role"));
        return staff;
    }
}
