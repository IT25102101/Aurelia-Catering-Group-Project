package com.aurelia.catering.controller;

import com.aurelia.catering.dao.DeliveryDao;
import com.aurelia.catering.model.Delivery;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for "6.5 Delivery Management".
 *
 * This class covers all 4 CRUD operations for Delivery — that's the whole
 * point of a CRUD controller:
 *   1. CREATE — add a new delivery                    -> POST   /api/deliveries
 *   2. READ   — view deliverys (all, or just one)      -> GET    /api/deliveries
 *                                                        GET    /api/deliveries/{id}
 *   3. UPDATE — change an existing delivery            -> PUT    /api/deliveries/{id}
 *   4. DELETE — remove an existing delivery                -> DELETE /api/deliveries/{id}
 *
 * (READ has 2 endpoints — "get all" and "get one by id" — because both
 * are useful, but they're still both just reading, so this is still 4
 * CRUD operations, not 5.)
 *
 * No service layer in between: the controller calls the DAO directly,
 * which keeps the request -> response path short and easy to trace.
 */
@RestController // tells Spring "this class handles web requests and returns
                 // data (usually JSON) instead of an HTML page"
@RequestMapping("/api/deliveries") // every method below is reachable under this
                                 // base URL, e.g. GET /api/deliveries
public class DeliveryController {

    // @Autowired asks Spring to hand us the one DeliveryDao object it
    // already created (Spring "wires" it in automatically) — we never
    // write "new DeliveryDao()" ourselves.
    @Autowired
    private DeliveryDao deliveryDao;

    // ---------- 2. READ (all) ----------
    // @GetMapping with no path = handles GET /api/deliveries
    @GetMapping
    public List<Delivery> getAll() {
        return deliveryDao.getAll();
    }

    // ---------- 2. READ (one, by id) ----------
    // {id} in the URL is a placeholder. @PathVariable copies whatever
    // value was in that spot in the URL into the "id" parameter below.
    // e.g. GET /api/deliveries/3 -> id = 3
    @GetMapping("/{id}")
    public ResponseEntity<Delivery> getById(@PathVariable("id") int id) {
        Delivery delivery = deliveryDao.getById(id);
        if (delivery == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(delivery);
    }

    // ---------- 1. CREATE ----------
    // @RequestBody tells Spring "take the JSON in the request body and
    // turn it into a Delivery object automatically" (using the getters/
    // setters in Delivery.java). This handles POST /api/deliveries
    @PostMapping
    public ResponseEntity<Delivery> create(@RequestBody Delivery delivery) {
        return ResponseEntity.ok(deliveryDao.create(delivery));
    }

    // ---------- 3. UPDATE ----------
    // Combines @PathVariable (which row to update) with @RequestBody
    // (the new values). Handles PUT /api/deliveries/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Delivery> update(@PathVariable("id") int id, @RequestBody Delivery delivery) {
        if (deliveryDao.getById(id) == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(deliveryDao.update(id, delivery));
    }

    // ---------- 4. DELETE ----------
    // Handles DELETE /api/deliveries/{id} — removes the row and returns
    // nothing (void), which Spring turns into an empty 200 OK response.
    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") int id) {
        deliveryDao.delete(id);
    }
}
