package com.smartliving.module7emergency.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartliving.module1authentication.dto.LoginRequest;
import com.smartliving.module7emergency.dto.TriggerSosRequest;
import com.smartliving.module7emergency.dto.UpdateAlertStatusRequest;
import com.smartliving.module7emergency.model.EmergencySeverity;
import com.smartliving.module7emergency.model.EmergencyStatus;
import com.smartliving.module7emergency.model.EmergencyType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class EmergencyManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String residentToken;
    private static String createdAlertCode;

    @BeforeEach
    void setUp() throws Exception {
        LoginRequest adminLogin = new LoginRequest("admin@smartliving.local", "Admin@12345");
        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode adminJson = objectMapper.readTree(adminResult.getResponse().getContentAsString());
        adminToken = adminJson.get("data").get("token").asText();

        LoginRequest residentLogin = new LoginRequest("rahul.resident@smartliving.local", "Resident@12345");
        MvcResult residentResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentLogin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode residentJson = objectMapper.readTree(residentResult.getResponse().getContentAsString());
        residentToken = residentJson.get("data").get("token").asText();
    }

    @Test
    @Order(1)
    @DisplayName("Resident presses SOS panic button — returns 201 Created with auto-detected room location")
    void testTriggerSos() throws Exception {
        TriggerSosRequest request = new TriggerSosRequest(
                EmergencyType.MEDICAL,
                EmergencySeverity.CRITICAL,
                null, // will auto-detect from resident's room
                "Chest pain and sudden dizziness, need immediate first responder"
        );

        MvcResult result = mockMvc.perform(post("/api/emergency/sos")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.alertCode", startsWith("SOS-")))
                .andExpect(jsonPath("$.type").value("MEDICAL"))
                .andExpect(jsonPath("$.severity").value("CRITICAL"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.residentName").value("Rahul Sharma"))
                .andExpect(jsonPath("$.locationDetails").isNotEmpty())
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdAlertCode = node.get("alertCode").asText();
    }

    @Test
    @Order(2)
    @DisplayName("Resident fetches their personal emergency alerts — returns list")
    void testGetMyAlerts() throws Exception {
        mockMvc.perform(get("/api/emergency/my-alerts")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].alertCode").value(createdAlertCode))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    @Order(3)
    @DisplayName("Security & Admin searches emergency feed — active alert visible")
    void testSearchEmergencyFeed() throws Exception {
        mockMvc.perform(get("/api/emergency/alerts")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("keyword", "Chest pain"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].alertCode").value(createdAlertCode));
    }

    @Test
    @Order(4)
    @DisplayName("Lookup alert by code — returns alert details")
    void testGetAlertByCode() throws Exception {
        mockMvc.perform(get("/api/emergency/alerts/" + createdAlertCode)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alertCode").value(createdAlertCode))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @Order(5)
    @DisplayName("Security acknowledges emergency alert — status transitions to ACKNOWLEDGED")
    void testAcknowledgeAlert() throws Exception {
        mockMvc.perform(post("/api/emergency/alerts/" + createdAlertCode + "/acknowledge")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alertCode").value(createdAlertCode))
                .andExpect(jsonPath("$.status").value("ACKNOWLEDGED"))
                .andExpect(jsonPath("$.acknowledgedBy").value("admin@smartliving.local"))
                .andExpect(jsonPath("$.acknowledgedAt").isNotEmpty());
    }

    @Test
    @Order(6)
    @DisplayName("Cannot acknowledge already acknowledged alert — 400 Bad Request")
    void testCannotAcknowledgeTwice() throws Exception {
        mockMvc.perform(post("/api/emergency/alerts/" + createdAlertCode + "/acknowledge")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(7)
    @DisplayName("Security resolves emergency alert — status transitions to RESOLVED with notes")
    void testResolveAlert() throws Exception {
        UpdateAlertStatusRequest resolveReq = new UpdateAlertStatusRequest(
                EmergencyStatus.RESOLVED,
                "On-duty paramedic attended resident, vital signs stable, transferred to health center"
        );

        mockMvc.perform(post("/api/emergency/alerts/" + createdAlertCode + "/resolve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alertCode").value(createdAlertCode))
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolvedBy").value("admin@smartliving.local"))
                .andExpect(jsonPath("$.resolutionNotes").isNotEmpty());
    }

    @Test
    @Order(8)
    @DisplayName("Cannot re-resolve an already resolved alert — 400 Bad Request")
    void testCannotResolveResolvedAlert() throws Exception {
        UpdateAlertStatusRequest duplicateResolve = new UpdateAlertStatusRequest(
                EmergencyStatus.RESOLVED,
                "Duplicate resolution attempt"
        );

        mockMvc.perform(post("/api/emergency/alerts/" + createdAlertCode + "/resolve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateResolve)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(9)
    @DisplayName("Fetch emergency dashboard summary — metrics aggregated")
    void testEmergencySummary() throws Exception {
        mockMvc.perform(get("/api/emergency/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAlerts", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.resolvedAlerts", greaterThanOrEqualTo(1)));
    }
}
