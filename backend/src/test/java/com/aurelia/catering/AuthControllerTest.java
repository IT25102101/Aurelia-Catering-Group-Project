package com.aurelia.catering;

import com.aurelia.catering.controller.AuthController;
import com.aurelia.catering.dao.CustomerAccountDao;
import com.aurelia.catering.dao.StaffAccountDao;
import com.aurelia.catering.model.CustomerAccount;
import com.aurelia.catering.model.StaffAccount;
import com.aurelia.catering.util.PasswordUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc Controller Tests for AuthController.
 * Module: Authentication and User Management.
 */
public class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private StaffAccountDao staffAccountDao;

    @Mock
    private CustomerAccountDao customerAccountDao;

    @InjectMocks
    private AuthController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("POST /api/auth/login should return 401 when email/username or password is missing")
    void testLoginMissingCredentials() throws Exception {
        String jsonBody = "{\"email\":\"\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(containsString("required")));
    }

    @Test
    @DisplayName("POST /api/auth/login should succeed for active Staff account")
    void testStaffLoginSuccess() throws Exception {
        String rawPass = "StaffSecure#1";
        String hashedPass = PasswordUtil.hash(rawPass);

        StaffAccount staff = new StaffAccount();
        staff.setAccountId(1);
        staff.setStaffId(10);
        staff.setStaffName("Admin User");
        staff.setStaffEmail("admin@aurelia.com");
        staff.setStaffRole("ADMIN");
        staff.setAccountStatus("Active");
        staff.setPasswordHash(hashedPass);

        when(staffAccountDao.findByUsernameOrEmail("admin@aurelia.com")).thenReturn(staff);

        String jsonBody = "{\"email\":\"admin@aurelia.com\",\"password\":\"" + rawPass + "\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(10)))
                .andExpect(jsonPath("$.role", is("ADMIN")))
                .andExpect(jsonPath("$.accountType", is("STAFF")));

        verify(staffAccountDao, times(1)).updateLastLogin(1);
    }

    @Test
    @DisplayName("POST /api/auth/login should reject inactive Staff account")
    void testStaffLoginInactiveAccount() throws Exception {
        String rawPass = "StaffSecure#1";
        String hashedPass = PasswordUtil.hash(rawPass);

        StaffAccount staff = new StaffAccount();
        staff.setAccountId(2);
        staff.setStaffEmail("inactive@aurelia.com");
        staff.setAccountStatus("Inactive");
        staff.setPasswordHash(hashedPass);

        when(staffAccountDao.findByUsernameOrEmail("inactive@aurelia.com")).thenReturn(staff);

        String jsonBody = "{\"email\":\"inactive@aurelia.com\",\"password\":\"" + rawPass + "\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(containsString("account is currently inactive")));
    }

    @Test
    @DisplayName("POST /api/auth/login should succeed for active Customer account")
    void testCustomerLoginSuccess() throws Exception {
        String rawPass = "CustPass#2026";
        String hashedPass = PasswordUtil.hash(rawPass);

        CustomerAccount customer = new CustomerAccount();
        customer.setAccountId(5);
        customer.setCustomerId(50);
        customer.setCustomerName("Nimal Perera");
        customer.setCustomerEmail("nimal@gmail.com");
        customer.setAccountStatus("Active");
        customer.setPasswordHash(hashedPass);

        when(staffAccountDao.findByUsernameOrEmail("nimal@gmail.com")).thenReturn(null);
        when(customerAccountDao.findByCustomerEmail("nimal@gmail.com")).thenReturn(customer);

        String jsonBody = "{\"email\":\"nimal@gmail.com\",\"password\":\"" + rawPass + "\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(50)))
                .andExpect(jsonPath("$.fullName", is("Nimal Perera")))
                .andExpect(jsonPath("$.role", is("CUSTOMER")))
                .andExpect(jsonPath("$.accountType", is("CUSTOMER")));

        verify(customerAccountDao, times(1)).updateLastLogin(5);
    }

    @Test
    @DisplayName("POST /api/auth/login should return 401 when password does not match")
    void testLoginWrongPassword() throws Exception {
        String hashedPass = PasswordUtil.hash("CorrectPassword");

        CustomerAccount customer = new CustomerAccount();
        customer.setAccountId(5);
        customer.setCustomerEmail("customer@gmail.com");
        customer.setPasswordHash(hashedPass);

        when(staffAccountDao.findByUsernameOrEmail("customer@gmail.com")).thenReturn(null);
        when(customerAccountDao.findByCustomerEmail("customer@gmail.com")).thenReturn(customer);

        String jsonBody = "{\"email\":\"customer@gmail.com\",\"password\":\"WrongPassword\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(containsString("Incorrect email/username or password.")));
    }

    @Test
    @DisplayName("POST /api/auth/register should validate required fields")
    void testRegisterMissingFields() throws Exception {
        String jsonBody = "{\"fullName\":\"\",\"email\":\"test@test.com\",\"password\":\"pass\"}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Full name is required.")));
    }

    @Test
    @DisplayName("POST /api/auth/register should reject already registered email")
    void testRegisterDuplicateEmail() throws Exception {
        when(customerAccountDao.emailExists("existing@example.com")).thenReturn(true);

        String jsonBody = "{\"fullName\":\"Kamal\",\"email\":\"existing@example.com\",\"password\":\"secret123\"}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("already exists")));
    }

    @Test
    @DisplayName("POST /api/auth/register should successfully register customer with hashed password")
    void testRegisterSuccess() throws Exception {
        when(customerAccountDao.emailExists("newuser@example.com")).thenReturn(false);

        CustomerAccount created = new CustomerAccount();
        created.setAccountId(12);
        created.setCustomerId(120);
        created.setCustomerName("Kamal Silva");
        created.setCustomerEmail("newuser@example.com");

        when(customerAccountDao.registerCustomerWithAccount(
                eq("Kamal Silva"), eq("newuser@example.com"), any(), anyString()))
                .thenReturn(created);

        String jsonBody = "{\"fullName\":\"Kamal Silva\",\"email\":\"newuser@example.com\",\"password\":\"SecretPass#123\",\"phone\":\"0771234567\"}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(120)))
                .andExpect(jsonPath("$.fullName", is("Kamal Silva")))
                .andExpect(jsonPath("$.role", is("CUSTOMER")));

        verify(customerAccountDao, times(1)).registerCustomerWithAccount(
                eq("Kamal Silva"), eq("newuser@example.com"), eq("0771234567"), anyString());
    }
}
