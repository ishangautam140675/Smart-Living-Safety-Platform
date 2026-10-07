package com.smartliving.module12analytics.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Module 12 — Platform Analytics Integration Tests")
class PlatformAnalyticsIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;

    private String adminToken;

    private String getAdminToken() throws Exception {
        if (adminToken != null) return adminToken;
        String body = """
                {"email":"admin@smartliving.local","password":"Admin@12345"}
                """;
        MvcResult r = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn();
        var node = om.readTree(r.getResponse().getContentAsString());
        adminToken = node.get("data").get("token").asText();
        return adminToken;
    }

    @Test
    @DisplayName("M12-T01: Admin can retrieve full platform analytics")
    void getAnalytics() throws Exception {
        mvc.perform(get("/api/analytics")
                        .header("Authorization", "Bearer " + getAdminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRooms").isNumber())
                .andExpect(jsonPath("$.occupancyPercent").isNumber())
                .andExpect(jsonPath("$.totalResidents").isNumber())
                .andExpect(jsonPath("$.totalComplaints").isNumber())
                .andExpect(jsonPath("$.complaintResolutionRate").isNumber())
                .andExpect(jsonPath("$.visitorsToday").isNumber())
                .andExpect(jsonPath("$.collectionRate").isNumber())
                .andExpect(jsonPath("$.totalSosAlerts").isNumber())
                .andExpect(jsonPath("$.totalNotices").isNumber())
                .andExpect(jsonPath("$.avgMessRating").isNumber())
                .andExpect(jsonPath("$.totalAssets").isNumber())
                .andExpect(jsonPath("$.staffShiftsToday").isNumber())
                .andExpect(jsonPath("$.incidentsToday").isNumber());
    }

    @Test
    @DisplayName("M12-T02: Unauthenticated access to analytics is rejected")
    void unauthenticatedRejected() throws Exception {
        mvc.perform(get("/api/analytics"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("M12-T03: Resident user cannot access analytics (admin-only)")
    void residentCannotAccessAnalytics() throws Exception {
        String body = """
                {"email":"rahul.resident@smartliving.local","password":"Resident@12345"}
                """;
        MvcResult r = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn();
        String resToken = om.readTree(r.getResponse().getContentAsString()).get("data").get("token").asText();

        mvc.perform(get("/api/analytics")
                        .header("Authorization", "Bearer " + resToken))
                .andExpect(status().isForbidden());
    }
}
