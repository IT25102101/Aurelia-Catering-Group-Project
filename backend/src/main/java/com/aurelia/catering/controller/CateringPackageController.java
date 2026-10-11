package com.aurelia.catering.controller;

import com.aurelia.catering.model.CateringPackage;
import com.aurelia.catering.service.CateringPackageService;
import com.aurelia.catering.strategy.PricingBreakdown;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for Catering Package Management.
 * Base URL: /api/catering-packages
 *
 * Demonstrates:
 * - Creational: Factory Pattern (instantiating occasion-specific package models)
 * - Behavioral: Strategy Pattern (dynamic interchangeable pricing models)
 */
@RestController
@RequestMapping("/api/catering-packages")
public class CateringPackageController {

    @Autowired
    private CateringPackageService cateringPackageService;

    // GET /api/catering-packages
    @GetMapping
    public List<CateringPackage> getAll() {
        return cateringPackageService.getAllPackages();
    }

    // GET /api/catering-packages/{id}
    @GetMapping("/{id}")
    public ResponseEntity<CateringPackage> getById(@PathVariable("id") int id) {
        CateringPackage cateringPackage = cateringPackageService.getPackageById(id);
        if (cateringPackage == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(cateringPackage);
    }

    // POST /api/catering-packages
    @PostMapping
    public ResponseEntity<CateringPackage> create(@RequestBody CateringPackage cateringPackage) {
        if (cateringPackage.getName() == null || cateringPackage.getName().trim().isEmpty() ||
            cateringPackage.getPrice() == null || cateringPackage.getPrice() < 0) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(cateringPackageService.createPackage(cateringPackage));
    }

    // PUT /api/catering-packages/{id}
    @PutMapping("/{id}")
    public ResponseEntity<CateringPackage> update(@PathVariable("id") int id, @RequestBody CateringPackage cateringPackage) {
        if (cateringPackage.getName() == null || cateringPackage.getName().trim().isEmpty() ||
            cateringPackage.getPrice() == null || cateringPackage.getPrice() < 0) {
            return ResponseEntity.badRequest().build();
        }
        CateringPackage updated = cateringPackageService.updatePackage(id, cateringPackage);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/catering-packages/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") int id) {
        cateringPackageService.deletePackage(id);
        return ResponseEntity.ok().build();
    }

    // GET /api/catering-packages/strategies (List available pricing strategies for UI/client)
    @GetMapping("/strategies")
    public List<Map<String, String>> getAvailableStrategies() {
        return cateringPackageService.getAvailablePricingStrategies();
    }

    // POST /api/catering-packages/{id}/calculate-price?strategy={strategyCode}&guests={guestCount}
    @PostMapping("/{id}/calculate-price")
    public ResponseEntity<PricingBreakdown> calculatePrice(
            @PathVariable("id") int id,
            @RequestParam(value = "strategy", defaultValue = "fixed") String strategyCode,
            @RequestParam(value = "guests", defaultValue = "50") int guestCount) {
        try {
            PricingBreakdown breakdown = cateringPackageService.calculatePackagePrice(id, strategyCode, guestCount);
            return ResponseEntity.ok(breakdown);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

