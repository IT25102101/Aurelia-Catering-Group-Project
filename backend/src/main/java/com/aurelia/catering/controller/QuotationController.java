package com.aurelia.catering.controller;

import com.aurelia.catering.dao.QuotationDao;
import com.aurelia.catering.model.Quotation;
import com.aurelia.catering.model.QuotationRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for Quotation Management.
 * Base URL: /api/quotations
 */
@RestController
@RequestMapping("/api/quotations")
public class QuotationController {

    @Autowired
    private QuotationDao quotationDao;

    // GET /api/quotations
    @GetMapping
    public List<Quotation> getAllQuotations() {
        return quotationDao.getAllQuotations();
    }

    // GET /api/quotations/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getQuotationById(
            @PathVariable("id") int id,
            @RequestParam(value = "customerId", required = false) Integer customerId) {
        Quotation quotation = quotationDao.getQuotationById(id);
        if (quotation == null) {
            return ResponseEntity.notFound().build();
        }
        if (customerId != null) {
            if (!quotationDao.isCustomerQuotationOwner(id, customerId)) {
                return ResponseEntity.status(403).body("Access denied: Quotation does not belong to this customer.");
            }
            if ("Draft".equalsIgnoreCase(quotation.getStatus())) {
                return ResponseEntity.status(403).body("Access denied: Draft quotations cannot be viewed by customers.");
            }
        }
        return ResponseEntity.ok(quotation);
    }

    // GET /api/quotations/customer/{customerId}
    @GetMapping("/customer/{customerId}")
    public List<Quotation> getQuotationsByCustomerId(@PathVariable("customerId") int customerId) {
        return quotationDao.getQuotationsByCustomerId(customerId);
    }

    // GET /api/quotations/order/{orderId}
    @GetMapping("/order/{orderId}")
    public ResponseEntity<Quotation> getQuotationByOrderId(@PathVariable("orderId") int orderId) {
        Quotation quotation = quotationDao.getQuotationByOrderId(orderId);
        if (quotation == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(quotation);
    }

    // POST /api/quotations
    @PostMapping
    public ResponseEntity<?> createQuotation(@RequestBody QuotationRequest req) {
        if (req.getOrderId() == null || req.getOrderId() <= 0) {
            return ResponseEntity.badRequest().body("Valid OrderID is required.");
        }

        // Check if quotation already exists for this order
        if (quotationDao.quotationExistsForOrder(req.getOrderId())) {
            return ResponseEntity.badRequest().body("Quotation already exists for Order #" + req.getOrderId());
        }

        Quotation quotation = new Quotation();
        quotation.setOrderId(req.getOrderId());
        quotation.setTotalAmount(req.getTotalAmount());
        quotation.setStatus(req.getStatus() != null && !req.getStatus().trim().isEmpty() ? req.getStatus() : "Draft");

        Quotation created;
        if (req.getItems() != null && !req.getItems().isEmpty()) {
            created = quotationDao.createQuotationWithItems(quotation, req.getItems());
        } else {
            created = quotationDao.createQuotation(quotation);
        }
        return ResponseEntity.ok(created);
    }

    // PUT /api/quotations/{id}/status
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateQuotationStatus(@PathVariable("id") int id, @RequestBody Map<String, String> body) {
        Quotation existing = quotationDao.getQuotationById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        String status = body.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Status is required.");
        }

        quotationDao.updateQuotationStatus(id, status);
        existing.setStatus(status);
        return ResponseEntity.ok(existing);
    }

    // PUT /api/quotations/{id}/customer-response
    @PutMapping("/{id}/customer-response")
    public ResponseEntity<?> customerResponse(
            @PathVariable("id") int id,
            @RequestBody Map<String, Object> body) {

        // Extract and validate customerId
        Object customerIdObj = body.get("customerId");
        if (customerIdObj == null) {
            return ResponseEntity.badRequest().body("CustomerID is required for authorization.");
        }
        int customerId;
        try {
            customerId = Integer.parseInt(customerIdObj.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Invalid CustomerID.");
        }

        // Extract target status
        String targetStatus = body.get("status") != null ? body.get("status").toString().trim() : null;
        if (targetStatus == null || targetStatus.isEmpty()) {
            return ResponseEntity.badRequest().body("Response status ('Accepted' or 'Rejected') is required.");
        }

        // Rejection requires a non-empty reason (no DB column — frontend validation only, but backend also enforces)
        if ("Rejected".equalsIgnoreCase(targetStatus)) {
            String reason = body.get("reason") != null ? body.get("reason").toString().trim() : "";
            if (reason.isEmpty()) {
                return ResponseEntity.badRequest().body("Rejection reason is required.");
            }
        }

        // Delegate to atomic DAO method — updates Quotation + Order + triggers history automatically
        try {
            Quotation updated = quotationDao.acceptOrRejectWithOrderUpdate(id, customerId, targetStatus);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "An error occurred.";
            if (msg.startsWith("NOT_FOUND:")) {
                return ResponseEntity.notFound().build();
            }
            if (msg.startsWith("FORBIDDEN:")) {
                return ResponseEntity.status(403).body(msg.substring("FORBIDDEN: ".length()));
            }
            if (msg.startsWith("INVALID:")) {
                return ResponseEntity.badRequest().body(msg.substring("INVALID: ".length()));
            }
            return ResponseEntity.internalServerError().body("Unexpected error: " + msg);
        }
    }

    // PUT /api/quotations/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuotation(@PathVariable("id") int id, @RequestBody Quotation quotation) {
        Quotation existing = quotationDao.getQuotationById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        quotation.setQuotationId(id);
        Quotation updated = quotationDao.updateQuotation(quotation);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/quotations/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuotation(@PathVariable("id") int id) {
        Quotation existing = quotationDao.getQuotationById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        quotationDao.deleteQuotation(id);
        return ResponseEntity.ok().build();
    }
}
