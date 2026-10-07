package com.smartliving.module10inventory.dto;

import java.math.BigDecimal;

public class InventorySummaryResponse {

    private long totalAssets;
    private long functionalAssets;
    private long underRepairAssets;
    private long damagedAssets;
    private BigDecimal totalAssetValue;

    public InventorySummaryResponse() {
    }

    public InventorySummaryResponse(long totalAssets, long functionalAssets, long underRepairAssets, long damagedAssets, BigDecimal totalAssetValue) {
        this.totalAssets = totalAssets;
        this.functionalAssets = functionalAssets;
        this.underRepairAssets = underRepairAssets;
        this.damagedAssets = damagedAssets;
        this.totalAssetValue = totalAssetValue;
    }

    public long getTotalAssets() {
        return totalAssets;
    }

    public void setTotalAssets(long totalAssets) {
        this.totalAssets = totalAssets;
    }

    public long getFunctionalAssets() {
        return functionalAssets;
    }

    public void setFunctionalAssets(long functionalAssets) {
        this.functionalAssets = functionalAssets;
    }

    public long getUnderRepairAssets() {
        return underRepairAssets;
    }

    public void setUnderRepairAssets(long underRepairAssets) {
        this.underRepairAssets = underRepairAssets;
    }

    public long getDamagedAssets() {
        return damagedAssets;
    }

    public void setDamagedAssets(long damagedAssets) {
        this.damagedAssets = damagedAssets;
    }

    public BigDecimal getTotalAssetValue() {
        return totalAssetValue;
    }

    public void setTotalAssetValue(BigDecimal totalAssetValue) {
        this.totalAssetValue = totalAssetValue;
    }
}
