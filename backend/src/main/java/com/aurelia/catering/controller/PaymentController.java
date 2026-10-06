package com.aurelia.catering.controller;

import com.aurelia.catering.dao.PaymentDao;
import com.aurelia.catering.model.Payment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Payment Management.
 * Base URL: /api/payments
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentDao paymentDao;

    // GET /api/payments
    @GetMapping
    public List<Payment> getAllPayments() {
        return paymentDao.getAllPayments();
    }

    // GET /api/payments/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(@PathVariable("id") int id) {
        Payment payment = paymentDao.getPaymentById(id);
        if (payment == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(payment);
    }

    // GET /api/payments/order/{orderId}
    @GetMapping("/order/{orderId}")
    public List<Payment> getPaymentsByOrderId(@PathVariable("orderId") int orderId) {
        return paymentDao.getPaymentsByOrderId(orderId);
    }

    // GET /api/payments/summary/{orderId}
    @GetMapping("/summary/{orderId}")
    public ResponseEntity<?> getPaymentSummary(@PathVariable("orderId") int orderId) {
        java.util.Map<String, Object> summary = paymentDao.getOrderPaymentSummary(orderId);
        if (summary == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(summary);
    }

    // POST /api/payments (Record External Payment)
    @PostMapping
    public ResponseEntity<?> createPayment(@RequestBody Payment payment) {
        if (payment.getOrderId() == null || payment.getOrderId() <= 0) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Valid OrderID is required."));
        }
        if (payment.getAmount() == null || payment.getAmount().doubleValue() <= 0) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Payment amount must be greater than zero."));
        }

        try {
            java.util.Map<String, Object> result = paymentDao.recordOrderPayment(payment);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/payments/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePayment(@PathVariable("id") int id, @RequestBody Payment payment) {
        Payment existing = paymentDao.getPaymentById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        payment.setPaymentId(id);
        Payment updated = paymentDao.updatePayment(payment);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/payments/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable("id") int id) {
        Payment existing = paymentDao.getPaymentById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        paymentDao.deletePayment(id);
        return ResponseEntity.ok().build();
    }
}
