package com.aurelia.catering.dao;

import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.Recipe;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Plain JDBC DAO for recipe ingredients.
 *
 * Database tables used:
 *   RECIPE             - one row per menu item (RecipeID, MenuItemID, RecipeName, Description)
 *   RECIPE_INGREDIENT  - one row per ingredient (RecipeIngredientID, RecipeID, InventoryItemID, QuantityRequired)
 *   MenuItem, INVENTORY_ITEM - joined to show names, units and stock
 *
 * The REST/JSON shape (Recipe model) is unchanged: one Recipe object = one ingredient line.
 * Recipe.id is RECIPE_INGREDIENT.RecipeIngredientID. quantityPerGuest is the amount needed for
 * ONE serving of the menu item (RECIPE_INGREDIENT.QuantityRequired). The unit always comes from
 * the inventory item, so a "unit" sent by the client is ignored.
 *
 * Major function: Phase 3 - Recipes & Automatic Inventory Deduction
 */
@Repository
public class RecipeDao {

    private static final String SELECT_BASE =
            "SELECT ri.RecipeIngredientID, r.MenuItemID, ri.InventoryItemID, ri.QuantityRequired, " +
            "       m.ItemName AS MenuItemName, i.ItemName AS IngredientName, " +
            "       i.Unit AS InventoryUnit, i.Quantity AS QuantityInStock " +
            "FROM RECIPE_INGREDIENT ri " +
            "INNER JOIN RECIPE r         ON r.RecipeID = ri.RecipeID " +
            "INNER JOIN MenuItem m       ON m.MenuItemID = r.MenuItemID " +
            "INNER JOIN INVENTORY_ITEM i ON i.InventoryItemID = ri.InventoryItemID ";

    // ---------- READ by Menu Item ID ----------
    public List<Recipe> getByMenuItemId(int menuItemId) {
        List<Recipe> list = new ArrayList<>();
        String sql = SELECT_BASE + "WHERE r.MenuItemID = ? ORDER BY ri.RecipeIngredientID ASC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, menuItemId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching recipes for menu item " + menuItemId + ": " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- READ (one ingredient line, by id) ----------
    public Recipe getById(int id) {
        String sql = SELECT_BASE + "WHERE ri.RecipeIngredientID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching recipe ingredient " + id + ": " + e.getMessage(), e);
        }
        return null;
    }

    // ---------- CREATE ----------
    public Recipe create(Recipe recipe) {
        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            int recipeId = findOrCreateRecipeId(conn, recipe.getMenuItemId());
            ensureIngredientNotUsed(conn, recipeId, recipe.getInventoryItemId(), null);

            int newId;
            try (PreparedStatement idStmt = conn.prepareStatement(
                    "SELECT ISNULL(MAX(RecipeIngredientID), 0) + 1 FROM RECIPE_INGREDIENT WITH (UPDLOCK, HOLDLOCK)");
                 ResultSet rs = idStmt.executeQuery()) {
                rs.next();
                newId = rs.getInt(1);
            }

            try (PreparedStatement stmt = conn.prepareStatement(
                    "INSERT INTO RECIPE_INGREDIENT (RecipeIngredientID, RecipeID, InventoryItemID, QuantityRequired) " +
                    "VALUES (?, ?, ?, ?)")) {
                stmt.setInt(1, newId);
                stmt.setInt(2, recipeId);
                stmt.setInt(3, recipe.getInventoryItemId());
                stmt.setDouble(4, recipe.getQuantityPerGuest() != null ? recipe.getQuantityPerGuest() : 0.0);
                stmt.executeUpdate();
            }

            conn.commit();
            recipe.setId(newId);

        } catch (SQLException e) {
            rollbackQuietly(conn);
            throw new RuntimeException("Error creating recipe ingredient: " + e.getMessage(), e);
        } catch (RuntimeException e) {
            rollbackQuietly(conn);
            throw e;
        } finally {
            closeQuietly(conn);
        }

        // Return refreshed ingredient with joined names
        Recipe created = getById(recipe.getId());
        return created != null ? created : recipe;
    }

    // ---------- UPDATE ----------
    public Recipe update(int id, Recipe recipe) {
        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            int recipeId = findOrCreateRecipeId(conn, recipe.getMenuItemId());
            ensureIngredientNotUsed(conn, recipeId, recipe.getInventoryItemId(), id);

            try (PreparedStatement stmt = conn.prepareStatement(
                    "UPDATE RECIPE_INGREDIENT SET RecipeID = ?, InventoryItemID = ?, QuantityRequired = ? " +
                    "WHERE RecipeIngredientID = ?")) {
                stmt.setInt(1, recipeId);
                stmt.setInt(2, recipe.getInventoryItemId());
                stmt.setDouble(3, recipe.getQuantityPerGuest() != null ? recipe.getQuantityPerGuest() : 0.0);
                stmt.setInt(4, id);
                stmt.executeUpdate();
            }

            conn.commit();

        } catch (SQLException e) {
            rollbackQuietly(conn);
            throw new RuntimeException("Error updating recipe ingredient " + id + ": " + e.getMessage(), e);
        } catch (RuntimeException e) {
            rollbackQuietly(conn);
            throw e;
        } finally {
            closeQuietly(conn);
        }

        recipe.setId(id);
        Recipe updated = getById(id);
        return updated != null ? updated : recipe;
    }

    // ---------- DELETE ----------
    public void delete(int id) {
        String sql = "DELETE FROM RECIPE_INGREDIENT WHERE RecipeIngredientID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting recipe ingredient " + id + ": " + e.getMessage(), e);
        }
    }

    // ---------- helpers ----------

    /** Returns the RECIPE row of a menu item, creating it the first time an ingredient is added. */
    private int findOrCreateRecipeId(Connection conn, Integer menuItemId) throws SQLException {
        if (menuItemId == null) {
            throw new IllegalArgumentException("menuItemId is required.");
        }

        try (PreparedStatement find = conn.prepareStatement("SELECT RecipeID FROM RECIPE WHERE MenuItemID = ?")) {
            find.setInt(1, menuItemId);
            try (ResultSet rs = find.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }

        int newRecipeId;
        try (PreparedStatement idStmt = conn.prepareStatement(
                "SELECT ISNULL(MAX(RecipeID), 0) + 1 FROM RECIPE WITH (UPDLOCK, HOLDLOCK)");
             ResultSet rs = idStmt.executeQuery()) {
            rs.next();
            newRecipeId = rs.getInt(1);
        }

        try (PreparedStatement ins = conn.prepareStatement(
                "INSERT INTO RECIPE (RecipeID, MenuItemID, RecipeName, Description) " +
                "SELECT ?, MenuItemID, LEFT(ItemName + ' Recipe', 100), 'Recipe for ' + ItemName " +
                "FROM MenuItem WHERE MenuItemID = ?")) {
            ins.setInt(1, newRecipeId);
            ins.setInt(2, menuItemId);
            if (ins.executeUpdate() == 0) {
                throw new IllegalArgumentException("Menu item " + menuItemId + " not found.");
            }
        }
        return newRecipeId;
    }

    /** A recipe may list each inventory item only once (RECIPE_INGREDIENT has UNIQUE(RecipeID, InventoryItemID)). */
    private void ensureIngredientNotUsed(Connection conn, int recipeId, Integer inventoryItemId,
                                         Integer ignoreIngredientId) throws SQLException {
        String sql = "SELECT 1 FROM RECIPE_INGREDIENT WHERE RecipeID = ? AND InventoryItemID = ?" +
                     (ignoreIngredientId != null ? " AND RecipeIngredientID <> ?" : "");
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, recipeId);
            stmt.setInt(2, inventoryItemId);
            if (ignoreIngredientId != null) {
                stmt.setInt(3, ignoreIngredientId);
            }
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    throw new IllegalArgumentException("This ingredient is already in the recipe. Edit the existing line instead.");
                }
            }
        }
    }

    private void rollbackQuietly(Connection conn) {
        if (conn != null) {
            try {
                conn.rollback();
            } catch (SQLException ignored) {
                // nothing more to do
            }
        }
    }

    private void closeQuietly(Connection conn) {
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException ignored) {
                // nothing more to do
            }
        }
    }

    /** Map ResultSet row to Recipe object */
    private Recipe mapRow(ResultSet rs) throws SQLException {
        Recipe r = new Recipe();
        r.setId(rs.getInt("RecipeIngredientID"));
        r.setMenuItemId(rs.getInt("MenuItemID"));
        r.setInventoryItemId(rs.getInt("InventoryItemID"));
        r.setQuantityPerGuest(rs.getDouble("QuantityRequired"));

        String unit = rs.getString("InventoryUnit");
        r.setUnit(unit);
        r.setInventoryUnit(unit);

        // Joined columns
        r.setMenuItemName(rs.getString("MenuItemName"));
        r.setIngredientName(rs.getString("IngredientName"));
        double stock = rs.getDouble("QuantityInStock");
        if (!rs.wasNull()) {
            r.setQuantityInStock(stock);
        }
        return r;
    }
}
