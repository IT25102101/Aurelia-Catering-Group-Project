package com.aurelia.catering;

import com.aurelia.catering.controller.DeliveryController;
import com.aurelia.catering.dao.DeliveryDao;
import com.aurelia.catering.model.Delivery;
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
 * MockMvc Controller Tests for DeliveryController.
 * Module: Delivery Management.
 */
public class DeliveryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DeliveryDao deliveryDao;

    @InjectMocks
    private DeliveryController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/deliveries should return list of deliveries")
    void testGetAllDeliveries() throws Exception {
        Delivery d1 = new Delivery();
        d1.setId(1);
        d1.setOrderId(100);
        d1.setStatus("Scheduled");
        d1.setLocation("123 Galle Road, Colombo");

        when(deliveryDao.getAll()).thenReturn(List.of(d1));

        mockMvc.perform(get("/api/deliveries"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].orderId", is(100)))
                .andExpect(jsonPath("$[0].status", is("Scheduled")));
    }

    @Test
    @DisplayName("POST /api/deliveries should create delivery")
    void testCreateDelivery() throws Exception {
        Delivery created = new Delivery();
        created.setId(5);
        created.setOrderId(200);
        created.setStatus("Out for Delivery");

        when(deliveryDao.create(any(Delivery.class))).thenReturn(created);

        String jsonBody = "{\"orderId\":200,\"deliveryAddress\":\"45 Kandy Rd\",\"status\":\"Out for Delivery\"}";

        mockMvc.perform(post("/api/deliveries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(5)))
                .andExpect(jsonPath("$.status", is("Out for Delivery")));
    }

    @Test
    @DisplayName("DELETE /api/deliveries/{id} should delete delivery")
    void testDeleteDelivery() throws Exception {
        doNothing().when(deliveryDao).delete(10);

        mockMvc.perform(delete("/api/deliveries/10"))
                .andExpect(status().isOk());

        verify(deliveryDao, times(1)).delete(10);
    }
}
