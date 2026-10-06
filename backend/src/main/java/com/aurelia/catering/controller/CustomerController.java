package com.aurelia.catering.controller;

import com.aurelia.catering.dao.CustomerDao;
import com.aurelia.catering.model.Customer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Customer Management.
 * Base URL: /api/customers
 */
@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private CustomerDao customerDao;

    // GET /api/customers
    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerDao.getAllCustomers();
    }

    // GET /api/customers/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable("id") int id) {
        Customer customer = customerDao.getCustomerById(id);
        if (customer == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(customer);
    }
}
