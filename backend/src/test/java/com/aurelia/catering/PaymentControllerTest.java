package com.aurelia.catering;

import com.aurelia.catering.controller.PaymentController;
import com.aurelia.catering.dao.PaymentDao;
import com.aurelia.catering.model.Payment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc Controller Tests for PaymentController.
 * Module: Quotation and Payment Management.
 */
public class PaymentControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PaymentDao paymentDao;

    @InjectMocks
    private PaymentController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/payments/summary/{orderId} should return payment summary")
    void testGetPaymentSummary() throws Exception {
        Map<String, Object> summary = Map.of(
                "orderId", 50,
                "totalQuoted", 100000.0,
                "totalPaid", 50000.0,
                "balanceDue", 50000.0,
                "paymentStatus", "Partially Paid"
        );

        when(paymentDao.getOrderPaymentSummary(50)).thenReturn(summary);

        mockMvc.perform(get("/api/payments/summary/50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId", is(50)))
                .andExpect(jsonPath("$.balanceDue", is(50000.0)))
                .andExpect(jsonPath("$.paymentStatus", is("Partially Paid")));
    }

    @Test
    @DisplayName("POST /api/payments should validate required positive amount")
    void testCreatePaymentInvalidAmount() throws Exception {
        String jsonBody = "{\"orderId\":50,\"amount\":0.0}";

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Payment amount must be greater than zero.")));
    }

    @Test
    @DisplayName("POST /api/payments should record payment successfully")
    void testCreatePaymentSuccess() throws Exception {
        Map<String, Object> result = Map.of(
                "paymentId", 12,
                "orderId", 50,
                "amount", 25000.0,
                "status", "Completed"
        );

        when(paymentDao.recordOrderPayment(any(Payment.class))).thenReturn(result);

        String jsonBody = "{\"orderId\":50,\"amount\":25000.0,\"paymentMethod\":\"Credit Card\"}";

        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentId", is(12)))
                .andExpect(jsonPath("$.amount", is(25000.0)));
    }
}
