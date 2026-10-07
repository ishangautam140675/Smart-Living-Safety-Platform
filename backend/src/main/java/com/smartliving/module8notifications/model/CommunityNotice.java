package com.smartliving.module8notifications.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "community_notices")
public class CommunityNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "content", nullable = false, length = 2000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private NoticeCategory category = NoticeCategory.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 30)
    private NoticePriority priority = NoticePriority.NORMAL;

    @Column(name = "target_audience", length = 50)
    private String targetAudience = "ALL"; // e.g., "ALL", "RESIDENTS", "STAFF"

    @Column(name = "pinned", nullable = false)
    private boolean pinned = false;

    @Column(name = "expires_at")
    private LocalDate expiresAt;

    @Column(name = "published_by", nullable = false, length = 120)
    private String publishedBy;

    @Column(name = "published_by_name", length = 120)
    private String publishedByName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.category == null) this.category = NoticeCategory.GENERAL;
        if (this.priority == null) this.priority = NoticePriority.NORMAL;
        if (this.targetAudience == null) this.targetAudience = "ALL";
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public CommunityNotice() {}

    public CommunityNotice(String title, String content, NoticeCategory category,
                           NoticePriority priority, boolean pinned, String publishedBy, String publishedByName) {
        this.title = title;
        this.content = content;
        this.category = category;
        this.priority = priority;
        this.pinned = pinned;
        this.publishedBy = publishedBy;
        this.publishedByName = publishedByName;
    }

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
