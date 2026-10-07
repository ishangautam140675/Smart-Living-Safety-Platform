package com.smartliving.module10inventory.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartliving.module1authentication.dto.LoginRequest;
import com.smartliving.module10inventory.dto.AuditAssetRequest;
import com.smartliving.module10inventory.dto.CreateAssetRequest;
import com.smartliving.module10inventory.model.AssetCategory;
import com.smartliving.module10inventory.model.AssetCondition;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class InventoryManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private static Long createdAssetId;
    private static Long seededRoomId;

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

        // Get seeded room
        MvcResult roomRes = mockMvc.perform(get("/api/rooms")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode roomArray = objectMapper.readTree(roomRes.getResponse().getContentAsString()).get("data");
        seededRoomId = roomArray.get(0).get("id").asLong();
    }

    @Test
    @Order(1)
    @DisplayName("Admin creates a new inventory asset — 201 Created")
    void testAdminCreatesAsset() throws Exception {
        CreateAssetRequest request = new CreateAssetRequest(
                "AST-AC-101",
                "Daikin 1.5 Ton Inverter AC",
                AssetCategory.APPLIANCE,
                AssetCondition.FUNCTIONAL,
                seededRoomId,
                LocalDate.now().minusMonths(6),
                LocalDate.now().plusYears(2),
                new BigDecimal("42000.00"),
                "High efficiency split air conditioner"
        );

        MvcResult result = mockMvc.perform(post("/api/inventory")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.assetTag").value("AST-AC-101"))
                .andExpect(jsonPath("$.name").value("Daikin 1.5 Ton Inverter AC"))
                .andExpect(jsonPath("$.condition").value("FUNCTIONAL"))
                .andExpect(jsonPath("$.roomId").value(seededRoomId))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdAssetId = node.get("id").asLong();
    }

    @Test
    @Order(2)
    @DisplayName("Duplicate asset tag rejected — 400 Bad Request")
    void testDuplicateTagRejected() throws Exception {
        CreateAssetRequest request = new CreateAssetRequest(
                "AST-AC-101",
                "Duplicate AC Entry",
                AssetCategory.APPLIANCE,
                AssetCondition.FUNCTIONAL,
                seededRoomId,
                LocalDate.now(),
                LocalDate.now().plusYears(1),
                new BigDecimal("40000.00"),
                "Duplicate"
        );

        mockMvc.perform(post("/api/inventory")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(3)
    @DisplayName("Search inventory assets — found by keyword and category")
    void testSearchAssets() throws Exception {
        mockMvc.perform(get("/api/inventory")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("keyword", "Daikin")
                        .param("category", "APPLIANCE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].assetTag").value("AST-AC-101"));
    }

    @Test
    @Order(4)
    @DisplayName("Fetch room assets — returns assets mapped to room")
    void testGetRoomAssets() throws Exception {
        mockMvc.perform(get("/api/inventory/room/" + seededRoomId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].assetTag").value("AST-AC-101"));
    }

    @Test
    @Order(5)
    @DisplayName("Audit asset condition — state transitions to UNDER_REPAIR")
    void testAuditCondition() throws Exception {
        AuditAssetRequest audit = new AuditAssetRequest(
                AssetCondition.UNDER_REPAIR,
                "Cooling coil gas refill required"
        );

        mockMvc.perform(post("/api/inventory/" + createdAssetId + "/audit")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(audit)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.condition").value("UNDER_REPAIR"));
    }

    @Test
    @Order(6)
    @DisplayName("Fetch asset audit history — audit log logged")
    void testAuditHistory() throws Exception {
        mockMvc.perform(get("/api/inventory/" + createdAssetId + "/audit-history")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].previousCondition").value("FUNCTIONAL"))
                .andExpect(jsonPath("$[0].newCondition").value("UNDER_REPAIR"))
                .andExpect(jsonPath("$[0].remarks").value("Cooling coil gas refill required"));
    }

    @Test
    @Order(7)
    @DisplayName("Admin fetches inventory summary KPI — metrics calculated")
    void testInventorySummary() throws Exception {
        mockMvc.perform(get("/api/inventory/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAssets", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.underRepairAssets", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.totalAssetValue", greaterThanOrEqualTo(42000.00)));
    }
}
