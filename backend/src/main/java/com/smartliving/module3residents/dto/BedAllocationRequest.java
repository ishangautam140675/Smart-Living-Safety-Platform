package com.smartliving.module3residents.dto;

import jakarta.validation.constraints.NotNull;

public class BedAllocationRequest {

    @NotNull(message = "Bed ID is required")
    private Long bedId;

    public BedAllocationRequest() {
    }

    public BedAllocationRequest(Long bedId) {
        this.bedId = bedId;
    }

    public Long getBedId() {
        return bedId;
    }

    public void setBedId(Long bedId) {
        this.bedId = bedId;
    }
}
