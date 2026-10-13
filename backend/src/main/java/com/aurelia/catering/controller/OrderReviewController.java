package com.aurelia.catering.controller;

import com.aurelia.catering.dao.OrderReviewDao;
import com.aurelia.catering.model.OrderReview;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Order Review Management.
 * Base URL: /api/order-reviews
 * A staff member reviews a new order (verify details, approve or reject). Full CRUD is supported.
 */
@RestController
@RequestMapping("/api/order-reviews")
public class OrderReviewController {

    @Autowired
    private OrderReviewDao orderReviewDao;

    // GET /api/order-reviews - READ: all reviews
    @GetMapping
    public List<OrderReview> getAllReviews() {
        return orderReviewDao.getAllReviews();
    }

    // GET /api/order-reviews/{id} - READ: one review, or 404
    @GetMapping("/{id}")
    public ResponseEntity<OrderReview> getReviewById(@PathVariable("id") int id) {
        OrderReview review = orderReviewDao.getReviewById(id);
        if (review == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(review);
    }

    // GET /api/order-reviews/order/{orderId} - READ: reviews of one order
    @GetMapping("/order/{orderId}")
    public List<OrderReview> getReviewsByOrderId(@PathVariable("orderId") int orderId) {
        return orderReviewDao.getReviewsByOrderId(orderId);
    }

    // POST /api/order-reviews - CREATE: staff record a review of an order
    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody OrderReview review) {
        // Validation: a review needs a valid order and the reviewing staff member
        if (review.getOrderId() == null || review.getOrderId() <= 0) {
            return ResponseEntity.badRequest().body("Valid OrderID is required.");
        }
        if (review.getStaffId() == null || review.getStaffId() <= 0) {
            return ResponseEntity.badRequest().body("Valid StaffID is required.");
        }
        OrderReview created = orderReviewDao.createReview(review);
        return ResponseEntity.ok(created);
    }

    // PUT /api/order-reviews/{id} - UPDATE: change the review status or comments
    @PutMapping("/{id}")
    public ResponseEntity<?> updateReview(@PathVariable("id") int id, @RequestBody OrderReview review) {
        OrderReview existing = orderReviewDao.getReviewById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        review.setOrderReviewId(id);
        OrderReview updated = orderReviewDao.updateReview(review);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/order-reviews/{id} - DELETE: remove a review (404 if missing)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable("id") int id) {
        OrderReview existing = orderReviewDao.getReviewById(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        orderReviewDao.deleteReview(id);
        return ResponseEntity.ok().build();
    }
}
