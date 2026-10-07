package com.smartliving.module12analytics.controller;

import com.smartliving.module12analytics.dto.PlatformAnalyticsResponse;
import com.smartliving.module12analytics.service.PlatformAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class PlatformAnalyticsController {

    private final PlatformAnalyticsService service;

    public PlatformAnalyticsController(PlatformAnalyticsService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlatformAnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(service.getFullAnalytics());
    }
}
