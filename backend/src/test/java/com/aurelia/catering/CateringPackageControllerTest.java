package com.aurelia.catering;

import com.aurelia.catering.controller.CateringPackageController;
import com.aurelia.catering.factory.WeddingPackage;
import com.aurelia.catering.model.CateringPackage;
import com.aurelia.catering.service.CateringPackageService;
import com.aurelia.catering.strategy.PricingBreakdown;
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
 * MockMvc Controller Tests for CateringPackageController.
 * Module: Catering Package Management.
 */
public class CateringPackageControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CateringPackageService cateringPackageService;

    @InjectMocks
    private CateringPackageController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/catering-packages should return 200 OK with list of packages")
    void testGetAllPackages() throws Exception {
        CateringPackage p1 = new CateringPackage(1, "Wedding Bliss", "Luxury", 75000.0, "Wedding");
        CateringPackage p2 = new CateringPackage(2, "Birthday Fun", "Casual", 25000.0, "Birthday");
        when(cateringPackageService.getAllPackages()).thenReturn(List.of(p1, p2));

        mockMvc.perform(get("/api/catering-packages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name", is("Wedding Bliss")))
                .andExpect(jsonPath("$[0].packageType", is("Wedding")))
                .andExpect(jsonPath("$[1].name", is("Birthday Fun")));

        verify(cateringPackageService, times(1)).getAllPackages();
    }

    @Test
    @DisplayName("GET /api/catering-packages/{id} should return 200 OK when package exists")
    void testGetPackageByIdFound() throws Exception {
        CateringPackage pkg = new WeddingPackage(5, "Gold Wedding", "Full setup", 95000.0);
        when(cateringPackageService.getPackageById(5)).thenReturn(pkg);

        mockMvc.perform(get("/api/catering-packages/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(5)))
                .andExpect(jsonPath("$.name", is("Gold Wedding")))
                .andExpect(jsonPath("$.price", is(95000.0)));

        verify(cateringPackageService, times(1)).getPackageById(5);
    }

    @Test
    @DisplayName("GET /api/catering-packages/{id} should return 404 Not Found when ID does not exist")
    void testGetPackageByIdNotFound() throws Exception {
        when(cateringPackageService.getPackageById(999)).thenReturn(null);

        mockMvc.perform(get("/api/catering-packages/999"))
                .andExpect(status().isNotFound());

        verify(cateringPackageService, times(1)).getPackageById(999);
    }

    @Test
    @DisplayName("POST /api/catering-packages should return 200 OK on valid creation")
    void testCreatePackageSuccess() throws Exception {
        CateringPackage created = new CateringPackage(10, "Corporate High Tea", "Executive", 30000.0, "Corporate");
        when(cateringPackageService.createPackage(any(CateringPackage.class))).thenReturn(created);

        String jsonBody = "{\"name\":\"Corporate High Tea\",\"description\":\"Executive\",\"price\":30000.0,\"packageType\":\"Corporate\"}";

        mockMvc.perform(post("/api/catering-packages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(10)))
                .andExpect(jsonPath("$.name", is("Corporate High Tea")));

        verify(cateringPackageService, times(1)).createPackage(any(CateringPackage.class));
    }

    @Test
    @DisplayName("POST /api/catering-packages should return 400 Bad Request when name is empty")
    void testCreatePackageMissingName() throws Exception {
        String jsonBody = "{\"name\":\" \",\"price\":30000.0,\"packageType\":\"Corporate\"}";

        mockMvc.perform(post("/api/catering-packages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isBadRequest());

        verify(cateringPackageService, never()).createPackage(any());
    }

    @Test
    @DisplayName("POST /api/catering-packages should return 400 Bad Request when price is negative")
    void testCreatePackageNegativePrice() throws Exception {
        String jsonBody = "{\"name\":\"Invalid Price Pkg\",\"price\":-500.0,\"packageType\":\"General\"}";

        mockMvc.perform(post("/api/catering-packages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isBadRequest());

        verify(cateringPackageService, never()).createPackage(any());
    }

    @Test
    @DisplayName("PUT /api/catering-packages/{id} should return 200 OK on valid update")
    void testUpdatePackageSuccess() throws Exception {
        CateringPackage updated = new CateringPackage(5, "Updated Wedding", "New Desc", 80000.0, "Wedding");
        when(cateringPackageService.updatePackage(eq(5), any(CateringPackage.class))).thenReturn(updated);

        String jsonBody = "{\"name\":\"Updated Wedding\",\"description\":\"New Desc\",\"price\":80000.0,\"packageType\":\"Wedding\"}";

        mockMvc.perform(put("/api/catering-packages/5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Wedding")))
                .andExpect(jsonPath("$.price", is(80000.0)));

        verify(cateringPackageService, times(1)).updatePackage(eq(5), any(CateringPackage.class));
    }

    @Test
    @DisplayName("PUT /api/catering-packages/{id} should return 404 Not Found when ID does not exist")
    void testUpdatePackageNotFound() throws Exception {
        when(cateringPackageService.updatePackage(eq(99), any(CateringPackage.class))).thenReturn(null);

        String jsonBody = "{\"name\":\"Nonexistent\",\"price\":50000.0,\"packageType\":\"General\"}";

        mockMvc.perform(put("/api/catering-packages/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/catering-packages/{id} should return 200 OK")
    void testDeletePackage() throws Exception {
        doNothing().when(cateringPackageService).deletePackage(7);

        mockMvc.perform(delete("/api/catering-packages/7"))
                .andExpect(status().isOk());

        verify(cateringPackageService, times(1)).deletePackage(7);
    }

    @Test
    @DisplayName("GET /api/catering-packages/strategies should return list of available pricing strategies")
    void testGetAvailableStrategies() throws Exception {
        List<Map<String, String>> strategies = List.of(
                Map.of("code", "fixed", "name", "Fixed Base Package Pricing"),
                Map.of("code", "per_guest", "name", "Per-Guest Headcount Pricing")
        );
        when(cateringPackageService.getAvailablePricingStrategies()).thenReturn(strategies);

        mockMvc.perform(get("/api/catering-packages/strategies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].code", is("fixed")))
                .andExpect(jsonPath("$[1].code", is("per_guest")));
    }

    @Test
    @DisplayName("POST /api/catering-packages/{id}/calculate-price should return pricing breakdown")
    void testCalculatePriceSuccess() throws Exception {
        PricingBreakdown breakdown = new PricingBreakdown();
        breakdown.setStrategyCode("per_guest");
        breakdown.setBasePrice(50000.0);
        breakdown.setGuestCount(100);
        breakdown.setDiscountAmount(5000.0);
        breakdown.setFinalTotalPrice(95000.0);

        when(cateringPackageService.calculatePackagePrice(1, "per_guest", 100)).thenReturn(breakdown);

        mockMvc.perform(post("/api/catering-packages/1/calculate-price")
                        .param("strategy", "per_guest")
                        .param("guests", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.strategyCode", is("per_guest")))
                .andExpect(jsonPath("$.finalTotalPrice", is(95000.0)))
                .andExpect(jsonPath("$.discountAmount", is(5000.0)));
    }

    @Test
    @DisplayName("POST /api/catering-packages/{id}/calculate-price should return 404 when package not found")
    void testCalculatePriceNotFound() throws Exception {
        when(cateringPackageService.calculatePackagePrice(999, "fixed", 50))
                .thenThrow(new IllegalArgumentException("Package not found with ID: 999"));

        mockMvc.perform(post("/api/catering-packages/999/calculate-price")
                        .param("strategy", "fixed")
                        .param("guests", "50"))
                .andExpect(status().isNotFound());
    }
}
