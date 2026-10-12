package com.aurelia.catering;

import com.aurelia.catering.controller.PackageMenuItemController;
import com.aurelia.catering.dao.PackageMenuItemDao;
import com.aurelia.catering.model.PackageMenuItem;
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
 * MockMvc Controller Tests for PackageMenuItemController.
 * Module: Catering Package Management (Package Menu Item Assignments).
 */
public class PackageMenuItemControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PackageMenuItemDao packageMenuItemDao;

    @InjectMocks
    private PackageMenuItemController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/package-menu-items/package/{packageId} should return assigned items")
    void testGetByPackageId() throws Exception {
        PackageMenuItem item1 = new PackageMenuItem(1, 101, 50);
        item1.setMenuItemName("Chicken Biryani");
        item1.setMenuItemPrice(950.0);

        PackageMenuItem item2 = new PackageMenuItem(1, 102, 50);
        item2.setMenuItemName("Gulab Jamun");
        item2.setMenuItemPrice(350.0);

        when(packageMenuItemDao.getByPackageId(1)).thenReturn(List.of(item1, item2));

        mockMvc.perform(get("/api/package-menu-items/package/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].menuItemName", is("Chicken Biryani")))
                .andExpect(jsonPath("$[1].menuItemName", is("Gulab Jamun")));

        verify(packageMenuItemDao, times(1)).getByPackageId(1);
    }

    @Test
    @DisplayName("POST /api/package-menu-items should assign item successfully")
    void testAssignMenuItemSuccess() throws Exception {
        PackageMenuItem created = new PackageMenuItem(1, 105, 100);
        when(packageMenuItemDao.create(any(PackageMenuItem.class))).thenReturn(created);

        String jsonBody = "{\"packageId\":1,\"menuItemId\":105,\"quantity\":100}";

        mockMvc.perform(post("/api/package-menu-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.packageId", is(1)))
                .andExpect(jsonPath("$.menuItemId", is(105)));

        verify(packageMenuItemDao, times(1)).create(any(PackageMenuItem.class));
    }

    @Test
    @DisplayName("POST /api/package-menu-items should return 400 Bad Request when packageId or menuItemId is null")
    void testAssignMenuItemMissingIds() throws Exception {
        String jsonBody = "{\"quantity\":50}";

        mockMvc.perform(post("/api/package-menu-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Package ID and Menu Item ID are required.")));

        verify(packageMenuItemDao, never()).create(any());
    }

    @Test
    @DisplayName("POST /api/package-menu-items should return 409 Conflict when duplicate assignment is attempted")
    void testAssignMenuItemConflictDuplicate() throws Exception {
        when(packageMenuItemDao.create(any(PackageMenuItem.class)))
                .thenThrow(new IllegalArgumentException("This menu item is already assigned to this catering package."));

        String jsonBody = "{\"packageId\":1,\"menuItemId\":101,\"quantity\":50}";

        mockMvc.perform(post("/api/package-menu-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("already assigned")));
    }

    @Test
    @DisplayName("DELETE /api/package-menu-items/{id} should delete by menuItemId")
    void testDeleteByMenuItemId() throws Exception {
        doNothing().when(packageMenuItemDao).deleteByMenuItemId(101);

        mockMvc.perform(delete("/api/package-menu-items/101"))
                .andExpect(status().isOk());

        verify(packageMenuItemDao, times(1)).deleteByMenuItemId(101);
    }

    @Test
    @DisplayName("DELETE /api/package-menu-items/{packageId}/{menuItemId} should delete specific assignment")
    void testDeleteByPackageAndItem() throws Exception {
        doNothing().when(packageMenuItemDao).delete(1, 101);

        mockMvc.perform(delete("/api/package-menu-items/1/101"))
                .andExpect(status().isOk());

        verify(packageMenuItemDao, times(1)).delete(1, 101);
    }
}
