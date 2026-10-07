package com.smartliving.module5visitors.service;

import com.smartliving.common.exception.AppException;
import com.smartliving.common.exception.ResourceNotFoundException;
import com.smartliving.module3residents.model.Resident;
import com.smartliving.module3residents.repository.ResidentRepository;
import com.smartliving.module5visitors.dto.*;
import com.smartliving.module5visitors.model.VisitorPass;
import com.smartliving.module5visitors.model.VisitorPassStatus;
import com.smartliving.module5visitors.repository.VisitorPassRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class VisitorService {

    private static final Logger log = LoggerFactory.getLogger(VisitorService.class);

    private final VisitorPassRepository visitorPassRepository;
    private final ResidentRepository residentRepository;

    public VisitorService(VisitorPassRepository visitorPassRepository,
                          ResidentRepository residentRepository) {
        this.visitorPassRepository = visitorPassRepository;
        this.residentRepository = residentRepository;
    }

    public VisitorPassResponse createPass(VisitorPassRequest request, String currentUserEmail) {
        Resident resident;

        if (currentUserEmail != null) {
            resident = residentRepository.findByUserEmail(currentUserEmail).orElse(null);
        } else {
            resident = null;
        }

        // If not found via email or currentUser is admin/security creating on behalf of resident
        if (resident == null) {
            if (request.getResidentId() == null) {
                throw new AppException("Resident profile not found for user: " + currentUserEmail +
                        ". Please specify residentId.");
            }
            resident = residentRepository.findById(request.getResidentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resident not found with id: " + request.getResidentId()));
        }

        String passCode = generatePassCode();

        VisitorPass pass = new VisitorPass();
        pass.setPassCode(passCode);
        pass.setVisitorName(request.getVisitorName().trim());
        pass.setVisitorPhone(request.getVisitorPhone().trim());
        pass.setPurpose(request.getPurpose().trim());
        pass.setResident(resident);
        pass.setExpectedDate(request.getExpectedDate());
        pass.setExpectedTime(request.getExpectedTime());
        pass.setStatus(VisitorPassStatus.APPROVED);
        pass.setVehicleNumber(request.getVehicleNumber());
        pass.setIdProofType(request.getIdProofType());
        pass.setIdProofNumber(request.getIdProofNumber());
        pass.setHostNotes(request.getHostNotes());

        VisitorPass saved = visitorPassRepository.save(pass);
        log.info("Created visitor pass [{}] for visitor '{}' hosting by resident '{}'",
                saved.getPassCode(), saved.getVisitorName(), resident.getUser().getFullName());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<VisitorPassResponse> getMyPasses(String residentEmail) {
        Resident resident = residentRepository.findByUserEmail(residentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Resident profile not found for email: " + residentEmail));
        return visitorPassRepository.findByResidentIdOrderByCreatedAtDesc(resident.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VisitorPassResponse> searchPasses(String keyword, VisitorPassStatus status) {
        String kw = (keyword == null) ? "" : keyword.trim();
        return visitorPassRepository.searchVisitorPasses(kw, status)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VisitorPassResponse getPassByCode(String passCode) {
        VisitorPass pass = visitorPassRepository.findByPassCode(passCode.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Visitor pass not found with code: " + passCode));
        return toResponse(pass);
    }

    public VisitorPassResponse checkIn(String passCode, VisitorCheckInRequest request, String securityEmail) {
        VisitorPass pass = visitorPassRepository.findByPassCode(passCode.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Visitor pass not found with code: " + passCode));

        if (pass.getStatus() == VisitorPassStatus.CHECKED_IN) {
            throw new AppException("Visitor with pass code " + passCode + " is already checked in.");
        }
        if (pass.getStatus() == VisitorPassStatus.CHECKED_OUT) {
            throw new AppException("Visitor pass " + passCode + " has already been used and checked out.");
        }
        if (pass.getStatus() == VisitorPassStatus.REJECTED || pass.getStatus() == VisitorPassStatus.EXPIRED) {
            throw new AppException("Cannot check in: pass status is " + pass.getStatus());
        }

        pass.setStatus(VisitorPassStatus.CHECKED_IN);
        pass.setCheckInTime(LocalDateTime.now());

        if (request != null) {
            if (request.getVehicleNumber() != null && !request.getVehicleNumber().isBlank()) {
                pass.setVehicleNumber(request.getVehicleNumber().trim());
            }
            if (request.getIdProofType() != null && !request.getIdProofType().isBlank()) {
                pass.setIdProofType(request.getIdProofType().trim());
            }
            if (request.getIdProofNumber() != null && !request.getIdProofNumber().isBlank()) {
                pass.setIdProofNumber(request.getIdProofNumber().trim());
            }
            if (request.getSecurityNotes() != null && !request.getSecurityNotes().isBlank()) {
                pass.setSecurityNotes(request.getSecurityNotes().trim());
            }
        }

        VisitorPass saved = visitorPassRepository.save(pass);
        log.info("Visitor pass [{}] checked in at {} by staff/security: {}",
                saved.getPassCode(), saved.getCheckInTime(), securityEmail);
        return toResponse(saved);
    }

    public VisitorPassResponse checkOut(String passCode, VisitorCheckOutRequest request, String securityEmail) {
        VisitorPass pass = visitorPassRepository.findByPassCode(passCode.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Visitor pass not found with code: " + passCode));

        if (pass.getStatus() != VisitorPassStatus.CHECKED_IN) {
            throw new AppException("Cannot check out visitor: current status is " + pass.getStatus() +
                    " (must be CHECKED_IN).");
        }

        pass.setStatus(VisitorPassStatus.CHECKED_OUT);
        pass.setCheckOutTime(LocalDateTime.now());

        if (request != null && request.getSecurityNotes() != null && !request.getSecurityNotes().isBlank()) {
            String existingNotes = pass.getSecurityNotes();
            String newNote = request.getSecurityNotes().trim();
            pass.setSecurityNotes(existingNotes != null ? existingNotes + " | Out: " + newNote : newNote);
        }

        VisitorPass saved = visitorPassRepository.save(pass);
        log.info("Visitor pass [{}] checked out at {} by staff/security: {}",
                saved.getPassCode(), saved.getCheckOutTime(), securityEmail);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public VisitorSummaryResponse getSummary() {
        long total = visitorPassRepository.count();
        long active = visitorPassRepository.countByStatus(VisitorPassStatus.CHECKED_IN);
        long checkedOut = visitorPassRepository.countByStatus(VisitorPassStatus.CHECKED_OUT);
        long pending = visitorPassRepository.countByStatus(VisitorPassStatus.PENDING_APPROVAL);
        long expectedToday = visitorPassRepository.countExpectedOnDate(LocalDate.now());

        return new VisitorSummaryResponse(total, active, expectedToday, checkedOut, pending);
    }

    private String generatePassCode() {
        return "VP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    private VisitorPassResponse toResponse(VisitorPass pass) {
        VisitorPassResponse resp = new VisitorPassResponse();
        resp.setId(pass.getId());
        resp.setPassCode(pass.getPassCode());
        resp.setVisitorName(pass.getVisitorName());
        resp.setVisitorPhone(pass.getVisitorPhone());
        resp.setPurpose(pass.getPurpose());
        resp.setExpectedDate(pass.getExpectedDate());
        resp.setExpectedTime(pass.getExpectedTime());
        resp.setStatus(pass.getStatus());
        resp.setCheckInTime(pass.getCheckInTime());
        resp.setCheckOutTime(pass.getCheckOutTime());
        resp.setVehicleNumber(pass.getVehicleNumber());
        resp.setIdProofType(pass.getIdProofType());
        resp.setIdProofNumber(pass.getIdProofNumber());
        resp.setHostNotes(pass.getHostNotes());
        resp.setSecurityNotes(pass.getSecurityNotes());
        resp.setCreatedAt(pass.getCreatedAt());
        resp.setUpdatedAt(pass.getUpdatedAt());

        if (pass.getResident() != null) {
            Resident resident = pass.getResident();
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
