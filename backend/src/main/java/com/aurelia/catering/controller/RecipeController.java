package com.aurelia.catering.controller;

import com.aurelia.catering.dao.RecipeDao;
import com.aurelia.catering.model.Recipe;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Recipe Management.
 * Supports CRUD for menu item recipe ingredients.
 *
 * Major function: Phase 3 — Recipes & Automatic Inventory Deduction
 */
@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    @Autowired
    private RecipeDao recipeDao;

    // GET /api/recipes/menu-item/{menuItemId}
    @GetMapping("/menu-item/{menuItemId}")
    public List<Recipe> getByMenuItemId(@PathVariable("menuItemId") int menuItemId) {
        return recipeDao.getByMenuItemId(menuItemId);
    }

    // GET /api/recipes/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getById(@PathVariable("id") int id) {
        Recipe recipe = recipeDao.getById(id);
        if (recipe == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(recipe);
    }

    // POST /api/recipes
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Recipe recipe) {
        if (recipe.getMenuItemId() == null || recipe.getInventoryItemId() == null ||
            recipe.getQuantityPerGuest() == null || recipe.getQuantityPerGuest() <= 0) {
            return ResponseEntity.badRequest().body("menuItemId, inventoryItemId and a positive quantityPerGuest are required.");
        }
        try {
            return ResponseEntity.ok(recipeDao.create(recipe));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/recipes/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") int id, @RequestBody Recipe recipe) {
        if (recipeDao.getById(id) == null) {
            return ResponseEntity.notFound().build();
        }
        if (recipe.getMenuItemId() == null || recipe.getInventoryItemId() == null ||
            recipe.getQuantityPerGuest() == null || recipe.getQuantityPerGuest() <= 0) {
            return ResponseEntity.badRequest().body("menuItemId, inventoryItemId and a positive quantityPerGuest are required.");
        }
        try {
            return ResponseEntity.ok(recipeDao.update(id, recipe));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/recipes/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") int id) {
        if (recipeDao.getById(id) == null) {
            return ResponseEntity.notFound().build();
        }
        recipeDao.delete(id);
        return ResponseEntity.ok().build();
    }
}
