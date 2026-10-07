package com.smartliving.module9food.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartliving.module1authentication.dto.LoginRequest;
import com.smartliving.module9food.dto.CreateMealMenuRequest;
import com.smartliving.module9food.dto.MealFeedbackRequest;
import com.smartliving.module9food.dto.MealOptOutRequest;
import com.smartliving.module9food.model.MealType;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class FoodManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String residentToken;
    private static Long createdMenuId;

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
    @DisplayName("Admin creates breakfast menu — 201 Created")
    void testAdminCreatesMenu() throws Exception {
        CreateMealMenuRequest request = new CreateMealMenuRequest(
                LocalDate.now(),
                MealType.BREAKFAST,
                "South Indian Delight",
                "Idli, Medu Vada, Coconut Chutney, Sambar, Filter Coffee",
                true,
                "Gluten-free option available",
                "450 kcal"
        );

        MvcResult result = mockMvc.perform(post("/api/food/menu")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("South Indian Delight"))
                .andExpect(jsonPath("$.mealType").value("BREAKFAST"))
                .andExpect(jsonPath("$.veg").value(true))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdMenuId = node.get("id").asLong();
    }

    @Test
    @Order(2)
    @DisplayName("Admin creates dinner menu — 201 Created")
    void testAdminCreatesDinnerMenu() throws Exception {
        CreateMealMenuRequest request = new CreateMealMenuRequest(
                LocalDate.now(),
                MealType.DINNER,
                "North Indian Thali",
                "Paneer Butter Masala, Dal Tadka, Jeera Rice, Phulka, Gulab Jamun",
                true,
                "Nut-free curry",
                "680 kcal"
        );

        mockMvc.perform(post("/api/food/menu")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mealType").value("DINNER"))
                .andExpect(jsonPath("$.calories").value("680 kcal"));
    }

    @Test
    @Order(3)
    @DisplayName("Resident fetches today's daily menu — returns list")
    void testResidentGetsDailyMenu() throws Exception {
        mockMvc.perform(get("/api/food/menu/daily")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$[0].title").isNotEmpty());
    }

    @Test
    @Order(4)
    @DisplayName("Resident opts out of dinner to prevent food waste — 201 Created")
    void testResidentOptsOut() throws Exception {
        MealOptOutRequest optOut = new MealOptOutRequest(
                LocalDate.now(),
                MealType.DINNER,
                "Dining out with colleagues"
        );

        mockMvc.perform(post("/api/food/opt-out")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(optOut)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mealType").value("DINNER"))
                .andExpect(jsonPath("$.reason").value("Dining out with colleagues"));
    }

    @Test
    @Order(5)
    @DisplayName("Resident duplicate opt-out rejected — 400 Bad Request")
    void testDuplicateOptOutRejected() throws Exception {
        MealOptOutRequest optOut = new MealOptOutRequest(
                LocalDate.now(),
                MealType.DINNER,
                "Another reason"
        );

        mockMvc.perform(post("/api/food/opt-out")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(optOut)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(6)
    @DisplayName("Resident rates meal menu — 201 Created")
    void testResidentRatesMeal() throws Exception {
        MealFeedbackRequest feedback = new MealFeedbackRequest(
                createdMenuId,
                5,
                "Crispy medu vada and delicious sambar!"
        );

        mockMvc.perform(post("/api/food/feedback")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(feedback)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.residentName").value("Rahul Sharma"));
    }

    @Test
    @Order(7)
    @DisplayName("Admin fetches mess summary KPI — metrics calculated")
    void testAdminGetsMessSummary() throws Exception {
        mockMvc.perform(get("/api/food/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMenusToday", greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.totalOptOutsToday", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.averageRating", greaterThanOrEqualTo(4.0)));
    }

    @Test
    @Order(8)
    @DisplayName("Resident cancels opt-out — 204 No Content")
    void testResidentCancelsOptOut() throws Exception {
        mockMvc.perform(delete("/api/food/opt-out")
                        .header("Authorization", "Bearer " + residentToken)
                        .param("date", LocalDate.now().toString())
                        .param("mealType", "DINNER"))
                .andExpect(status().isNoContent());
    }
}
