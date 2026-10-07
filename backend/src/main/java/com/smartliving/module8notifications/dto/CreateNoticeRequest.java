package com.smartliving.module8notifications.dto;

import com.smartliving.module8notifications.model.NoticeCategory;
import com.smartliving.module8notifications.model.NoticePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class CreateNoticeRequest {

    @NotBlank(message = "Notice title is required")
    private String title;

    @NotBlank(message = "Notice content is required")
    private String content;

    @NotNull(message = "Notice category is required")
    private NoticeCategory category = NoticeCategory.GENERAL;

    private NoticePriority priority = NoticePriority.NORMAL;
    private String targetAudience = "ALL";
    private boolean pinned = false;
    private LocalDate expiresAt;

    public CreateNoticeRequest() {}

    public CreateNoticeRequest(String title, String content, NoticeCategory category,
                               NoticePriority priority, boolean pinned) {
        this.title = title;
        this.content = content;
        this.category = category;
        this.priority = priority;
        this.pinned = pinned;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public NoticeCategory getCategory() { return category; }
    public void setCategory(NoticeCategory category) { this.category = category; }

    public NoticePriority getPriority() { return priority; }
    public void setPriority(NoticePriority priority) { this.priority = priority; }

    public String getTargetAudience() { return targetAudience; }
    public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }

    public boolean isPinned() { return pinned; }
    public void setPinned(boolean pinned) { this.pinned = pinned; }

    public LocalDate getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDate expiresAt) { this.expiresAt = expiresAt; }
}
