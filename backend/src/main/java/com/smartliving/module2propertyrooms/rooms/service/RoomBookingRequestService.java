package com.smartliving.module2propertyrooms.rooms.service;

import com.smartliving.common.exception.AppException;
import com.smartliving.common.exception.ResourceNotFoundException;
import com.smartliving.module1authentication.users.repository.UserRepository;
import com.smartliving.module1authentication.users.model.User;
import com.smartliving.module2propertyrooms.rooms.dto.*;
import com.smartliving.module2propertyrooms.rooms.model.*;
import com.smartliving.module2propertyrooms.rooms.repository.*;
import com.smartliving.module3residents.model.Resident;
import com.smartliving.module3residents.model.ResidentStatus;
import com.smartliving.module3residents.repository.ResidentRepository;
import com.smartliving.module3residents.service.ResidentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoomBookingRequestService {

    private final RoomBookingRequestRepository bookingRepo;
    private final RoomRepository roomRepo;
    private final BedRepository bedRepo;
    private final UserRepository userRepo;
    private final ResidentService residentService;
    private final ResidentRepository residentRepo;

    public RoomBookingRequestService(RoomBookingRequestRepository bookingRepo,
                                     RoomRepository roomRepo,
                                     BedRepository bedRepo,
                                     UserRepository userRepo,
                                     ResidentService residentService,
                                     ResidentRepository residentRepo) {
        this.bookingRepo = bookingRepo;
        this.roomRepo = roomRepo;
        this.bedRepo = bedRepo;
        this.userRepo = userRepo;
        this.residentService = residentService;
        this.residentRepo = residentRepo;
    }

    public RoomBookingRequestDto createRequest(Long userId, CreateRoomBookingRequest req) {
        Room room = roomRepo.findById(req.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", req.getRoomId()));
        Bed bed = bedRepo.findById(req.getBedId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed", "id", req.getBedId()));

        if (bed.getStatus() != BedStatus.AVAILABLE) {
            throw new AppException("Bed is not available");
        }

        List<RoomBookingRequest> existing = bookingRepo.findByUserIdOrderByRequestedAtDesc(userId);
        if (existing.stream().anyMatch(r -> r.getStatus() == BookingRequestStatus.PENDING)) {
            throw new AppException("You already have an active pending booking request");
        }

        RoomBookingRequest rbr = new RoomBookingRequest();
        rbr.setUserId(userId);
        rbr.setRoomId(req.getRoomId());
        rbr.setBedId(req.getBedId());
        rbr.setRequestNote(req.getRequestNote());
        
        return toDto(bookingRepo.save(rbr));
    }

    public List<RoomBookingRequestDto> getAllRequests() {
        return bookingRepo.findAllByOrderByRequestedAtDesc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<RoomBookingRequestDto> getPendingRequests() {
        return bookingRepo.findByStatusOrderByRequestedAtDesc(BookingRequestStatus.PENDING)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<RoomBookingRequestDto> getMyRequests(Long userId) {
        return bookingRepo.findByUserIdOrderByRequestedAtDesc(userId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public RoomBookingRequestDto approveRequest(Long requestId, AdminBookingResponseDto resp) {
        RoomBookingRequest rbr = bookingRepo.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("RoomBookingRequest", "id", requestId));
        if (rbr.getStatus() != BookingRequestStatus.PENDING) {
            throw new AppException("Only pending requests can be approved");
        }

        Bed bed = bedRepo.findById(rbr.getBedId()).orElseThrow(() -> new ResourceNotFoundException("Bed", "id", rbr.getBedId()));
        if (bed.getStatus() != BedStatus.AVAILABLE) {
            throw new AppException("Bed is no longer available");
        }

        User user = userRepo.findById(rbr.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", rbr.getUserId()));

        // Ensure resident profile exists and link hierarchy
        Resident resident = residentService.getOrCreateResidentForUser(user.getEmail());

        // Free resident's previous bed if different
        if (resident.getBed() != null && !resident.getBed().getId().equals(bed.getId())) {
            Bed oldBed = resident.getBed();
            oldBed.setStatus(BedStatus.AVAILABLE);
            oldBed.setCurrentResidentId(null);
            bedRepo.save(oldBed);
            if (oldBed.getRoom() != null) {
                recalculateRoomStatus(oldBed.getRoom());
            }
        }

        // Allocate target bed
        bed.setStatus(BedStatus.OCCUPIED);
        bed.setCurrentResidentId(resident.getId());
        bedRepo.save(bed);

        // Update resident entity so Resident Hierarchy shows ACTIVE with assigned Room and Bed
        resident.setBed(bed);
        resident.setStatus(ResidentStatus.ACTIVE);
        Room room = roomRepo.findById(rbr.getRoomId()).orElse(null);
        if (room != null && room.getBaseRent() != null) {
            resident.setMonthlyRent(room.getBaseRent());
        }
        residentRepo.save(resident);

        // Update booking request record
        rbr.setStatus(BookingRequestStatus.APPROVED);
        rbr.setAdminNote(resp != null ? resp.getAdminNote() : null);
        rbr.setRespondedAt(LocalDateTime.now());

        if (room != null) {
            recalculateRoomStatus(room);
        }

        return toDto(bookingRepo.save(rbr));
    }

    public RoomBookingRequestDto rejectRequest(Long requestId, AdminBookingResponseDto resp) {
        RoomBookingRequest rbr = bookingRepo.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("RoomBookingRequest", "id", requestId));
        if (rbr.getStatus() != BookingRequestStatus.PENDING) {
            throw new AppException("Only pending requests can be rejected");
        }

        rbr.setStatus(BookingRequestStatus.REJECTED);
        rbr.setAdminNote(resp != null ? resp.getAdminNote() : null);
        rbr.setRespondedAt(LocalDateTime.now());

        return toDto(bookingRepo.save(rbr));
    }

    public void deleteRequest(Long requestId, Long currentUserId, boolean isAdmin) {
        RoomBookingRequest rbr = bookingRepo.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("RoomBookingRequest", "id", requestId));

        if (!isAdmin && !rbr.getUserId().equals(currentUserId)) {
            throw new AppException("You are not authorized to delete this booking request");
        }

        // If request was APPROVED and user/admin is cancelling/deleting it, free bed and unassign resident
        if (rbr.getStatus() == BookingRequestStatus.APPROVED) {
            Bed bed = bedRepo.findById(rbr.getBedId()).orElse(null);
            if (bed != null && bed.getStatus() == BedStatus.OCCUPIED) {
                bed.setStatus(BedStatus.AVAILABLE);
                bed.setCurrentResidentId(null);
                bedRepo.save(bed);
                if (bed.getRoom() != null) {
                    recalculateRoomStatus(bed.getRoom());
                }
            }

            // Update resident
            User user = userRepo.findById(rbr.getUserId()).orElse(null);
            if (user != null) {
                residentRepo.findByUserId(user.getId()).ifPresent(res -> {
                    if (res.getBed() != null && res.getBed().getId().equals(rbr.getBedId())) {
                        res.setBed(null);
                        res.setStatus(ResidentStatus.CHECKED_OUT);
                        residentRepo.save(res);
                    }
                });
            }
        }

        bookingRepo.delete(rbr);
    }

    private void recalculateRoomStatus(Room room) {
        long occupied = bedRepo.findByRoomIdAndStatus(room.getId(), BedStatus.OCCUPIED).size();
        room.setOccupiedBeds((int) occupied);
        if (occupied >= room.getCapacity()) {
            room.setStatus(RoomStatus.OCCUPIED);
        } else {
            room.setStatus(RoomStatus.AVAILABLE);
        }
        roomRepo.save(room);
    }

    private RoomBookingRequestDto toDto(RoomBookingRequest r) {
        RoomBookingRequestDto dto = new RoomBookingRequestDto();
        dto.setId(r.getId());
        dto.setUserId(r.getUserId());
        dto.setRoomId(r.getRoomId());
        dto.setBedId(r.getBedId());
        dto.setRequestNote(r.getRequestNote());
        dto.setStatus(r.getStatus().name());
        dto.setAdminNote(r.getAdminNote());
        dto.setRequestedAt(r.getRequestedAt() != null ? r.getRequestedAt().toString() : null);
        dto.setRespondedAt(r.getRespondedAt() != null ? r.getRespondedAt().toString() : null);

        userRepo.findById(r.getUserId()).ifPresent(u -> {
            dto.setUserEmail(u.getEmail());
            dto.setUserName(u.getFullName());
        });
        roomRepo.findById(r.getRoomId()).ifPresent(room -> dto.setRoomNumber(room.getRoomNumber()));
        bedRepo.findById(r.getBedId()).ifPresent(bed -> dto.setBedNumber(bed.getBedNumber()));

        return dto;
    }
}
