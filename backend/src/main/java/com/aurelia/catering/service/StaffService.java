package com.aurelia.catering.service;

import com.aurelia.catering.dao.StaffDao;
import com.aurelia.catering.model.Staff;
import com.aurelia.catering.strategy.staff.StaffCompensationBreakdown;
import com.aurelia.catering.strategy.staff.StaffPolicyContext;
import com.aurelia.catering.strategy.staff.StaffPolicyResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Service Layer for Staff Management.
 *
 * Demonstrates:
 * 1. DAO Pattern: Interacts with StaffDao to isolate database operations from HTTP controllers.
 * 2. Strategy Pattern: Uses StaffPolicyContext to dynamically evaluate role-specific operational
 *    policies and calculate shift compensation without if-else or switch branching.
 */
@Service
public class StaffService {

    private final StaffDao staffDao;
    private final StaffPolicyContext policyContext;

    @Autowired
    public StaffService(StaffDao staffDao, StaffPolicyContext policyContext) {
        this.staffDao = staffDao;
        this.policyContext = policyContext;
    }

    // ==========================================
    // 1. DATA ACCESS (DAO) OPERATIONS
    // ==========================================

    /**
     * Retrieves all staff records from the database via the DAO.
     */
    public List<Staff> getAllStaff() {
        return staffDao.getAll();
    }

    /**
     * Retrieves a single staff record by primary key ID via the DAO.
     */
    public Staff getStaffById(int id) {
        return staffDao.getById(id);
    }

    /**
     * Validates and persists a new staff member via the DAO.
     */
    public Staff createStaff(Staff staff) {
        if (staff == null || staff.getName() == null || staff.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Staff name is required.");
        }
        if (staff.getRole() == null || staff.getRole().trim().isEmpty()) {
            staff.setRole("OPERATIONS_SUPERVISOR");
        }
        return staffDao.create(staff);
    }

    /**
     * Validates and updates an existing staff member via the DAO.
     */
    public Staff updateStaff(int id, Staff staff) {
        if (staff == null || staff.getName() == null || staff.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Staff name is required.");
        }
        Staff existing = staffDao.getById(id);
        if (existing == null) {
            return null;
        }
        return staffDao.update(id, staff);
    }

    /**
     * Deletes a staff member by ID via the DAO.
     */
    public void deleteStaff(int id) {
        staffDao.delete(id);
    }

    // ==========================================
    // 2. STRATEGY PATTERN OPERATIONS
    // ==========================================

    /**
     * Evaluates the role-specific operational policy for a staff member using the Strategy Pattern.
     */
    public StaffPolicyResult evaluateStaffPolicy(int id) {
        Staff staff = staffDao.getById(id);
        if (staff == null) {
            return null;
        }
        return policyContext.evaluate(staff);
    }

    /**
     * Calculates projected shift compensation and overtime breakdown for a staff member
     * using the Strategy Pattern.
     */
    public StaffCompensationBreakdown calculateStaffCompensation(int id, int regularHours, int overtimeHours) {
        Staff staff = staffDao.getById(id);
        if (staff == null) {
            return null;
        }
        return policyContext.calculateCompensation(staff, regularHours, overtimeHours);
    }

    /**
     * Returns list of all available role policies for UI discovery and lecturer demonstration.
     */
    public List<Map<String, Object>> getAvailablePolicies() {
        return policyContext.getAvailablePolicies();
    }
}
