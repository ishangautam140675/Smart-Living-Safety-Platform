package com.smartliving.common.controller;

import com.smartliving.common.dto.HealthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Value("${spring.application.name:smart-living-backend}")
    private String applicationName;

    @GetMapping
    public ResponseEntity<HealthResponse> checkHealth() {
        HealthResponse response = new HealthResponse("UP", applicationName, "0.0.1-SNAPSHOT");
        return ResponseEntity.ok(response);
    }
}
