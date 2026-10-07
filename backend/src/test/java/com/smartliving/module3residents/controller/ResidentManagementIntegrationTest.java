package com.smartliving.module3residents.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartliving.module1authentication.dto.LoginRequest;
import com.smartliving.module3residents.dto.BedAllocationRequest;
import com.smartliving.module3residents.dto.ResidentOnboardingRequest;
import com.smartliving.module3residents.dto.ResidentProfileUpdateRequest;
import com.smartliving.module3residents.model.IdProofType;
import com.smartliving.module2propertyrooms.rooms.model.Bed;
import com.smartliving.module2propertyrooms.rooms.model.BedStatus;
import com.smartliving.module2propertyrooms.rooms.repository.BedRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ResidentManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BedRepository bedRepository;

    private String adminToken;
    private String residentToken;

    @BeforeEach
    void setUp() throws Exception {
        // Authenticate admin
        LoginRequest adminLogin = new LoginRequest("admin@smartliving.local", "Admin@12345");
        MvcResult adminResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode adminNode = objectMapper.readTree(adminResult.getResponse().getContentAsString());
        adminToken = adminNode.get("data").get("token").asText();

        // Authenticate seeded resident
        LoginRequest residentLogin = new LoginRequest("rahul.resident@smartliving.local", "Resident@12345");
        MvcResult residentResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentLogin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode residentNode = objectMapper.readTree(residentResult.getResponse().getContentAsString());
        residentToken = residentNode.get("data").get("token").asText();
    }

    @Test
    @DisplayName("Should fetch all residents with seeded resident present")
    void shouldFetchAllResidents() throws Exception {
        mockMvc.perform(get("/api/residents")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].fullName").value("Rahul Sharma"))
                .andExpect(jsonPath("$.data[0].email").value("rahul.resident@smartliving.local"))
                .andExpect(jsonPath("$.data[0].bedNumber").isNotEmpty());
    }

    @Test
    @DisplayName("Should fetch resident summary metrics")
    void shouldFetchResidentSummary() throws Exception {
        mockMvc.perform(get("/api/residents/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalResidents", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.activeResidents", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.allocatedBedsCount", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("Should allow resident to view their own profile via /me")
    void shouldFetchOwnProfile() throws Exception {
        mockMvc.perform(get("/api/residents/me")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Rahul Sharma"))
                .andExpect(jsonPath("$.data.emergencyContactName").value("Suresh Sharma"))
                .andExpect(jsonPath("$.data.bedNumber").isNotEmpty());
    }

    @Test
    @DisplayName("Should allow resident to update their own contact details")
    void shouldUpdateOwnProfile() throws Exception {
        ResidentProfileUpdateRequest updateRequest = new ResidentProfileUpdateRequest();
        updateRequest.setPhone("+91-9988776655");
        updateRequest.setEmergencyContactPhone("+91-9988770000");

        mockMvc.perform(put("/api/residents/me")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.phone").value("+91-9988776655"))
                .andExpect(jsonPath("$.data.emergencyContactPhone").value("+91-9988770000"));
    }

    @Test
    @DisplayName("Should onboard a new resident and allocate bed")
    void shouldOnboardResidentAndAllocateBed() throws Exception {
        List<Bed> freeBeds = bedRepository.findAll().stream()
                .filter(b -> b.getStatus() == BedStatus.AVAILABLE)
                .toList();

        Bed targetBed = freeBeds.get(0);
        String uniqueEmail = "new.resident." + System.nanoTime() + "@smartliving.local";

        ResidentOnboardingRequest req = new ResidentOnboardingRequest();
        req.setFullName("Priya Patel");
        req.setEmail(uniqueEmail);
        req.setPhone("+91-9871122334");
        req.setPassword("Priya@12345");
        req.setBedId(targetBed.getId());
        req.setIdProofType(IdProofType.AADHAAR);
        req.setIdProofNumber("9988-7766-5544");
        req.setEmergencyContactName("Kirit Patel");
        req.setEmergencyContactRelation("Parent");
        req.setEmergencyContactPhone("+91-9871100000");
        req.setMonthlyRent(new BigDecimal("8000.00"));
        req.setDepositAmount(new BigDecimal("16000.00"));

        MvcResult result = mockMvc.perform(post("/api/residents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Priya Patel"))
                .andExpect(jsonPath("$.data.bedNumber").value(targetBed.getBedNumber()))
                .andReturn();

        // Verify target bed is now OCCUPIED
        Bed reloadedBed = bedRepository.findById(targetBed.getId()).orElseThrow();
        assertEquals(BedStatus.OCCUPIED, reloadedBed.getStatus());
    }

    @Test
    @DisplayName("Should checkout resident and free allocated bed")
    void shouldCheckoutResidentAndFreeBed() throws Exception {
        List<Bed> freeBeds = bedRepository.findAll().stream()
                .filter(b -> b.getStatus() == BedStatus.AVAILABLE)
                .toList();

        Bed targetBed = freeBeds.get(0);
        String uniqueEmail = "checkout.test." + System.nanoTime() + "@smartliving.local";

        ResidentOnboardingRequest req = new ResidentOnboardingRequest();
        req.setFullName("Ankit Verma");
        req.setEmail(uniqueEmail);
        req.setPhone("+91-9811223344");
        req.setBedId(targetBed.getId());
        req.setEmergencyContactName("Sunita Verma");
        req.setEmergencyContactRelation("Mother");
        req.setEmergencyContactPhone("+91-9811000000");

        MvcResult createResult = mockMvc.perform(post("/api/residents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode createdNode = objectMapper.readTree(createResult.getResponse().getContentAsString());
        long residentId = createdNode.get("data").get("id").asLong();

        // Perform checkout
        mockMvc.perform(put("/api/residents/" + residentId + "/checkout")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CHECKED_OUT"))
                .andExpect(jsonPath("$.data.bedNumber").doesNotExist());

        // Bed should now be AVAILABLE again
        Bed freedBed = bedRepository.findById(targetBed.getId()).orElseThrow();
        assertEquals(BedStatus.AVAILABLE, freedBed.getStatus());
        assertNull(freedBed.getCurrentResidentId());
    }

    @Test
    @DisplayName("Should deny regular resident from onboarding others")
    void shouldDenyResidentFromOnboarding() throws Exception {
        ResidentOnboardingRequest req = new ResidentOnboardingRequest();
        req.setFullName("Unauthorized Resident");
        req.setEmail("unauth@smartliving.local");
        req.setPhone("+91-9000000000");
        req.setEmergencyContactName("Emergency");
        req.setEmergencyContactRelation("Friend");
        req.setEmergencyContactPhone("+91-9000000001");

        mockMvc.perform(post("/api/residents")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }
}
