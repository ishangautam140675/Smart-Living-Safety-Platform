package com.smartliving.module8notifications.dto;

import com.smartliving.module8notifications.model.NoticeCategory;
import com.smartliving.module8notifications.model.NoticePriority;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class NoticeResponse {

    private Long id;
    private String title;
    private String content;
    private NoticeCategory category;
    private NoticePriority priority;
    private String targetAudience;
    private boolean pinned;
    private LocalDate expiresAt;
    private String publishedBy;
    private String publishedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public NoticeResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public String getPublishedBy() { return publishedBy; }
    public void setPublishedBy(String publishedBy) { this.publishedBy = publishedBy; }

    public String getPublishedByName() { return publishedByName; }
    public void setPublishedByName(String publishedByName) { this.publishedByName = publishedByName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
