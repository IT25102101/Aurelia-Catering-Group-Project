package com.aurelia.catering.controller;

import com.aurelia.catering.dao.InventoryItemDao;
import com.aurelia.catering.model.InventoryItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Inventory Item Management.
 * Base URL: /api/inventory-items
 */
@RestController
@RequestMapping("/api/inventory-items")
public class InventoryItemController {

    @Autowired
    private InventoryItemDao inventoryItemDao;

    // GET /api/inventory-items
    @GetMapping
    public List<InventoryItem> getAll() {
        return inventoryItemDao.getAll();
    }

    // GET /api/inventory-items/{id}
    @GetMapping("/{id}")
    public ResponseEntity<InventoryItem> getById(@PathVariable("id") int id) {
        InventoryItem inventoryItem = inventoryItemDao.getById(id);
        if (inventoryItem == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(inventoryItem);
    }

    // POST /api/inventory-items
    @PostMapping
    public ResponseEntity<InventoryItem> create(@RequestBody InventoryItem inventoryItem) {
        if (inventoryItem.getItemName() == null || inventoryItem.getItemName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(inventoryItemDao.create(inventoryItem));
    }

    // PUT /api/inventory-items/{id}
    @PutMapping("/{id}")
    public ResponseEntity<InventoryItem> update(@PathVariable("id") int id, @RequestBody InventoryItem inventoryItem) {
        if (inventoryItem.getItemName() == null || inventoryItem.getItemName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (inventoryItemDao.getById(id) == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(inventoryItemDao.update(id, inventoryItem));
    }

    // DELETE /api/inventory-items/{id}
    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") int id) {
        inventoryItemDao.delete(id);
    }
}
