package com.smartliving.module1authentication.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartliving.module1authentication.dto.LoginRequest;
import com.smartliving.module1authentication.dto.RegisterRequest;
import com.smartliving.module1authentication.users.model.RoleType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Should register a new resident user successfully")
    void shouldRegisterNewUserSuccessfully() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "Jane Resident",
                "jane.resident@smartliving.local",
                "Password@123",
                "+91-9811223344",
                RoleType.ROLE_RESIDENT
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("jane.resident@smartliving.local"))
                .andExpect(jsonPath("$.data.token").isNotEmpty());
    }

    @Test
    @DisplayName("Should fail registration when email is duplicated")
    void shouldFailRegistrationWhenEmailIsDuplicate() throws Exception {
        RegisterRequest initialRequest = new RegisterRequest(
                "Duplicate User",
                "duplicate@smartliving.local",
                "Password@123",
                "+91-9999999999",
                RoleType.ROLE_RESIDENT
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initialRequest)))
                .andExpect(status().isCreated());

        // Attempting with identical email
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initialRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is already registered: duplicate@smartliving.local"));
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void shouldLoginSuccessfullyWithValidCredentials() throws Exception {
        RegisterRequest reg = new RegisterRequest(
                "Login Test",
                "login.test@smartliving.local",
                "SecurePass123",
                "+91-9871122334",
                RoleType.ROLE_RESIDENT
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest("login.test@smartliving.local", "SecurePass123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.email").value("login.test@smartliving.local"));
    }

    @Test
    @DisplayName("Should fail login with invalid password")
    void shouldFailLoginWithInvalidCredentials() throws Exception {
        LoginRequest badLogin = new LoginRequest("admin@smartliving.local", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should fetch current user profile when authenticated with JWT")
    void shouldGetProfileWithValidJwtToken() throws Exception {
        RegisterRequest reg = new RegisterRequest(
                "Profile Test",
                "profile.test@smartliving.local",
                "SecurePass123",
                "+91-9123456789",
                RoleType.ROLE_SECURITY
        );

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = responseNode.get("data").get("token").asText();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("profile.test@smartliving.local"))
                .andExpect(jsonPath("$.data.roles[0]").value("ROLE_SECURITY"));
    }
}
