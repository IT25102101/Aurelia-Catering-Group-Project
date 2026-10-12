package com.aurelia.catering;

import com.aurelia.catering.controller.StaffController;
import com.aurelia.catering.dao.StaffDao;
import com.aurelia.catering.model.Staff;
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
 * MockMvc Controller Tests for StaffController.
 * Module: Staff Management.
 */
public class StaffControllerTest {

    private MockMvc mockMvc;

    @Mock
    private StaffDao staffDao;

    @InjectMocks
    private StaffController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /api/staffs should return all staff members")
    void testGetAllStaff() throws Exception {
        Staff s1 = new Staff();
        s1.setId(1);
        s1.setName("Sunil Perera");
        s1.setRole("CHEF");

        when(staffDao.getAll()).thenReturn(List.of(s1));

        mockMvc.perform(get("/api/staffs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Sunil Perera")))
                .andExpect(jsonPath("$[0].role", is("CHEF")));
    }

    @Test
    @DisplayName("POST /api/staffs should validate required name")
    void testCreateStaffValidation() throws Exception {
        String jsonBody = "{\"name\":\"\",\"role\":\"DRIVER\"}";

        mockMvc.perform(post("/api/staffs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/staffs should create staff member successfully")
    void testCreateStaffSuccess() throws Exception {
        Staff created = new Staff();
        created.setId(10);
        created.setName("Rohan Silva");
        created.setRole("DRIVER");

        when(staffDao.create(any(Staff.class))).thenReturn(created);

        String jsonBody = "{\"name\":\"Rohan Silva\",\"role\":\"DRIVER\",\"phone\":\"0712345678\"}";

        mockMvc.perform(post("/api/staffs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(10)))
                .andExpect(jsonPath("$.name", is("Rohan Silva")));
    }
}
