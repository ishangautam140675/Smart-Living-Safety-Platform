package com.smartliving.module1authentication.dto;

import java.util.List;

public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private Long id;
    private String email;
    private String fullName;
    private List<String> roles;

    public AuthResponse() {
    }

    public AuthResponse(String token, Long id, String email, String fullName, List<String> roles) {
        this.token = token;
        this.tokenType = "Bearer";
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
}
