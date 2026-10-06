package com.aurelia.catering.controller;

import com.aurelia.catering.dao.QuotationItemDao;
import com.aurelia.catering.model.QuotationItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Quotation Item Management.
 * Base URL: /api/quotation-items
 */
@RestController
@RequestMapping("/api/quotation-items")
public class QuotationItemController {

    @Autowired
    private QuotationItemDao quotationItemDao;

    @Autowired
    private com.aurelia.catering.dao.QuotationDao quotationDao;

    // GET /api/quotation-items
    @GetMapping
    public List<QuotationItem> getAllQuotationItems() {
        return quotationItemDao.getAllQuotationItems();
    }

    // GET /api/quotation-items/{id}
    @GetMapping("/{id}")
    public ResponseEntity<QuotationItem> getQuotationItemById(@PathVariable("id") int id) {
        QuotationItem item = quotationItemDao.getQuotationItemById(id);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(item);
    }

    // GET /api/quotation-items/quotation/{quotationId}
    @GetMapping("/quotation/{quotationId}")
    public ResponseEntity<?> getItemsByQuotationId(
            @PathVariable("quotationId") int quotationId,
            @RequestParam(value = "customerId", required = false) Integer customerId) {
        if (customerId != null) {
            if (!quotationDao.isCustomerQuotationOwner(quotationId, customerId)) {
                return ResponseEntity.status(403).body("Access denied: Quotation does not belong to this customer.");
            }
        }
        List<QuotationItem> items = quotationItemDao.getItemsByQuotationId(quotationId);
        return ResponseEntity.ok(items);
    }

    // POST /api/quotation-items
    @PostMapping
    public ResponseEntity<?> createQuotationItem(@RequestBody QuotationItem item) {
        if (item.getQuotationId() == null || item.getQuotationId() <= 0) {
            return ResponseEntity.badRequest().body("Valid QuotationID is required.");
        }
        if (item.getDescription() == null || item.getDescription().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Description is required.");
        }
        QuotationItem created = quotationItemDao.createQuotationItem(item);
        return ResponseEntity.ok(created);
    }

    // PUT /api/quotation-items/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuotationItem(@PathVariable("id") int id, @RequestBody QuotationItem item) {
        QuotationItem existing = quotationItemDao.getQuotationItemById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        item.setQuotationItemId(id);
        QuotationItem updated = quotationItemDao.updateQuotationItem(item);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/quotation-items/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuotationItem(@PathVariable("id") int id) {
        QuotationItem existing = quotationItemDao.getQuotationItemById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        quotationItemDao.deleteQuotationItem(id);
        return ResponseEntity.ok().build();
    }
}
