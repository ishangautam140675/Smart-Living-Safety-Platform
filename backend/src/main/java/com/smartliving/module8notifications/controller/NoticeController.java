package com.smartliving.module8notifications.controller;

import com.smartliving.module8notifications.dto.CreateNoticeRequest;
import com.smartliving.module8notifications.dto.NoticeResponse;
import com.smartliving.module8notifications.model.NoticeCategory;
import com.smartliving.module8notifications.service.NoticeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;

    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<NoticeResponse> publishNotice(
            @Valid @RequestBody CreateNoticeRequest request,
            Authentication authentication) {
        NoticeResponse response = noticeService.publishNotice(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<NoticeResponse>> getNotices(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) NoticeCategory category) {
        List<NoticeResponse> notices = noticeService.getNotices(keyword, category);
        return ResponseEntity.ok(notices);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoticeResponse> getNoticeById(@PathVariable Long id) {
        NoticeResponse notice = noticeService.getNoticeById(id);
        return ResponseEntity.ok(notice);
    }

    @PutMapping("/{id}/pin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NoticeResponse> togglePin(@PathVariable Long id) {
        NoticeResponse notice = noticeService.togglePin(id);
        return ResponseEntity.ok(notice);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.noContent().build();
    }
}
