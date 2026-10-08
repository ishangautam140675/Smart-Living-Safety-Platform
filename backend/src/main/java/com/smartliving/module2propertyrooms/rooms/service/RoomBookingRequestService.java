package com.smartliving.module2propertyrooms.rooms.service;

import com.smartliving.common.exception.AppException;
import com.smartliving.common.exception.ResourceNotFoundException;
import com.smartliving.module1authentication.users.repository.UserRepository;
import com.smartliving.module1authentication.users.model.User;
import com.smartliving.module2propertyrooms.rooms.dto.*;
import com.smartliving.module2propertyrooms.rooms.model.*;
import com.smartliving.module2propertyrooms.rooms.repository.*;
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

    public RoomBookingRequestService(RoomBookingRequestRepository bookingRepo,
                                     RoomRepository roomRepo,
                                     BedRepository bedRepo,
                                     UserRepository userRepo) {
        this.bookingRepo = bookingRepo;
        this.roomRepo = roomRepo;
        this.bedRepo = bedRepo;
        this.userRepo = userRepo;
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
            throw new AppException("You already have a pending booking request");
        }

        RoomBookingRequest rbr = new RoomBookingRequest();
        rbr.setUserId(userId);
        rbr.setRoomId(req.getRoomId());
        rbr.setBedId(req.getBedId());
        rbr.setRequestNote(req.getRequestNote());
        
        return toDto(bookingRepo.save(rbr));
    }

    public List<RoomBookingRequestDto> getAllRequests() {
        return bookingRepo.findAllByOrderByRequestedAtDesc().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<RoomBookingRequestDto> getPendingRequests() {
        return bookingRepo.findByStatusOrderByRequestedAtDesc(BookingRequestStatus.PENDING).stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<RoomBookingRequestDto> getMyRequests(Long userId) {
        return bookingRepo.findByUserIdOrderByRequestedAtDesc(userId).stream().map(this::toDto).collect(Collectors.toList());
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

        rbr.setStatus(BookingRequestStatus.APPROVED);
        rbr.setAdminNote(resp.getAdminNote());
        rbr.setRespondedAt(LocalDateTime.now());

        bed.setStatus(BedStatus.OCCUPIED);
        bedRepo.save(bed);

        Room room = roomRepo.findById(rbr.getRoomId()).orElse(null);
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
        rbr.setAdminNote(resp.getAdminNote());
        rbr.setRespondedAt(LocalDateTime.now());

        return toDto(bookingRepo.save(rbr));
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
        dto.setRequestedAt(r.getRequestedAt().toString());
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
