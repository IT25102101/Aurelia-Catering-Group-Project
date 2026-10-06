package com.aurelia.catering.controller;

import com.aurelia.catering.dao.CateringPackageDao;
import com.aurelia.catering.model.CateringPackage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Catering Package Management.
 * Base URL: /api/catering-packages
 */
@RestController
@RequestMapping("/api/catering-packages")
public class CateringPackageController {

    @Autowired
    private CateringPackageDao cateringPackageDao;

    // GET /api/catering-packages
    @GetMapping
    public List<CateringPackage> getAll() {
        return cateringPackageDao.getAll();
    }

    // GET /api/catering-packages/{id}
    @GetMapping("/{id}")
    public ResponseEntity<CateringPackage> getById(@PathVariable("id") int id) {
        CateringPackage cateringPackage = cateringPackageDao.getById(id);
        if (cateringPackage == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(cateringPackage);
    }

    // POST /api/catering-packages
    @PostMapping
    public ResponseEntity<CateringPackage> create(@RequestBody CateringPackage cateringPackage) {
        if (cateringPackage.getName() == null || cateringPackage.getName().trim().isEmpty() || cateringPackage.getPrice() == null || cateringPackage.getPrice() < 0) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(cateringPackageDao.create(cateringPackage));
    }

    // PUT /api/catering-packages/{id}
    @PutMapping("/{id}")
    public ResponseEntity<CateringPackage> update(@PathVariable("id") int id, @RequestBody CateringPackage cateringPackage) {
        if (cateringPackage.getName() == null || cateringPackage.getName().trim().isEmpty() || cateringPackage.getPrice() == null || cateringPackage.getPrice() < 0) {
            return ResponseEntity.badRequest().build();
        }
        if (cateringPackageDao.getById(id) == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(cateringPackageDao.update(id, cateringPackage));
    }

    // DELETE /api/catering-packages/{id}
    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") int id) {
        cateringPackageDao.delete(id);
    }
}
