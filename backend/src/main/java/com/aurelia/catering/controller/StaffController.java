package com.aurelia.catering.controller;

import com.aurelia.catering.dao.StaffDao;
import com.aurelia.catering.model.Staff;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Staff Management.
 * Base URL: /api/staffs
 */
@RestController
@RequestMapping("/api/staffs")
public class StaffController {

    @Autowired
    private StaffDao staffDao;

    // GET /api/staffs
    @GetMapping
    public List<Staff> getAll() {
        return staffDao.getAll();
    }

    // GET /api/staffs/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Staff> getById(@PathVariable("id") int id) {
        Staff staff = staffDao.getById(id);
        if (staff == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(staff);
    }

    // POST /api/staffs
    @PostMapping
    public ResponseEntity<Staff> create(@RequestBody Staff staff) {
        if (staff.getName() == null || staff.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(staffDao.create(staff));
    }

    // PUT /api/staffs/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Staff> update(@PathVariable("id") int id, @RequestBody Staff staff) {
        if (staff.getName() == null || staff.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (staffDao.getById(id) == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(staffDao.update(id, staff));
    }

    // DELETE /api/staffs/{id}
    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") int id) {
        staffDao.delete(id);
    }
}

