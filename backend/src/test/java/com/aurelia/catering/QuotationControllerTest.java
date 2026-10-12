package com.aurelia.catering;

import com.aurelia.catering.controller.QuotationController;
import com.aurelia.catering.dao.QuotationDao;
import com.aurelia.catering.model.Quotation;
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

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc Controller Tests for QuotationController.
 * Module: Quotation and Payment Management.
 */
public class QuotationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private QuotationDao quotationDao;

    @InjectMocks
    private QuotationController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/quotations should return all quotations")
    void testGetAllQuotations() throws Exception {
        Quotation q1 = new Quotation();
        q1.setQuotationId(1);
        q1.setOrderId(10);
        q1.setStatus("Sent");
        q1.setTotalAmount(java.math.BigDecimal.valueOf(120000.0));

        when(quotationDao.getAllQuotations()).thenReturn(List.of(q1));

        mockMvc.perform(get("/api/quotations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].quotationId", is(1)))
                .andExpect(jsonPath("$[0].totalAmount", is(120000.0)));
    }

    @Test
    @DisplayName("GET /api/quotations/{id} should restrict access when not customer owner")
    void testGetQuotationAccessDeniedNonOwner() throws Exception {
        Quotation q1 = new Quotation();
        q1.setQuotationId(5);
        q1.setStatus("Sent");

        when(quotationDao.getQuotationById(5)).thenReturn(q1);
        when(quotationDao.isCustomerQuotationOwner(5, 99)).thenReturn(false);

        mockMvc.perform(get("/api/quotations/5").param("customerId", "99"))
                .andExpect(status().isForbidden())
                .andExpect(content().string(containsString("Quotation does not belong to this customer")));
    }

    @Test
    @DisplayName("GET /api/quotations/{id} should hide Draft quotations from customers")
    void testGetQuotationDraftHiddenFromCustomer() throws Exception {
        Quotation q1 = new Quotation();
        q1.setQuotationId(5);
        q1.setStatus("Draft");

        when(quotationDao.getQuotationById(5)).thenReturn(q1);
        when(quotationDao.isCustomerQuotationOwner(5, 42)).thenReturn(true);

        mockMvc.perform(get("/api/quotations/5").param("customerId", "42"))
                .andExpect(status().isForbidden())
                .andExpect(content().string(containsString("Draft quotations cannot be viewed by customers")));
    }

    @Test
    @DisplayName("POST /api/quotations should reject when quotation already exists for order")
    void testCreateQuotationDuplicateOrder() throws Exception {
        when(quotationDao.quotationExistsForOrder(100)).thenReturn(true);

        String jsonBody = "{\"orderId\":100,\"totalAmount\":45000.0}";

        mockMvc.perform(post("/api/quotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Quotation already exists for Order #100")));
    }

    @Test
    @DisplayName("POST /api/quotations should create quotation successfully")
    void testCreateQuotationSuccess() throws Exception {
        when(quotationDao.quotationExistsForOrder(101)).thenReturn(false);

        Quotation created = new Quotation();
        created.setQuotationId(50);
        created.setOrderId(101);
        created.setTotalAmount(java.math.BigDecimal.valueOf(75000.0));
        created.setStatus("Draft");

        when(quotationDao.createQuotation(any(Quotation.class))).thenReturn(created);

        String jsonBody = "{\"orderId\":101,\"totalAmount\":75000.0}";

        mockMvc.perform(post("/api/quotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotationId", is(50)))
                .andExpect(jsonPath("$.status", is("Draft")));
    }
}
