package com.aurelia.catering.controller;

import com.aurelia.catering.dao.OrderDao;
import com.aurelia.catering.model.GuestOrderRequest;
import com.aurelia.catering.model.InventoryCheckResult;
import com.aurelia.catering.model.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for Order Management.
 * Base URL: /api/orders
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderDao orderDao;

    // GET /api/orders
    @GetMapping
    public List<Order> getAllOrders() {
        return orderDao.getAllOrders();
    }

    // GET /api/orders/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable("id") int id) {
        Order order = orderDao.getOrderById(id);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }

    // GET /api/orders/customer/{customerId}
    @GetMapping("/customer/{customerId}")
    public List<Order> getOrdersByCustomerId(@PathVariable("customerId") int customerId) {
        return orderDao.getOrdersByCustomerId(customerId);
    }

    // POST /api/orders
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order) {
        if (order.getCustomerId() == null || order.getCustomerId() <= 0) {
            return ResponseEntity.badRequest().body("Valid CustomerID is required.");
        }
        Order created = orderDao.createOrder(order);
        return ResponseEntity.ok(created);
    }

    // POST /api/orders/guest
    @PostMapping("/guest")
    public ResponseEntity<?> createGuestOrder(@RequestBody GuestOrderRequest req) {
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Customer name is required.");
        }
        if (req.getEmail() == null || req.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Customer email is required.");
        }
        if (req.getPhone() == null || req.getPhone().trim().isEmpty() || "N/A".equalsIgnoreCase(req.getPhone().trim())) {
            return ResponseEntity.badRequest().body("Customer phone number is required.");
        }
        if (req.getEventDate() == null) {
            return ResponseEntity.badRequest().body("Event date is required.");
        }
        if ((req.getLocation() == null || req.getLocation().trim().isEmpty()) &&
            (req.getVenue() == null || req.getVenue().trim().isEmpty())) {
            return ResponseEntity.badRequest().body("Venue/Location is required.");
        }
        if (req.getGuestCount() == null || req.getGuestCount() <= 0) {
            return ResponseEntity.badRequest().body("Guest count must be greater than zero.");
        }

        Map<String, Object> result = orderDao.createGuestOrder(req);
        return ResponseEntity.ok(result);
    }

    // PUT /api/orders/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateOrder(@PathVariable("id") int id, @RequestBody Order order) {
        Order existing = orderDao.getOrderById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        order.setOrderId(id);
        try {
            Order updated = orderDao.updateOrder(order);
            return ResponseEntity.ok(updated);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());   // e.g. not enough stock to start preparing
        }
    }

    // PUT /api/orders/{id}/status
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable("id") int id, @RequestBody Map<String, String> body) {
        Order existing = orderDao.getOrderById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        String status = body.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Status is required.");
        }

        try {
            orderDao.updateOrderStatus(id, status);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());   // e.g. not enough stock to start preparing
        }
        existing.setStatus(OrderDao.normalizeOrderStatus(status));
        return ResponseEntity.ok(existing);
    }

    // GET /api/orders/{id}/inventory-check  (read-only, does NOT change stock)
    @GetMapping("/{id}/inventory-check")
    public ResponseEntity<?> checkInventory(@PathVariable("id") int id) {
        InventoryCheckResult result = orderDao.checkInventory(id);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    // POST /api/orders/{id}/confirm  (deducts stock + sets status Confirmed; 400 with details if stock is short)
    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirmOrder(@PathVariable("id") int id) {
        InventoryCheckResult result = orderDao.confirmOrder(id);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        if (!result.isCanConfirm()) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    // DELETE /api/orders/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable("id") int id) {
        Order existing = orderDao.getOrderById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        orderDao.deleteOrder(id);
        return ResponseEntity.ok().build();
    }
}
