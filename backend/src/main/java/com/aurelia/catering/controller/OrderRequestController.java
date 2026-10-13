package com.aurelia.catering.controller;

import com.aurelia.catering.dao.OrderRequestDao;
import com.aurelia.catering.model.OrderRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Order Request Management (Cancellations, Rescheduling, etc.).
 * Base URL: /api/order-requests
 * A customer raises a request for their order; staff review it and reply. Full CRUD is supported.
 */
@RestController
@RequestMapping("/api/order-requests")
public class OrderRequestController {

    @Autowired
    private OrderRequestDao orderRequestDao;

    // GET /api/order-requests - READ: all requests (staff view)
    @GetMapping
    public List<OrderRequest> getAllRequests() {
        return orderRequestDao.getAllRequests();
    }

    // GET /api/order-requests/{id} - READ: one request, or 404
    @GetMapping("/{id}")
    public ResponseEntity<OrderRequest> getRequestById(@PathVariable("id") int id) {
        OrderRequest request = orderRequestDao.getRequestById(id);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(request);
    }

    // GET /api/order-requests/order/{orderId} - READ: requests made for one order
    @GetMapping("/order/{orderId}")
    public List<OrderRequest> getRequestsByOrderId(@PathVariable("orderId") int orderId) {
        return orderRequestDao.getRequestsByOrderId(orderId);
    }

    // POST /api/order-requests - CREATE: customer submits a cancellation / rescheduling request
    @PostMapping
    public ResponseEntity<?> createRequest(@RequestBody OrderRequest request) {
        // Validation: needs a valid order and a request type
        if (request.getOrderId() == null || request.getOrderId() <= 0) {
            return ResponseEntity.badRequest().body("Valid OrderID is required.");
        }
        if (request.getRequestType() == null || request.getRequestType().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("RequestType is required (Cancellation or Rescheduling).");
        }
        OrderRequest created = orderRequestDao.createRequest(request);
        return ResponseEntity.ok(created);
    }

    // PUT /api/order-requests/{id} - UPDATE: staff approve/reject and add a response
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRequest(@PathVariable("id") int id, @RequestBody OrderRequest request) {
        OrderRequest existing = orderRequestDao.getRequestById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        request.setRequestId(id);
        OrderRequest updated = orderRequestDao.updateRequest(request);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/order-requests/{id} - DELETE: remove a request (404 if missing)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable("id") int id) {
        OrderRequest existing = orderRequestDao.getRequestById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        orderRequestDao.deleteRequest(id);
        return ResponseEntity.ok().build();
    }
}
