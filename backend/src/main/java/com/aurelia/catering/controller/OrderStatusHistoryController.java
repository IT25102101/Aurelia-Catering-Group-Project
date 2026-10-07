package com.aurelia.catering.controller;

import com.aurelia.catering.dao.OrderStatusHistoryDao;
import com.aurelia.catering.model.OrderStatusHistory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Order Status History.
 * Base URL: /api/order-status-history
 */
@RestController
@RequestMapping("/api/order-status-history")
public class OrderStatusHistoryController {

    @Autowired
    private OrderStatusHistoryDao orderStatusHistoryDao;

    // GET /api/order-status-history
    @GetMapping
    public List<OrderStatusHistory> getAllStatusHistory() {
        return orderStatusHistoryDao.getAllStatusHistory();
    }

    // GET /api/order-status-history/{id}
    @GetMapping("/{id}")
    public ResponseEntity<OrderStatusHistory> getStatusHistoryById(@PathVariable("id") int id) {
        OrderStatusHistory history = orderStatusHistoryDao.getStatusHistoryById(id);
        if (history == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(history);
    }

    // GET /api/order-status-history/order/{orderId}
    @GetMapping("/order/{orderId}")
    public List<OrderStatusHistory> getStatusHistoryByOrderId(@PathVariable("orderId") int orderId) {
        return orderStatusHistoryDao.getStatusHistoryByOrderId(orderId);
    }

    // POST /api/order-status-history
    @PostMapping
    public ResponseEntity<?> createStatusHistory(@RequestBody OrderStatusHistory history) {
        if (history.getOrderId() == null || history.getOrderId() <= 0) {
            return ResponseEntity.badRequest().body("Valid OrderID is required.");
        }
        if (history.getStatus() == null || history.getStatus().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Status is required.");
        }
        OrderStatusHistory created = orderStatusHistoryDao.createStatusHistory(history);
        return ResponseEntity.ok(created);
    }

    // DELETE /api/order-status-history/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStatusHistory(@PathVariable("id") int id) {
        OrderStatusHistory existing = orderStatusHistoryDao.getStatusHistoryById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        orderStatusHistoryDao.deleteStatusHistory(id);
        return ResponseEntity.ok().build();
    }
}
