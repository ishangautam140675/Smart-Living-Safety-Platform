package com.smartliving.module10inventory.dto;

import com.smartliving.module10inventory.model.AssetCondition;
import jakarta.validation.constraints.NotNull;

public class AuditAssetRequest {

    @NotNull(message = "New condition is required")
    private AssetCondition newCondition;

    private String remarks;

    public AuditAssetRequest() {
    }

    public AuditAssetRequest(AssetCondition newCondition, String remarks) {
        this.newCondition = newCondition;
        this.remarks = remarks;
    }

    public AssetCondition getNewCondition() {
        return newCondition;
    }

    public void setNewCondition(AssetCondition newCondition) {
        this.newCondition = newCondition;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
