package com.aurelia.catering;

import com.aurelia.catering.controller.OrderController;
import com.aurelia.catering.dao.OrderDao;
import com.aurelia.catering.model.InventoryCheckResult;
import com.aurelia.catering.model.Order;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc Controller Tests for OrderController.
 * Module: Order Management.
 */
public class OrderControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OrderDao orderDao;

    @InjectMocks
    private OrderController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/orders should return all orders")
    void testGetAllOrders() throws Exception {
        Order o1 = new Order();
        o1.setOrderId(101);
        o1.setStatus("Pending");

        when(orderDao.getAllOrders()).thenReturn(List.of(o1));

        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].orderId", is(101)))
                .andExpect(jsonPath("$[0].status", is("Pending")));
    }

    @Test
    @DisplayName("GET /api/orders/{id} should return 200 OK when found")
    void testGetOrderByIdFound() throws Exception {
        Order o1 = new Order();
        o1.setOrderId(202);
        o1.setStatus("Confirmed");

        when(orderDao.getOrderById(202)).thenReturn(o1);

        mockMvc.perform(get("/api/orders/202"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId", is(202)))
                .andExpect(jsonPath("$.status", is("Confirmed")));
    }

    @Test
    @DisplayName("POST /api/orders should validate customer ID")
    void testCreateOrderValidationMissingCustomer() throws Exception {
        String jsonBody = "{\"totalAmount\":50000.0}";

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Valid CustomerID is required.")));
    }

    @Test
    @DisplayName("POST /api/orders/guest should validate required booking fields")
    void testCreateGuestOrderValidation() throws Exception {
        String jsonBody = "{\"name\":\"\",\"email\":\"test@test.com\"}";

        mockMvc.perform(post("/api/orders/guest")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Customer name is required.")));
    }

    @Test
    @DisplayName("PUT /api/orders/{id}/status should update status successfully")
    void testUpdateOrderStatus() throws Exception {
        Order o1 = new Order();
        o1.setOrderId(300);
        o1.setStatus("Pending");

        when(orderDao.getOrderById(300)).thenReturn(o1);
        doNothing().when(orderDao).updateOrderStatus(300, "In Preparation");

        String jsonBody = "{\"status\":\"In Preparation\"}";

        mockMvc.perform(put("/api/orders/300/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId", is(300)));

        verify(orderDao, times(1)).updateOrderStatus(300, "In Preparation");
    }

    @Test
    @DisplayName("GET /api/orders/{id}/inventory-check should return stock assessment")
    void testCheckInventory() throws Exception {
        InventoryCheckResult check = new InventoryCheckResult();
        check.setOrderId(101);
        check.setCanConfirm(true);

        when(orderDao.checkInventory(101)).thenReturn(check);

        mockMvc.perform(get("/api/orders/101/inventory-check"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId", is(101)))
                .andExpect(jsonPath("$.canConfirm", is(true)));
    }

    @Test
    @DisplayName("POST /api/orders/{id}/confirm should return 400 when insufficient inventory")
    void testConfirmOrderInsufficientStock() throws Exception {
        InventoryCheckResult check = new InventoryCheckResult();
        check.setOrderId(101);
        check.setCanConfirm(false);

        when(orderDao.confirmOrder(101)).thenReturn(check);

        mockMvc.perform(post("/api/orders/101/confirm"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.canConfirm", is(false)));
    }
}
