package com.smartliving.module2propertyrooms.rooms.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartliving.module1authentication.dto.LoginRequest;
import com.smartliving.module1authentication.dto.RegisterRequest;
import com.smartliving.module2propertyrooms.properties.repository.FloorRepository;
import com.smartliving.module2propertyrooms.rooms.dto.BedStatusUpdateRequest;
import com.smartliving.module2propertyrooms.rooms.dto.RoomRequest;
import com.smartliving.module2propertyrooms.rooms.model.BedStatus;
import com.smartliving.module2propertyrooms.rooms.model.RoomType;
import com.smartliving.module1authentication.users.model.RoleType;
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

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RoomAndPropertyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FloorRepository floorRepository;

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

        // Register and authenticate a resident
        String uniqueResidentEmail = "roomtest.resident." + System.nanoTime() + "@smartliving.local";
        RegisterRequest residentReg = new RegisterRequest(
                "Room Test Resident",
                uniqueResidentEmail,
                "Password@123",
                "+91-9870001122",
                RoleType.ROLE_RESIDENT
        );
        MvcResult residentResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(residentReg)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode residentNode = objectMapper.readTree(residentResult.getResponse().getContentAsString());
        residentToken = residentNode.get("data").get("token").asText();
    }

    @Test
    @DisplayName("Should fetch all properties with seeded data")
    void shouldFetchAllPropertiesWithSeededData() throws Exception {
        mockMvc.perform(get("/api/properties")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].name").value("Greenwood Student Living & PG"));
    }

    @Test
    @DisplayName("Should fetch rooms and verify auto-allocated beds")
    void shouldFetchRoomsAndVerifyAutoAllocatedBeds() throws Exception {
        mockMvc.perform(get("/api/rooms")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$.data[0].beds", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Should fetch room occupancy and property summary")
    void shouldFetchRoomSummary() throws Exception {
        mockMvc.perform(get("/api/rooms/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalProperties", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.totalRooms", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.data.totalBeds", greaterThanOrEqualTo(6)));
    }

    @Test
    @DisplayName("Should allow admin to create a new room with auto-generated beds")
    void shouldAllowAdminToCreateRoomWithAutoBeds() throws Exception {
        Long floorId = floorRepository.findAll().get(0).getId();

        RoomRequest request = new RoomRequest();
        request.setFloorId(floorId);
        request.setRoomNumber("ROOM-" + System.nanoTime() % 10000);
        request.setRoomType(RoomType.DOUBLE);
        request.setCapacity(2);
        request.setBaseRent(new BigDecimal("9500.00"));
        request.setDescription("Deluxe Double Room for integration test");

        mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roomNumber").value(request.getRoomNumber()))
                .andExpect(jsonPath("$.data.capacity").value(2))
                .andExpect(jsonPath("$.data.beds", hasSize(2)));
    }

    @Test
    @DisplayName("Should update bed status and recalculate room occupancy")
    void shouldUpdateBedStatusAndRecalculateOccupancy() throws Exception {
        // Fetch first room
        MvcResult roomsResult = mockMvc.perform(get("/api/rooms")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode roomsNode = objectMapper.readTree(roomsResult.getResponse().getContentAsString());
        JsonNode firstRoom = roomsNode.get("data").get(0);
        long roomId = firstRoom.get("id").asLong();
        long bedId = firstRoom.get("beds").get(0).get("id").asLong();

        BedStatusUpdateRequest bedRequest = new BedStatusUpdateRequest();
        bedRequest.setStatus(BedStatus.OCCUPIED);
        bedRequest.setNotes("Allocated during integration test");

        mockMvc.perform(put("/api/rooms/" + roomId + "/beds/" + bedId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bedRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("OCCUPIED"));

        // Verify room occupancy increased
        mockMvc.perform(get("/api/rooms/" + roomId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.occupiedBeds", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("Should deny non-admin resident from creating rooms")
    void shouldDenyNonAdminFromCreatingRooms() throws Exception {
        Long floorId = floorRepository.findAll().get(0).getId();

        RoomRequest request = new RoomRequest();
        request.setFloorId(floorId);
        request.setRoomNumber("UNAUTHORIZED-ROOM");
        request.setRoomType(RoomType.SINGLE);
        request.setCapacity(1);
        request.setBaseRent(new BigDecimal("5000.00"));

        mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
