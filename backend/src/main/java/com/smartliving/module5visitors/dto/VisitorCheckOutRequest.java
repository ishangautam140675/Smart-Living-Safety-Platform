package com.smartliving.module5visitors.dto;

public class VisitorCheckOutRequest {

    private String securityNotes;

    public VisitorCheckOutRequest() {}

    public VisitorCheckOutRequest(String securityNotes) {
        this.securityNotes = securityNotes;
    }

    public String getSecurityNotes() { return securityNotes; }
    public void setSecurityNotes(String securityNotes) { this.securityNotes = securityNotes; }
}
