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
 * REST controller for Order Management. Base URL: /api/orders
 *
 * Layers: React page -> this controller (HTTP + input validation) -> OrderDao (SQL) -> SQL Server.
 * Covers full CRUD for orders, guest booking, status changes and the stock check/confirm step.
 *
 * APIs used: Spring Web MVC REST annotations (@RestController, @GetMapping, @PostMapping ...) to expose
 * JSON endpoints; Jackson (built into Spring) to convert JSON <-> Java objects; ResponseEntity to
 * set the HTTP status code (200 OK, 400 Bad Request, 404 Not Found, 409 Conflict).
 *
 * Validation: checked here first, before any database work, and answered with 400 + a clear message.
 * The database repeats the key rules (CHECK / FOREIGN KEY / UNIQUE) as a second safety net.
 * Exception handling: expected problems are answered with 404 / 400 / 409. Unexpected database
 * errors are thrown by the DAO as RuntimeException and Spring returns 500 Internal Server Error.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    // OOP - abstraction + dependency injection: the controller only knows what OrderDao offers,
    // not how it works. Spring supplies the object, so the two classes stay loosely coupled.
    @Autowired
    private OrderDao orderDao;

    // GET /api/orders - READ: list every order
    @GetMapping
    public List<Order> getAllOrders() {
        return orderDao.getAllOrders();
    }

    // GET /api/orders/{id} - READ: one order, or 404 if it does not exist
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable("id") int id) {
        Order order = orderDao.getOrderById(id);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }

    // GET /api/orders/customer/{customerId} - READ: a customer's own orders (customer portal)
    @GetMapping("/customer/{customerId}")
    public List<Order> getOrdersByCustomerId(@PathVariable("customerId") int customerId) {
        return orderDao.getOrdersByCustomerId(customerId);
    }

    // POST /api/orders - CREATE: staff-created order for an existing customer
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order) {
        // Validation: a valid customer is mandatory
        if (order.getCustomerId() == null || order.getCustomerId() <= 0) {
            return ResponseEntity.badRequest().body("Valid CustomerID is required.");
        }
        Order created = orderDao.createOrder(order);
        return ResponseEntity.ok(created);
    }

    // POST /api/orders/guest - CREATE: public booking form. One request creates the customer,
    // order, event and menu items together (see OrderDao.createGuestOrder).
    @PostMapping("/guest")
    public ResponseEntity<?> createGuestOrder(@RequestBody GuestOrderRequest req) {
        // Validation: required fields must be filled before anything is saved (400 Bad Request otherwise)
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

    // PUT /api/orders/{id} - UPDATE: edit an existing order (404 if missing, 409 if stock is short)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateOrder(@PathVariable("id") int id, @RequestBody Order order) {
        Order existing = orderDao.getOrderById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        order.setOrderId(id);
        // Exception handling: the DAO throws IllegalStateException when a business rule fails
        // (e.g. not enough stock), so we catch it and answer 409 Conflict with the reason
        try {
            Order updated = orderDao.updateOrder(order);
            return ResponseEntity.ok(updated);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());   // e.g. not enough stock to start preparing
        }
    }

    // PUT /api/orders/{id}/status - UPDATE: move the order along its workflow
    // (Pending Verification -> ... -> Confirmed -> Preparing -> Ready for Delivery -> Delivered)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable("id") int id, @RequestBody Map<String, String> body) {
        Order existing = orderDao.getOrderById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Validation: the request body must contain a non-empty "status"
        String status = body.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Status is required.");
        }

        // 409 Conflict if the change is not allowed (e.g. moving to Preparing without enough stock)
        try {
            orderDao.updateOrderStatus(id, status);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());   // e.g. not enough stock to start preparing
        }
        existing.setStatus(OrderDao.normalizeOrderStatus(status));
        return ResponseEntity.ok(existing);
    }

    // GET /api/orders/{id}/inventory-check - integration with Inventory: are all ingredients in stock?
    // (read-only, does NOT change stock)
    @GetMapping("/{id}/inventory-check")
    public ResponseEntity<?> checkInventory(@PathVariable("id") int id) {
        InventoryCheckResult result = orderDao.checkInventory(id);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    // POST /api/orders/{id}/confirm - deducts stock + sets status Confirmed in one transaction;
    // returns 400 with the missing ingredients if stock is short
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

    // DELETE /api/orders/{id} - DELETE: removes the order and its linked rows (404 if missing)
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
