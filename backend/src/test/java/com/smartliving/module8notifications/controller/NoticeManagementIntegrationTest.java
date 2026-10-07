package com.smartliving.module8notifications.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartliving.module1authentication.dto.LoginRequest;
import com.smartliving.module8notifications.dto.CreateNoticeRequest;
import com.smartliving.module8notifications.model.NoticeCategory;
import com.smartliving.module8notifications.model.NoticePriority;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class NoticeManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String residentToken;
    private static Long createdNoticeId;

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
    @DisplayName("Admin publishes a community notice — returns 201 Created")
    void testAdminPublishesNotice() throws Exception {
        CreateNoticeRequest request = new CreateNoticeRequest(
                "Scheduled Water Maintenance Tonight",
                "Water supply will be temporarily paused between 11 PM to 2 AM for overhead tank cleaning.",
                NoticeCategory.MAINTENANCE,
                NoticePriority.HIGH,
                true // pinned
        );

        MvcResult result = mockMvc.perform(post("/api/notices")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Scheduled Water Maintenance Tonight"))
                .andExpect(jsonPath("$.category").value("MAINTENANCE"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.pinned").value(true))
                .andExpect(jsonPath("$.publishedByName").value("System Administrator"))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdNoticeId = node.get("id").asLong();
    }

    @Test
    @Order(2)
    @DisplayName("Resident views public notice board — notice visible with pinned priority")
    void testResidentViewsNotices() throws Exception {
        mockMvc.perform(get("/api/notices")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].title").value("Scheduled Water Maintenance Tonight"));
    }

    @Test
    @Order(3)
    @DisplayName("Filter notices by category and keyword — matches result")
    void testFilterNotices() throws Exception {
        mockMvc.perform(get("/api/notices")
                        .header("Authorization", "Bearer " + residentToken)
                        .param("category", "MAINTENANCE")
                        .param("keyword", "Water"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].id").value(createdNoticeId));
    }

    @Test
    @Order(4)
    @DisplayName("Resident cannot publish notices — 403 Forbidden")
    void testResidentCannotPublish() throws Exception {
        CreateNoticeRequest request = new CreateNoticeRequest(
                "Party in Room 101",
                "Everyone is invited",
                NoticeCategory.EVENT,
                NoticePriority.NORMAL,
                false
        );

        mockMvc.perform(post("/api/notices")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(5)
    @DisplayName("Admin unpins notice — pinned toggled to false")
    void testTogglePin() throws Exception {
        mockMvc.perform(put("/api/notices/" + createdNoticeId + "/pin")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdNoticeId))
                .andExpect(jsonPath("$.pinned").value(false));
    }

    @Test
    @Order(6)
    @DisplayName("Admin deletes notice — returns 204 No Content")
    void testDeleteNotice() throws Exception {
        mockMvc.perform(delete("/api/notices/" + createdNoticeId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Verify it is gone
        mockMvc.perform(get("/api/notices/" + createdNoticeId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }
}
