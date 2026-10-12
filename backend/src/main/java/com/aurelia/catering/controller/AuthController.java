package com.aurelia.catering.controller;

import com.aurelia.catering.dao.CustomerAccountDao;
import com.aurelia.catering.dao.StaffAccountDao;
import com.aurelia.catering.model.CustomerAccount;
import com.aurelia.catering.model.StaffAccount;
import com.aurelia.catering.util.PasswordUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Authentication controller handling simple, beginner-friendly login and registration
 * across the dual-account tables (STAFF_ACCOUNT and CUSTOMER_ACCOUNT) in AureliaCatering2.
 * Passwords are stored as salted PBKDF2 hashes (see PasswordUtil). Older accounts that
 * still hold a plain-text password can log in once and are upgraded automatically.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private StaffAccountDao staffAccountDao;

    @Autowired
    private CustomerAccountDao customerAccountDao;

    /**
     * Authenticates a user against either STAFF_ACCOUNT or CUSTOMER_ACCOUNT.
     * Verifies the entered password against the stored hash (or legacy plain text).
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String identifier = loginRequest.get("email");
        if (identifier == null || identifier.trim().isEmpty()) {
            identifier = loginRequest.get("username");
        }
        String password = loginRequest.get("password");

        if (identifier == null || identifier.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.status(401).body("Email/Username and password are required.");
        }

        identifier = identifier.trim();

        // 1. Check STAFF_ACCOUNT first (supports login by Username or Staff Email)
        try {
            StaffAccount staff = staffAccountDao.findByUsernameOrEmail(identifier);
            if (staff != null) {
                if (PasswordUtil.matches(password, staff.getPasswordHash())) {
                    if (!"Active".equalsIgnoreCase(staff.getAccountStatus())) {
                        return ResponseEntity.status(401).body("Your staff account is currently inactive. Please contact administration.");
                    }
                    if (PasswordUtil.needsUpgrade(staff.getPasswordHash())) {
                        staffAccountDao.updatePassword(staff.getAccountId(), password); // re-save as a hash
                    }
                    staffAccountDao.updateLastLogin(staff.getAccountId());

                    Map<String, Object> response = new HashMap<>();
                    response.put("id", staff.getStaffId());
                    response.put("fullName", staff.getStaffName());
                    response.put("email", staff.getStaffEmail());
                    response.put("role", staff.getStaffRole());
                    response.put("accountType", "STAFF");
                    return ResponseEntity.ok(response);
                }
            }
        } catch (Exception e) {
            log.error("Error during staff authentication lookup for '{}': {}", identifier, e.getMessage(), e);
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("Staff_Account") || msg.contains("Invalid object name")) {
                return ResponseEntity.status(503).body("Database setup incomplete: The STAFF_ACCOUNT table does not exist in the database. Please execute the authentication setup SQL script in SSMS.");
            }
            return ResponseEntity.status(500).body("Authentication error: " + e.getMessage());
        }

        // 2. Check CUSTOMER_ACCOUNT (login by Customer Email)
        try {
            CustomerAccount customer = customerAccountDao.findByCustomerEmail(identifier);
            if (customer != null) {
                if (PasswordUtil.matches(password, customer.getPasswordHash())) {
                    if (!"Active".equalsIgnoreCase(customer.getAccountStatus())) {
                        return ResponseEntity.status(401).body("Your customer account is currently inactive.");
                    }
                    if (PasswordUtil.needsUpgrade(customer.getPasswordHash())) {
                        customerAccountDao.updatePassword(customer.getAccountId(), password); // re-save as a hash
                    }
                    customerAccountDao.updateLastLogin(customer.getAccountId());

                    Map<String, Object> response = new HashMap<>();
                    response.put("id", customer.getCustomerId());
                    response.put("fullName", customer.getCustomerName());
                    response.put("email", customer.getCustomerEmail());
                    response.put("role", "CUSTOMER");
                    response.put("accountType", "CUSTOMER");
                    return ResponseEntity.ok(response);
                }
            }
        } catch (Exception e) {
            log.error("Error during customer authentication lookup for '{}': {}", identifier, e.getMessage(), e);
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("Customer_Account") || msg.contains("Invalid object name") || msg.contains("Customer")) {
                return ResponseEntity.status(503).body("Database setup incomplete: The CUSTOMER_ACCOUNT table does not exist in the database. Please execute the authentication setup SQL script in SSMS.");
            }
            return ResponseEntity.status(500).body("Authentication error: " + e.getMessage());
        }

        // 3. If neither credentials matched
        return ResponseEntity.status(401).body("Incorrect email/username or password.");
    }

    /**
     * Customer registration endpoint.
     * Atomically creates records in CUSTOMER and CUSTOMER_ACCOUNT. The password is stored hashed.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String fullName = request.get("fullName");
        if (fullName == null || fullName.trim().isEmpty()) {
            fullName = request.get("name");
        }
        String email = request.get("email");
        String phone = request.get("phone");
        
        String plainPassword = request.get("password");
        if (plainPassword == null || plainPassword.trim().isEmpty()) {
            plainPassword = request.get("passwordHash");
        }

        // Validation
        if (fullName == null || fullName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Full name is required.");
        }
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email address is required.");
        }
        if (plainPassword == null || plainPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Password is required.");
        }

        email = email.trim();
        fullName = fullName.trim();
        if (phone != null) phone = phone.trim();

        // Check uniqueness
        if (customerAccountDao.emailExists(email)) {
            return ResponseEntity.badRequest().body("An account with that email already exists.");
        }

        // Atomic registration via JDBC transaction; the password is hashed before it is stored
        CustomerAccount createdAccount = customerAccountDao.registerCustomerWithAccount(
                fullName, email, phone, PasswordUtil.hash(plainPassword)
        );

        Map<String, Object> response = new HashMap<>();
        response.put("id", createdAccount.getCustomerId());
        response.put("fullName", createdAccount.getCustomerName());
        response.put("email", createdAccount.getCustomerEmail());
        response.put("role", "CUSTOMER");
        response.put("accountType", "CUSTOMER");

        return ResponseEntity.ok(response);
    }
}
