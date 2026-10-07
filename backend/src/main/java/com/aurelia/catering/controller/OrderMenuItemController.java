package com.aurelia.catering.controller;

import com.aurelia.catering.dao.OrderMenuItemDao;
import com.aurelia.catering.model.OrderMenuItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Order -> Menu Item selections.
 * Base URL: /api/order-menu-items
 */
@RestController
@RequestMapping("/api/order-menu-items")
public class OrderMenuItemController {

    @Autowired
    private OrderMenuItemDao orderMenuItemDao;

    // GET /api/order-menu-items/order/{orderId}
    @GetMapping("/order/{orderId}")
    public List<OrderMenuItem> getByOrderId(@PathVariable("orderId") int orderId) {
        return orderMenuItemDao.getByOrderId(orderId);
    }

    // POST /api/order-menu-items
    @PostMapping
    public ResponseEntity<?> create(@RequestBody OrderMenuItem item) {
        if (item.getOrderId() == null || item.getOrderId() <= 0) {
            return ResponseEntity.badRequest().body("Valid Order ID is required.");
        }
        if (item.getMenuItemId() == null || item.getMenuItemId() <= 0) {
            return ResponseEntity.badRequest().body("Valid Menu Item ID is required.");
        }
        if (item.getQuantity() == null || item.getQuantity() <= 0) {
            item.setQuantity(1);
        }

        OrderMenuItem created = orderMenuItemDao.create(item);
        return ResponseEntity.ok(created);
    }

    // DELETE /api/order-menu-items/{orderId}/{menuItemId}
    @DeleteMapping("/{orderId}/{menuItemId}")
    public ResponseEntity<Void> delete(
            @PathVariable("orderId") int orderId,
            @PathVariable("menuItemId") int menuItemId) {
        orderMenuItemDao.delete(orderId, menuItemId);
        return ResponseEntity.ok().build();
    }
}
