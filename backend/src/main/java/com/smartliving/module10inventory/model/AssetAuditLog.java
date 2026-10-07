package com.smartliving.module10inventory.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "asset_audit_logs")
public class AssetAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_item_id", nullable = false)
    private AssetItem assetItem;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_condition", nullable = false, length = 30)
    private AssetCondition previousCondition;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_condition", nullable = false, length = 30)
    private AssetCondition newCondition;

    @Column(name = "audited_by", nullable = false, length = 120)
    private String auditedBy;

    @Column(name = "audited_by_name", length = 120)
    private String auditedByName;

    @Column(length = 255)
    private String remarks;

    @Column(name = "audited_at", nullable = false, updatable = false)
    private LocalDateTime auditedAt = LocalDateTime.now();

    public AssetAuditLog() {
    }

    public AssetAuditLog(AssetItem assetItem, AssetCondition previousCondition, AssetCondition newCondition, String auditedBy, String auditedByName, String remarks) {
        this.assetItem = assetItem;
        this.previousCondition = previousCondition;
        this.newCondition = newCondition;
        this.auditedBy = auditedBy;
        this.auditedByName = auditedByName;
        this.remarks = remarks;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AssetItem getAssetItem() {
        return assetItem;
    }

    public void setAssetItem(AssetItem assetItem) {
        this.assetItem = assetItem;
    }

    public AssetCondition getPreviousCondition() {
        return previousCondition;
    }

    public void setPreviousCondition(AssetCondition previousCondition) {
        this.previousCondition = previousCondition;
    }

    public AssetCondition getNewCondition() {
        return newCondition;
    }

    public void setNewCondition(AssetCondition newCondition) {
        this.newCondition = newCondition;
    }

    public String getAuditedBy() {
        return auditedBy;
    }

    public void setAuditedBy(String auditedBy) {
        this.auditedBy = auditedBy;
    }

    public String getAuditedByName() {
        return auditedByName;
    }

    public void setAuditedByName(String auditedByName) {
        this.auditedByName = auditedByName;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getAuditedAt() {
        return auditedAt;
    }

    public void setAuditedAt(LocalDateTime auditedAt) {
        this.auditedAt = auditedAt;
    }
}
