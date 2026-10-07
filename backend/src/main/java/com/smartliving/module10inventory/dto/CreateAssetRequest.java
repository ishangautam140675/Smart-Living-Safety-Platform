package com.smartliving.module10inventory.dto;

import com.smartliving.module10inventory.model.AssetCategory;
import com.smartliving.module10inventory.model.AssetCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateAssetRequest {

    @NotBlank(message = "Asset tag is required")
    private String assetTag;

    @NotBlank(message = "Item name is required")
    private String name;

    @NotNull(message = "Category is required")
    private AssetCategory category;

    private AssetCondition condition = AssetCondition.FUNCTIONAL;

    private Long roomId;

    private LocalDate purchaseDate;

    private LocalDate warrantyExpiry;

    private BigDecimal cost;

    private String notes;

    public CreateAssetRequest() {
    }

    public CreateAssetRequest(String assetTag, String name, AssetCategory category, AssetCondition condition, Long roomId, LocalDate purchaseDate, LocalDate warrantyExpiry, BigDecimal cost, String notes) {
        this.assetTag = assetTag;
        this.name = name;
        this.category = category;
        this.condition = condition;
        this.roomId = roomId;
        this.purchaseDate = purchaseDate;
        this.warrantyExpiry = warrantyExpiry;
        this.cost = cost;
        this.notes = notes;
    }

    public String getAssetTag() {
        return assetTag;
    }

    public void setAssetTag(String assetTag) {
        this.assetTag = assetTag;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public AssetCategory getCategory() {
        return category;
    }

    public void setCategory(AssetCategory category) {
        this.category = category;
    }

    public AssetCondition getCondition() {
        return condition;
    }

    public void setCondition(AssetCondition condition) {
        this.condition = condition;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public LocalDate getWarrantyExpiry() {
        return warrantyExpiry;
    }

    public void setWarrantyExpiry(LocalDate warrantyExpiry) {
        this.warrantyExpiry = warrantyExpiry;
    }

    public BigDecimal getCost() {
        return cost;
    }

    public void setCost(BigDecimal cost) {
        this.cost = cost;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
