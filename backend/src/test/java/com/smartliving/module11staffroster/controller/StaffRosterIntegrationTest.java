package com.smartliving.module11staffroster.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartliving.module11staffroster.dto.CreateShiftRequest;
import com.smartliving.module11staffroster.dto.PatrolLogRequest;
import com.smartliving.module11staffroster.model.ShiftType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Module 11 — Staff Roster Integration Tests")
class StaffRosterIntegrationTest {

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
    @DisplayName("M11-T01: Admin can schedule a shift")
    void scheduleShift() throws Exception {
        CreateShiftRequest req = new CreateShiftRequest();
        req.setStaffUserId(1L); // admin user seeded at ID=1
        req.setShiftType(ShiftType.MORNING);
        req.setShiftDate(LocalDate.now());
        req.setLocation("Main Gate");
        req.setNotes("Routine morning shift");

        mvc.perform(post("/api/roster")
                        .header("Authorization", "Bearer " + getAdminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.shiftType").value("MORNING"))
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.location").value("Main Gate"));
    }

    @Test
    @DisplayName("M11-T02: Admin can clock in a shift")
    void clockIn() throws Exception {
        // Schedule
        CreateShiftRequest req = new CreateShiftRequest();
        req.setStaffUserId(1L);
        req.setShiftType(ShiftType.AFTERNOON);
        req.setShiftDate(LocalDate.now());
        req.setLocation("Block B Entrance");

        MvcResult created = mvc.perform(post("/api/roster")
                        .header("Authorization", "Bearer " + getAdminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isOk()).andReturn();
        Long shiftId = om.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        // Clock In
        mvc.perform(patch("/api/roster/" + shiftId + "/clock-in")
                        .header("Authorization", "Bearer " + getAdminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.clockInTime").isNotEmpty());
    }

    @Test
    @DisplayName("M11-T03: Admin can clock out a shift")
    void clockOut() throws Exception {
        // Schedule
        CreateShiftRequest req = new CreateShiftRequest();
        req.setStaffUserId(1L);
        req.setShiftType(ShiftType.NIGHT);
        req.setShiftDate(LocalDate.now());
        req.setLocation("Parking Zone");

        MvcResult created = mvc.perform(post("/api/roster")
                        .header("Authorization", "Bearer " + getAdminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andReturn();
        Long shiftId = om.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        // Clock In
        mvc.perform(patch("/api/roster/" + shiftId + "/clock-in")
                        .header("Authorization", "Bearer " + getAdminToken()))
                .andExpect(status().isOk());

        // Clock Out
        mvc.perform(patch("/api/roster/" + shiftId + "/clock-out")
                        .header("Authorization", "Bearer " + getAdminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.clockOutTime").isNotEmpty());
    }

    @Test
    @DisplayName("M11-T04: Admin can log patrol checkpoint")
    void logPatrol() throws Exception {
        // Schedule + Clock In
        CreateShiftRequest req = new CreateShiftRequest();
        req.setStaffUserId(1L);
        req.setShiftType(ShiftType.GUARD_PATROL);
        req.setShiftDate(LocalDate.now());
        req.setLocation("Perimeter");

        MvcResult created = mvc.perform(post("/api/roster")
                        .header("Authorization", "Bearer " + getAdminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andReturn();
        Long shiftId = om.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        mvc.perform(patch("/api/roster/" + shiftId + "/clock-in")
                .header("Authorization", "Bearer " + getAdminToken()));

        // Patrol log
        PatrolLogRequest patrolReq = new PatrolLogRequest();
        patrolReq.setShiftId(shiftId);
        patrolReq.setCheckpointName("Gate A");
        patrolReq.setObservationRemarks("All clear");
        patrolReq.setIncidentFlag(false);

        mvc.perform(post("/api/roster/patrol")
                        .header("Authorization", "Bearer " + getAdminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(patrolReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkpointName").value("Gate A"))
                .andExpect(jsonPath("$.incidentFlag").value(false));
    }

    @Test
    @DisplayName("M11-T05: Roster summary returns valid counts")
    void rosterSummary() throws Exception {
        mvc.perform(get("/api/roster/summary")
                        .header("Authorization", "Bearer " + getAdminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalShiftsToday").isNumber())
                .andExpect(jsonPath("$.activeShifts").isNumber())
                .andExpect(jsonPath("$.completedShifts").isNumber());
    }

    @Test
    @DisplayName("M11-T06: Unauthenticated access is rejected")
    void unauthenticatedRejected() throws Exception {
        mvc.perform(get("/api/roster"))
                .andExpect(status().isUnauthorized());
    }
}
