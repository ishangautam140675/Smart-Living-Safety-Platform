package com.smartliving.module6payments.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartliving.module1authentication.dto.LoginRequest;
import com.smartliving.module6payments.dto.CreateInvoiceRequest;
import com.smartliving.module6payments.dto.RecordPaymentRequest;
import com.smartliving.module6payments.model.PaymentMethod;
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

import java.math.BigDecimal;
import java.time.LocalDate;

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
class PaymentManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String residentToken;
    private static String createdInvoiceNumber;
    private static Long residentId;

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

        // Get seeded resident id
        MvcResult resList = mockMvc.perform(get("/api/residents")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode residentsArray = objectMapper.readTree(resList.getResponse().getContentAsString()).get("data");
        residentId = residentsArray.get(0).get("id").asLong();
    }

    @Test
    @Order(1)
    @DisplayName("Admin generates monthly rent invoice — 201 Created")
    void testAdminCreatesInvoice() throws Exception {
        CreateInvoiceRequest request = new CreateInvoiceRequest(
                residentId,
                "October 2026 Monthly Rent & Maintenance",
                new BigDecimal("8500.00"),
                LocalDate.now().plusDays(10),
                "OCT-2026"
        );
        request.setDescription("Includes standard room rent, high speed wifi, and housekeeping");

        MvcResult result = mockMvc.perform(post("/api/payments/invoices")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.invoiceNumber", startsWith("INV-")))
                .andExpect(jsonPath("$.amount").value(8500.00))
                .andExpect(jsonPath("$.paidAmount").value(0))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.residentName").value("Rahul Sharma"))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdInvoiceNumber = node.get("invoiceNumber").asText();
    }

    @Test
    @Order(2)
    @DisplayName("Resident fetches their pending invoices — returns list with created invoice")
    void testResidentGetsInvoices() throws Exception {
        mockMvc.perform(get("/api/payments/my-invoices")
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].invoiceNumber").value(createdInvoiceNumber))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    @Order(3)
    @DisplayName("Admin searches invoices by keyword — found")
    void testAdminSearchesInvoices() throws Exception {
        mockMvc.perform(get("/api/payments/invoices")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("keyword", "Rahul"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].residentName").value("Rahul Sharma"));
    }

    @Test
    @Order(4)
    @DisplayName("Fetch single invoice by invoice number — returns complete details")
    void testGetInvoiceByNumber() throws Exception {
        mockMvc.perform(get("/api/payments/invoices/" + createdInvoiceNumber)
                        .header("Authorization", "Bearer " + residentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invoiceNumber").value(createdInvoiceNumber))
                .andExpect(jsonPath("$.balanceAmount").value(8500.00));
    }

    @Test
    @Order(5)
    @DisplayName("Resident makes partial payment — status transitions to PARTIALLY_PAID")
    void testRecordPartialPayment() throws Exception {
        RecordPaymentRequest payRequest = new RecordPaymentRequest(
                new BigDecimal("5000.00"),
                PaymentMethod.UPI,
                "Paid via Google Pay"
        );

        mockMvc.perform(post("/api/payments/invoices/" + createdInvoiceNumber + "/pay")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paidAmount").value(5000.00))
                .andExpect(jsonPath("$.balanceAmount").value(3500.00))
                .andExpect(jsonPath("$.status").value("PARTIALLY_PAID"))
                .andExpect(jsonPath("$.transactions", hasSize(1)))
                .andExpect(jsonPath("$.transactions[0].paymentMethod").value("UPI"));
    }

    @Test
    @Order(6)
    @DisplayName("Payment amount exceeding balance is rejected — 400 Bad Request")
    void testPaymentExceedingBalanceRejected() throws Exception {
        RecordPaymentRequest excessPay = new RecordPaymentRequest(
                new BigDecimal("10000.00"),
                PaymentMethod.UPI,
                "Exceeds balance"
        );

        mockMvc.perform(post("/api/payments/invoices/" + createdInvoiceNumber + "/pay")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(excessPay)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(7)
    @DisplayName("Resident pays remaining balance — status transitions to PAID")
    void testRecordFinalPayment() throws Exception {
        RecordPaymentRequest finalPay = new RecordPaymentRequest(
                new BigDecimal("3500.00"),
                PaymentMethod.NET_BANKING,
                "Remaining balance settled"
        );

        mockMvc.perform(post("/api/payments/invoices/" + createdInvoiceNumber + "/pay")
                        .header("Authorization", "Bearer " + residentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(finalPay)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paidAmount").value(8500.00))
                .andExpect(jsonPath("$.balanceAmount").value(0))
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.transactions", hasSize(2)));
    }

    @Test
    @Order(8)
    @DisplayName("Cannot pay already PAID invoice — 400 Bad Request")
    void testCannotPayPaidInvoice() throws Exception {
        RecordPaymentRequest extraPay = new RecordPaymentRequest(
                new BigDecimal("100.00"),
                PaymentMethod.CASH,
                "Extra tip"
        );

        mockMvc.perform(post("/api/payments/invoices/" + createdInvoiceNumber + "/pay")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(extraPay)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(9)
    @DisplayName("Admin fetches payment KPI summary — metrics aggregated")
    void testPaymentSummary() throws Exception {
        mockMvc.perform(get("/api/payments/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalInvoices", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.paidInvoices", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.totalCollected", greaterThanOrEqualTo(8500.00)));
    }
}
