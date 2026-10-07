package com.aurelia.catering.controller;

import com.aurelia.catering.dao.MenuItemDao;
import com.aurelia.catering.model.MenuItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Menu Item Management.
 * Base URL: /api/menu-items
 */
@RestController
@RequestMapping("/api/menu-items")
public class MenuItemController {

    @Autowired
    private MenuItemDao menuItemDao;

    // GET /api/menu-items
    @GetMapping
    public List<MenuItem> getAll() {
        return menuItemDao.getAll();
    }

    // GET /api/menu-items/{id}
    @GetMapping("/{id}")
    public ResponseEntity<MenuItem> getById(@PathVariable("id") int id) {
        MenuItem menuItem = menuItemDao.getById(id);
        if (menuItem == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(menuItem);
    }

    // POST /api/menu-items
    @PostMapping
    public ResponseEntity<MenuItem> create(@RequestBody MenuItem menuItem) {
        if (menuItem.getName() == null || menuItem.getName().trim().isEmpty() || menuItem.getPrice() == null || menuItem.getPrice() < 0) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(menuItemDao.create(menuItem));
    }

    // PUT /api/menu-items/{id}
    @PutMapping("/{id}")
    public ResponseEntity<MenuItem> update(@PathVariable("id") int id, @RequestBody MenuItem menuItem) {
        if (menuItem.getName() == null || menuItem.getName().trim().isEmpty() || menuItem.getPrice() == null || menuItem.getPrice() < 0) {
            return ResponseEntity.badRequest().build();
        }
        if (menuItemDao.getById(id) == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(menuItemDao.update(id, menuItem));
    }

    // DELETE /api/menu-items/{id}
    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") int id) {
        menuItemDao.delete(id);
    }
}
