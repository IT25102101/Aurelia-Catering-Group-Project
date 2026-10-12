package com.aurelia.catering;

import com.aurelia.catering.controller.InventoryItemController;
import com.aurelia.catering.dao.InventoryItemDao;
import com.aurelia.catering.model.InventoryItem;
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
 * MockMvc Controller Tests for InventoryItemController.
 * Module: Inventory Management.
 */
public class InventoryItemControllerTest {

    private MockMvc mockMvc;

    @Mock
    private InventoryItemDao inventoryItemDao;

    @InjectMocks
    private InventoryItemController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/inventory-items should return list of stock items")
    void testGetAllInventoryItems() throws Exception {
        InventoryItem item1 = new InventoryItem();
        item1.setId(1);
        item1.setItemName("Basmati Rice");
        item1.setQuantity(250.0);
        item1.setUnit("kg");

        when(inventoryItemDao.getAll()).thenReturn(List.of(item1));

        mockMvc.perform(get("/api/inventory-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].itemName", is("Basmati Rice")))
                .andExpect(jsonPath("$[0].quantity", is(250.0)));
    }

    @Test
    @DisplayName("POST /api/inventory-items should reject empty item name")
    void testCreateInventoryItemMissingName() throws Exception {
        String jsonBody = "{\"itemName\":\" \",\"quantity\":10.0}";

        mockMvc.perform(post("/api/inventory-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/inventory-items should create item successfully")
    void testCreateInventoryItemSuccess() throws Exception {
        InventoryItem item = new InventoryItem();
        item.setId(5);
        item.setItemName("Chicken Breast");
        item.setQuantity(50.0);
        item.setUnit("kg");

        when(inventoryItemDao.create(any(InventoryItem.class))).thenReturn(item);

        String jsonBody = "{\"itemName\":\"Chicken Breast\",\"quantityInStock\":50.0,\"unit\":\"kg\"}";

        mockMvc.perform(post("/api/inventory-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(5)))
                .andExpect(jsonPath("$.itemName", is("Chicken Breast")));
    }
}
