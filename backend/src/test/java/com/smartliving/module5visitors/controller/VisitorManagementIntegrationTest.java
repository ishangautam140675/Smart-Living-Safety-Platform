package com.smartliving.module5visitors.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartliving.module1authentication.dto.LoginRequest;
import com.smartliving.module5visitors.dto.VisitorCheckInRequest;
import com.smartliving.module5visitors.dto.VisitorCheckOutRequest;
import com.smartliving.module5visitors.dto.VisitorPassRequest;
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

import java.time.LocalDate;
import java.time.LocalTime;

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
class VisitorManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String residentToken;
    private static String createdPassCode;

    @BeforeEach
    void setUp() throws Exception {
        // Authenticate admin
        LoginRequest adminLogin = new LoginRequest("admin@smartliving.local", "Admin@12345");
        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode adminJson = objectMapper.readTree(adminResult.getResponse().getContentAsString());
        adminToken = adminJson.get("data").get("token").asText();

        // Authenticate seeded resident
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
    @DisplayName("Resident creates a visitor pass — returns 201 Created with passCode")
    void testResidentCreatesVisitorPass() throws Exception {
        VisitorPassRequest request = new VisitorPassRequest(
                "Amit Kumar",
                "+919876543210",
                "College Project Discussion",
                LocalDate.now(),
                LocalTime.of(15, 30)
        );
        request.setVehicleNumber("DL-01-AB-1234");
        request.setHostNotes("Bringing study material");

        MvcResult result = mockMvc.perform(post("/api/visitors/passes")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.passCode", startsWith("VP-")))
                .andExpect(jsonPath("$.visitorName").value("Amit Kumar"))
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.residentName").value("Rahul Sharma"))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdPassCode = node.get("passCode").asText();
    }

    @Test
    @Order(2)
    @DisplayName("Resident views their visitor passes — returns list with created pass")
    void testResidentViewsOwnPasses() throws Exception {
        mockMvc.perform(get("/api/visitors/my-passes")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].visitorName").value("Amit Kumar"))
                .andExpect(jsonPath("$[0].passCode").value(createdPassCode));
    }

    @Test
    @Order(3)
    @DisplayName("Admin / Security searches passes — returns list matching search")
    void testAdminSearchesPasses() throws Exception {
        mockMvc.perform(get("/api/visitors/passes")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("keyword", "Amit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].visitorName").value("Amit Kumar"));
    }

    @Test
    @Order(4)
    @DisplayName("Lookup pass by code — returns pass details")
    void testGetPassByCode() throws Exception {
        mockMvc.perform(get("/api/visitors/passes/" + createdPassCode)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passCode").value(createdPassCode))
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @Order(5)
    @DisplayName("Security checks in visitor — status transitions to CHECKED_IN")
    void testCheckInVisitor() throws Exception {
        VisitorCheckInRequest checkInRequest = new VisitorCheckInRequest(
                "DL-01-AB-1234",
                "Aadhar Card",
                "1234-5678-9012",
                "Verified physical ID proof at main gate"
        );

        mockMvc.perform(post("/api/visitors/passes/" + createdPassCode + "/check-in")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkInRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passCode").value(createdPassCode))
                .andExpect(jsonPath("$.status").value("CHECKED_IN"))
                .andExpect(jsonPath("$.checkInTime").isNotEmpty())
                .andExpect(jsonPath("$.idProofType").value("Aadhar Card"));
    }

    @Test
    @Order(6)
    @DisplayName("Cannot check in twice — returns 400 Bad Request")
    void testCannotCheckInTwice() throws Exception {
        mockMvc.perform(post("/api/visitors/passes/" + createdPassCode + "/check-in")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VisitorCheckInRequest())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(7)
    @DisplayName("Security checks out visitor — status transitions to CHECKED_OUT")
    void testCheckOutVisitor() throws Exception {
        VisitorCheckOutRequest checkOutRequest = new VisitorCheckOutRequest("Left premises smoothly via Gate 1");

        mockMvc.perform(post("/api/visitors/passes/" + createdPassCode + "/check-out")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkOutRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passCode").value(createdPassCode))
                .andExpect(jsonPath("$.status").value("CHECKED_OUT"))
                .andExpect(jsonPath("$.checkOutTime").isNotEmpty());
    }

    @Test
    @Order(8)
    @DisplayName("Cannot check out twice — returns 400 Bad Request")
    void testCannotCheckOutTwice() throws Exception {
        mockMvc.perform(post("/api/visitors/passes/" + createdPassCode + "/check-out")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VisitorCheckOutRequest())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(9)
    @DisplayName("Get visitor summary metrics — returns counts")
    void testVisitorSummaryMetrics() throws Exception {
        mockMvc.perform(get("/api/visitors/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPasses", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.checkedOut", greaterThanOrEqualTo(1)));
    }
}
