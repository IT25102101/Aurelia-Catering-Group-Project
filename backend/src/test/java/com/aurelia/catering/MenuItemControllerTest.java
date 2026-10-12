package com.aurelia.catering;

import com.aurelia.catering.controller.MenuItemController;
import com.aurelia.catering.dao.MenuItemDao;
import com.aurelia.catering.model.MenuItem;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc Controller Tests for MenuItemController.
 * Module: Catering Menu Management.
 */
public class MenuItemControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MenuItemDao menuItemDao;

    @InjectMocks
    private MenuItemController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/menu-items should return list of all menu items")
    void testGetAllMenuItems() throws Exception {
        MenuItem item1 = new MenuItem(1, "Vegetable Spring Rolls", "Crispy rolls", 450.0, "Appetizer");
        MenuItem item2 = new MenuItem(2, "Mutton Rogan Josh", "Rich spicy curry", 1800.0, "Main Course");
        when(menuItemDao.getAll()).thenReturn(List.of(item1, item2));

        mockMvc.perform(get("/api/menu-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name", is("Vegetable Spring Rolls")))
                .andExpect(jsonPath("$[1].name", is("Mutton Rogan Josh")));

        verify(menuItemDao, times(1)).getAll();
    }

    @Test
    @DisplayName("GET /api/menu-items/{id} should return 200 OK when item found")
    void testGetMenuItemByIdFound() throws Exception {
        MenuItem item = new MenuItem(5, "Caramel Pudding", "Sweet dessert", 600.0, "Dessert");
        when(menuItemDao.getById(5)).thenReturn(item);

        mockMvc.perform(get("/api/menu-items/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(5)))
                .andExpect(jsonPath("$.name", is("Caramel Pudding")))
                .andExpect(jsonPath("$.price", is(600.0)));

        verify(menuItemDao, times(1)).getById(5);
    }

    @Test
    @DisplayName("GET /api/menu-items/{id} should return 404 when item not found")
    void testGetMenuItemByIdNotFound() throws Exception {
        when(menuItemDao.getById(404)).thenReturn(null);

        mockMvc.perform(get("/api/menu-items/404"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/menu-items should validate name and price and create item")
    void testCreateMenuItemSuccess() throws Exception {
        MenuItem created = new MenuItem(10, "Passion Fruit Mojito", "Mocktail", 550.0, "Beverage");
        when(menuItemDao.create(any(MenuItem.class))).thenReturn(created);

        String jsonBody = "{\"name\":\"Passion Fruit Mojito\",\"description\":\"Mocktail\",\"price\":550.0,\"category\":\"Beverage\"}";

        mockMvc.perform(post("/api/menu-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(10)))
                .andExpect(jsonPath("$.name", is("Passion Fruit Mojito")));
    }

    @Test
    @DisplayName("POST /api/menu-items should reject empty name or negative price")
    void testCreateMenuItemInvalid() throws Exception {
        String jsonBody = "{\"name\":\"\",\"price\":-10.0}";

        mockMvc.perform(post("/api/menu-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isBadRequest());

        verify(menuItemDao, never()).create(any());
    }

    @Test
    @DisplayName("PUT /api/menu-items/{id} should update existing item")
    void testUpdateMenuItemSuccess() throws Exception {
        MenuItem existing = new MenuItem(10, "Old", "Old", 500.0, "Appetizer");
        MenuItem updated = new MenuItem(10, "Updated Dish", "New desc", 700.0, "Appetizer");

        when(menuItemDao.getById(10)).thenReturn(existing);
        when(menuItemDao.update(eq(10), any(MenuItem.class))).thenReturn(updated);

        String jsonBody = "{\"name\":\"Updated Dish\",\"description\":\"New desc\",\"price\":700.0,\"category\":\"Appetizer\"}";

        mockMvc.perform(put("/api/menu-items/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Dish")))
                .andExpect(jsonPath("$.price", is(700.0)));
    }

    @Test
    @DisplayName("DELETE /api/menu-items/{id} should delete item")
    void testDeleteMenuItem() throws Exception {
        doNothing().when(menuItemDao).delete(15);

        mockMvc.perform(delete("/api/menu-items/15"))
                .andExpect(status().isOk());

        verify(menuItemDao, times(1)).delete(15);
    }
}
