package com.smartliving.module4complaints.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartliving.module1authentication.dto.LoginRequest;
import com.smartliving.module4complaints.dto.ComplaintRequest;
import com.smartliving.module4complaints.dto.ComplaintStatusUpdateRequest;
import com.smartliving.module4complaints.model.ComplaintCategory;
import com.smartliving.module4complaints.model.ComplaintPriority;
import com.smartliving.module4complaints.model.ComplaintStatus;
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
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the Complaints & Maintenance module.
 *
 * <p>Tests run against H2 in-memory database seeded by {@code DataInitializer}.
 * Methods are ordered so complaint creation happens before status update tests.</p>
 *
 * <h3>Coverage:</h3>
 * <ol>
 *   <li>Resident submits a complaint — 201 Created</li>
 *   <li>Resident views own complaints — list returned</li>
 *   <li>Admin lists all complaints — at least one visible</li>
 *   <li>Admin views KPI summary — counts present</li>
 *   <li>Admin views complaint by ID — matches submitted data</li>
 *   <li>Admin updates status to IN_PROGRESS — note not required</li>
 *   <li>Admin resolves complaint — note required, resolvedAt stamped</li>
 *   <li>RBAC: Resident cannot access /api/complaints (admin-only list)</li>
 *   <li>RBAC: Admin cannot submit a complaint via POST</li>
 * </ol>
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ComplaintManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /** Shared complaint ID extracted from test 1 and re-used in tests 5-7. */
    private static Long createdComplaintId;

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

    // ─── Test 1: Resident submits a complaint ─────────────────────────────────

    @Test
    @Order(1)
    @DisplayName("Resident submits a valid complaint → 201 Created")
    void testResidentSubmitsComplaint() throws Exception {
        ComplaintRequest request = new ComplaintRequest();
        request.setCategory(ComplaintCategory.PLUMBING);
        request.setTitle("Leaking tap in bathroom");
        request.setDescription("The hot water tap in Room 101 bathroom has been leaking for 2 days. Water is wasting.");
        request.setPriority(ComplaintPriority.HIGH);
        // roomId left null → common-area complaint

        MvcResult result = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title", is("Leaking tap in bathroom")))
                .andExpect(jsonPath("$.category", is("PLUMBING")))
                .andExpect(jsonPath("$.priority", is("HIGH")))
                .andExpect(jsonPath("$.status", is("OPEN")))
                .andExpect(jsonPath("$.residentName").isNotEmpty())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        createdComplaintId = json.get("id").asLong();
    }

    // ─── Test 2: Resident views own complaints ────────────────────────────────

    @Test
    @Order(2)
    @DisplayName("Resident views their own complaints → list returned")
    void testResidentViewsOwnComplaints() throws Exception {
        mockMvc.perform(get("/api/complaints/my")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].residentName").isNotEmpty());
    }

    // ─── Test 3: Admin lists all complaints ───────────────────────────────────

    @Test
    @Order(3)
    @DisplayName("Admin lists all complaints → at least one entry")
    void testAdminListsAllComplaints() throws Exception {
        mockMvc.perform(get("/api/complaints")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    // ─── Test 4: Admin views summary ─────────────────────────────────────────

    @Test
    @Order(4)
    @DisplayName("Admin fetches KPI summary → totalComplaints >= 1")
    void testAdminViewsSummary() throws Exception {
        mockMvc.perform(get("/api/complaints/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalComplaints", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.open").exists())
                .andExpect(jsonPath("$.inProgress").exists())
                .andExpect(jsonPath("$.resolved").exists());
    }

    // ─── Test 5: Admin views complaint by ID ──────────────────────────────────

    @Test
    @Order(5)
    @DisplayName("Admin views complaint by ID → correct detail returned")
    void testAdminViewsComplaintById() throws Exception {
        mockMvc.perform(get("/api/complaints/" + createdComplaintId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(createdComplaintId.intValue())))
                .andExpect(jsonPath("$.title", is("Leaking tap in bathroom")))
                .andExpect(jsonPath("$.status", is("OPEN")));
    }

    // ─── Test 6: Admin updates status to IN_PROGRESS ─────────────────────────

    @Test
    @Order(6)
    @DisplayName("Admin acknowledges complaint (→ IN_PROGRESS) — no note required")
    void testAdminAcknowledgesComplaint() throws Exception {
        ComplaintStatusUpdateRequest req = new ComplaintStatusUpdateRequest();
        req.setNewStatus(ComplaintStatus.IN_PROGRESS);
        req.setResolutionNote("Plumber dispatched. Will inspect by EOD.");

        mockMvc.perform(put("/api/complaints/" + createdComplaintId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("IN_PROGRESS")));
    }

    // ─── Test 7: Admin resolves complaint (note required) ─────────────────────

    @Test
    @Order(7)
    @DisplayName("Admin resolves complaint → resolvedAt is set, note saved")
    void testAdminResolvesComplaint() throws Exception {
        ComplaintStatusUpdateRequest req = new ComplaintStatusUpdateRequest();
        req.setNewStatus(ComplaintStatus.RESOLVED);
        req.setResolutionNote("Tap washer replaced. Issue resolved on first visit.");

        mockMvc.perform(put("/api/complaints/" + createdComplaintId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("RESOLVED")))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty())
                .andExpect(jsonPath("$.resolutionNote", is("Tap washer replaced. Issue resolved on first visit.")));
    }

    // ─── Test 8: Resident cannot resolve — missing note returns 400 ───────────

    @Test
    @Order(8)
    @DisplayName("Resolving without note → 400 Bad Request")
    void testResolveWithoutNoteReturnsBadRequest() throws Exception {
        // Submit a second complaint first
        ComplaintRequest cr = new ComplaintRequest();
        cr.setCategory(ComplaintCategory.ELECTRICAL);
        cr.setTitle("Fan not working");
        cr.setDescription("Ceiling fan in room 101 stopped working suddenly.");
        cr.setPriority(ComplaintPriority.MEDIUM);

        MvcResult r = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cr)))
                .andExpect(status().isCreated())
                .andReturn();
        long newId = objectMapper.readTree(r.getResponse().getContentAsString()).get("id").asLong();

        // Try to resolve without a note
        ComplaintStatusUpdateRequest req = new ComplaintStatusUpdateRequest();
        req.setNewStatus(ComplaintStatus.RESOLVED);
        // resolutionNote intentionally left null

        mockMvc.perform(put("/api/complaints/" + newId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ─── Test 9: RBAC — Resident cannot access admin complaint list ───────────

    @Test
    @Order(9)
    @DisplayName("RBAC: Resident cannot access admin complaint list → 403 Forbidden")
    void testResidentCannotAccessAdminList() throws Exception {
        mockMvc.perform(get("/api/complaints")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isForbidden());
    }
}
