package com.aurelia.catering.controller;

import com.aurelia.catering.model.Staff;
import com.aurelia.catering.service.StaffService;
import com.aurelia.catering.strategy.staff.StaffCompensationBreakdown;
import com.aurelia.catering.strategy.staff.StaffPolicyResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for Staff Management.
 * Base URL: /api/staffs
 *
 * Demonstrates:
 * 1. DAO Pattern: HTTP request handling is strictly separated from database access.
 *    Controller delegates business and data workflows to StaffService and StaffDao.
 * 2. Strategy Pattern: Provides endpoints to evaluate role-specific operational policies
 *    and calculate shift compensation dynamically at runtime without if-else branching.
 */
@RestController
@RequestMapping("/api/staffs")
public class StaffController {

    private final StaffService staffService;

    @Autowired
    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    // ==========================================
    // 1. STANDARD CRUD ENDPOINTS (PRESERVED 100%)
    // ==========================================

    // GET /api/staffs
    @GetMapping
    public List<Staff> getAll() {
        return staffService.getAllStaff();
    }

    // GET /api/staffs/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Staff> getById(@PathVariable("id") int id) {
        Staff staff = staffService.getStaffById(id);
        if (staff == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(staff);
    }

    // POST /api/staffs
    @PostMapping
    public ResponseEntity<Staff> create(@RequestBody Staff staff) {
        if (staff == null || staff.getName() == null || staff.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(staffService.createStaff(staff));
    }

    // PUT /api/staffs/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Staff> update(@PathVariable("id") int id, @RequestBody Staff staff) {
        if (staff == null || staff.getName() == null || staff.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Staff updated = staffService.updateStaff(id, staff);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/staffs/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") int id) {
        staffService.deleteStaff(id);
        return ResponseEntity.ok().build();
    }

    // ==========================================
    // 2. STRATEGY PATTERN DEMONSTRATION ENDPOINTS
    // ==========================================

    // GET /api/staffs/policies (List all available role policy definitions)
    @GetMapping("/policies")
    public List<Map<String, Object>> getAvailablePolicies() {
        return staffService.getAvailablePolicies();
    }

    // GET /api/staffs/{id}/policy (Evaluate role policy, clearances & limits via Strategy Pattern)
    @GetMapping("/{id}/policy")
    public ResponseEntity<StaffPolicyResult> getStaffPolicy(@PathVariable("id") int id) {
        StaffPolicyResult result = staffService.evaluateStaffPolicy(id);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    // GET /api/staffs/{id}/compensation?regularHours=40&overtimeHours=5 (Calculate shift pay via Strategy Pattern)
    @GetMapping("/{id}/compensation")
    public ResponseEntity<StaffCompensationBreakdown> calculateCompensation(
            @PathVariable("id") int id,
            @RequestParam(value = "regularHours", defaultValue = "40") int regularHours,
            @RequestParam(value = "overtimeHours", defaultValue = "0") int overtimeHours) {
        StaffCompensationBreakdown breakdown = staffService.calculateStaffCompensation(id, regularHours, overtimeHours);
        if (breakdown == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(breakdown);
    }
}
