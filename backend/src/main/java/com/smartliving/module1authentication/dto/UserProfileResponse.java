package com.smartliving.module1authentication.dto;

import java.util.List;

public class UserProfileResponse {

    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private List<String> roles;

    public UserProfileResponse() {
    }

    public UserProfileResponse(Long id, String email, String fullName, String phone, List<String> roles) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.roles = roles;
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

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
}
