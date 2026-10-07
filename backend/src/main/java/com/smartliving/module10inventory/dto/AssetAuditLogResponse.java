package com.smartliving.module10inventory.dto;

import com.smartliving.module10inventory.model.AssetCondition;
import java.time.LocalDateTime;

public class AssetAuditLogResponse {

    private Long id;
    private Long assetId;
    private String assetTag;
    private String assetName;
    private AssetCondition previousCondition;
    private AssetCondition newCondition;
    private String auditedBy;
    private String auditedByName;
    private String remarks;
    private LocalDateTime auditedAt;

    public AssetAuditLogResponse() {
    }

    public AssetAuditLogResponse(Long id, Long assetId, String assetTag, String assetName, AssetCondition previousCondition, AssetCondition newCondition, String auditedBy, String auditedByName, String remarks, LocalDateTime auditedAt) {
        this.id = id;
        this.assetId = assetId;
        this.assetTag = assetTag;
        this.assetName = assetName;
        this.previousCondition = previousCondition;
        this.newCondition = newCondition;
        this.auditedBy = auditedBy;
        this.auditedByName = auditedByName;
        this.remarks = remarks;
        this.auditedAt = auditedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAssetId() {
        return assetId;
    }

    public void setAssetId(Long assetId) {
        this.assetId = assetId;
    }

    public String getAssetTag() {
        return assetTag;
    }

    public void setAssetTag(String assetTag) {
        this.assetTag = assetTag;
    }

    public String getAssetName() {
        return assetName;
    }

    public void setAssetName(String assetName) {
        this.assetName = assetName;
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
