package com.aurelia.catering.controller;

import com.aurelia.catering.dao.PackageMenuItemDao;
import com.aurelia.catering.model.PackageMenuItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Package -> Menu Item assignments.
 * Supports adding, viewing, and removing menu items assigned to catering packages.
 * Base URL: /api/package-menu-items
 */
@RestController
@RequestMapping("/api/package-menu-items")
public class PackageMenuItemController {

    @Autowired
    private PackageMenuItemDao packageMenuItemDao;

    // GET /api/package-menu-items/package/{packageId}
    @GetMapping("/package/{packageId}")
    public List<PackageMenuItem> getByPackageId(@PathVariable("packageId") int packageId) {
        return packageMenuItemDao.getByPackageId(packageId);
    }

    // POST /api/package-menu-items
    @PostMapping
    public ResponseEntity<?> create(@RequestBody PackageMenuItem item) {
        if (item.getPackageId() == null || item.getMenuItemId() == null) {
            return ResponseEntity.badRequest().body("Package ID and Menu Item ID are required.");
        }

        try {
            PackageMenuItem created = packageMenuItemDao.create(item);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // DELETE /api/package-menu-items/{id} (by menuItemId)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") int id) {
        packageMenuItemDao.deleteByMenuItemId(id);
        return ResponseEntity.ok().build();
    }

    // DELETE /api/package-menu-items/{packageId}/{menuItemId}
    @DeleteMapping("/{packageId}/{menuItemId}")
    public ResponseEntity<Void> deleteByPackageAndItem(
            @PathVariable("packageId") int packageId,
            @PathVariable("menuItemId") int menuItemId) {
        packageMenuItemDao.delete(packageId, menuItemId);
        return ResponseEntity.ok().build();
    }
}
