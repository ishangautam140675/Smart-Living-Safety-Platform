package com.smartliving.module7emergency.service;

import com.smartliving.common.exception.AppException;
import com.smartliving.common.exception.ResourceNotFoundException;
import com.smartliving.module3residents.model.Resident;
import com.smartliving.module3residents.repository.ResidentRepository;
import com.smartliving.module7emergency.dto.*;
import com.smartliving.module7emergency.model.EmergencyAlert;
import com.smartliving.module7emergency.model.EmergencySeverity;
import com.smartliving.module7emergency.model.EmergencyStatus;
import com.smartliving.module7emergency.repository.EmergencyAlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmergencyService {

    private static final Logger log = LoggerFactory.getLogger(EmergencyService.class);

    private final EmergencyAlertRepository emergencyAlertRepository;
    private final ResidentRepository residentRepository;

    public EmergencyService(EmergencyAlertRepository emergencyAlertRepository,
                            ResidentRepository residentRepository) {
        this.emergencyAlertRepository = emergencyAlertRepository;
        this.residentRepository = residentRepository;
    }

    public EmergencyAlertResponse triggerSos(TriggerSosRequest request, String callerEmail) {
        Resident resident = residentRepository.findByUserEmail(callerEmail).orElse(null);

        String alertCode = "SOS-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

        String location = request.getLocationDetails();
        if ((location == null || location.isBlank()) && resident != null && resident.getBed() != null) {
            String room = resident.getBed().getRoom() != null ? resident.getBed().getRoom().getRoomNumber() : "Unknown";
            String building = (resident.getBed().getRoom() != null &&
                    resident.getBed().getRoom().getFloor() != null &&
                    resident.getBed().getRoom().getFloor().getBuilding() != null)
                    ? resident.getBed().getRoom().getFloor().getBuilding().getName()
                    : "Campus";
            location = "Room " + room + ", " + building + " (Allocated Bed: " + resident.getBed().getBedNumber() + ")";
        } else if (location == null || location.isBlank()) {
            location = "Campus Premises (Location Unspecified)";
        }

        EmergencyAlert alert = new EmergencyAlert();
        alert.setAlertCode(alertCode);
        alert.setType(request.getType());
        alert.setSeverity(request.getSeverity() != null ? request.getSeverity() : EmergencySeverity.CRITICAL);
        alert.setStatus(EmergencyStatus.ACTIVE);
        alert.setResident(resident);
        alert.setLocationDetails(location);
        alert.setDescription(request.getDescription());

        EmergencyAlert saved = emergencyAlertRepository.save(alert);
        log.warn("🚨 CRITICAL SOS TRIGGERED! [{}] Type: {}, Location: '{}', Triggered by: {}",
                saved.getAlertCode(), saved.getType(), saved.getLocationDetails(), callerEmail);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<EmergencyAlertResponse> getMyAlerts(String residentEmail) {
        Resident resident = residentRepository.findByUserEmail(residentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Resident profile not found for email: " + residentEmail));
        return emergencyAlertRepository.findByResidentIdOrderByCreatedAtDesc(resident.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmergencyAlertResponse> searchAlerts(String keyword, EmergencyStatus status, EmergencySeverity severity) {
        String kw = (keyword == null) ? "" : keyword.trim();
        return emergencyAlertRepository.searchAlerts(kw, status, severity)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmergencyAlertResponse getAlertByCode(String alertCode) {
        EmergencyAlert alert = emergencyAlertRepository.findByAlertCode(alertCode.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Emergency alert not found with code: " + alertCode));
        return toResponse(alert);
    }

    public EmergencyAlertResponse acknowledgeAlert(String alertCode, String staffEmail) {
        EmergencyAlert alert = emergencyAlertRepository.findByAlertCode(alertCode.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Emergency alert not found with code: " + alertCode));

        if (alert.getStatus() != EmergencyStatus.ACTIVE) {
            throw new AppException("Alert is already " + alert.getStatus() + " and cannot be acknowledged.");
        }

        alert.setStatus(EmergencyStatus.ACKNOWLEDGED);
        alert.setAcknowledgedBy(staffEmail);
        alert.setAcknowledgedAt(LocalDateTime.now());

        EmergencyAlert saved = emergencyAlertRepository.save(alert);
        log.info("SOS Alert [{}] acknowledged by security/staff: {}", saved.getAlertCode(), staffEmail);
        return toResponse(saved);
    }

    public EmergencyAlertResponse resolveAlert(String alertCode, UpdateAlertStatusRequest request, String staffEmail) {
        EmergencyAlert alert = emergencyAlertRepository.findByAlertCode(alertCode.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Emergency alert not found with code: " + alertCode));

        if (alert.getStatus() == EmergencyStatus.RESOLVED || alert.getStatus() == EmergencyStatus.FALSE_ALARM) {
            throw new AppException("Alert has already been closed with status " + alert.getStatus());
        }

        EmergencyStatus targetStatus = request.getStatus();
        if (targetStatus != EmergencyStatus.RESOLVED && targetStatus != EmergencyStatus.FALSE_ALARM) {
            throw new AppException("Resolution target status must be RESOLVED or FALSE_ALARM.");
        }

        alert.setStatus(targetStatus);
        alert.setResolvedBy(staffEmail);
        alert.setResolvedAt(LocalDateTime.now());
        alert.setResolutionNotes(request.getNotes());

        EmergencyAlert saved = emergencyAlertRepository.save(alert);
        log.info("SOS Alert [{}] resolved with status {} by staff: {}",
                saved.getAlertCode(), saved.getStatus(), staffEmail);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public EmergencySummaryResponse getSummary() {
        long total = emergencyAlertRepository.count();
        long active = emergencyAlertRepository.countByStatus(EmergencyStatus.ACTIVE);
        long critical = emergencyAlertRepository.countBySeverity(EmergencySeverity.CRITICAL);
        long acknowledged = emergencyAlertRepository.countByStatus(EmergencyStatus.ACKNOWLEDGED);
        long resolved = emergencyAlertRepository.countByStatus(EmergencyStatus.RESOLVED);

        return new EmergencySummaryResponse(total, active, critical, acknowledged, resolved);
    }

    private EmergencyAlertResponse toResponse(EmergencyAlert alert) {
        EmergencyAlertResponse resp = new EmergencyAlertResponse();
        resp.setId(alert.getId());
        resp.setAlertCode(alert.getAlertCode());
        resp.setType(alert.getType());
        resp.setSeverity(alert.getSeverity());
        resp.setStatus(alert.getStatus());
        resp.setLocationDetails(alert.getLocationDetails());
        resp.setDescription(alert.getDescription());
        resp.setAcknowledgedBy(alert.getAcknowledgedBy());
        resp.setAcknowledgedAt(alert.getAcknowledgedAt());
        resp.setResolvedBy(alert.getResolvedBy());
        resp.setResolvedAt(alert.getResolvedAt());
        resp.setResolutionNotes(alert.getResolutionNotes());
        resp.setCreatedAt(alert.getCreatedAt());
        resp.setUpdatedAt(alert.getUpdatedAt());

        if (alert.getResident() != null) {
            Resident resident = alert.getResident();
            resp.setResidentId(resident.getId());
            if (resident.getUser() != null) {
                resp.setResidentName(resident.getUser().getFullName());
                resp.setResidentPhone(resident.getUser().getPhone());
            }
            if (resident.getBed() != null && resident.getBed().getRoom() != null) {
                resp.setRoomNumber(resident.getBed().getRoom().getRoomNumber());
                if (resident.getBed().getRoom().getFloor() != null &&
                        resident.getBed().getRoom().getFloor().getBuilding() != null) {
                    resp.setBuildingName(resident.getBed().getRoom().getFloor().getBuilding().getName());
                }
            }
        }

        return resp;
    }
}
