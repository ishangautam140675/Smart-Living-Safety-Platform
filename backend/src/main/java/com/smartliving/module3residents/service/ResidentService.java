package com.smartliving.module3residents.service;

import com.smartliving.common.exception.AppException;
import com.smartliving.common.exception.ResourceNotFoundException;
import com.smartliving.module3residents.dto.BedAllocationRequest;
import com.smartliving.module3residents.dto.ResidentOnboardingRequest;
import com.smartliving.module3residents.dto.ResidentProfileUpdateRequest;
import com.smartliving.module3residents.dto.ResidentResponse;
import com.smartliving.module3residents.dto.ResidentSummaryResponse;
import com.smartliving.module3residents.model.Resident;
import com.smartliving.module3residents.model.ResidentStatus;
import com.smartliving.module3residents.repository.ResidentRepository;
import com.smartliving.module2propertyrooms.rooms.model.Bed;
import com.smartliving.module2propertyrooms.rooms.model.BedStatus;
import com.smartliving.module2propertyrooms.rooms.model.Room;
import com.smartliving.module2propertyrooms.rooms.model.RoomStatus;
import com.smartliving.module2propertyrooms.rooms.repository.BedRepository;
import com.smartliving.module2propertyrooms.rooms.repository.RoomRepository;
import com.smartliving.module1authentication.users.model.Role;
import com.smartliving.module1authentication.users.model.RoleType;
import com.smartliving.module1authentication.users.model.User;
import com.smartliving.module1authentication.users.repository.RoleRepository;
import com.smartliving.module1authentication.users.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ResidentService {

    private final ResidentRepository residentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BedRepository bedRepository;
    private final RoomRepository roomRepository;
    private final PasswordEncoder passwordEncoder;

    public ResidentService(ResidentRepository residentRepository,
                           UserRepository userRepository,
                           RoleRepository roleRepository,
                           BedRepository bedRepository,
                           RoomRepository roomRepository,
                           PasswordEncoder passwordEncoder) {
        this.residentRepository = residentRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.bedRepository = bedRepository;
        this.roomRepository = roomRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public ResidentResponse onboardResident(ResidentOnboardingRequest request) {
        // Resolve or create User
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user == null) {
            String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                    ? request.getPassword()
                    : "Resident@12345";

            user = new User(
                    request.getFullName(),
                    request.getEmail(),
                    passwordEncoder.encode(rawPassword),
                    request.getPhone()
            );

            Role residentRole = roleRepository.findByName(RoleType.ROLE_RESIDENT)
                    .orElseGet(() -> roleRepository.save(new Role(RoleType.ROLE_RESIDENT)));
            user.setRoles(Collections.singleton(residentRole));
            user = userRepository.save(user);
        } else {
            if (residentRepository.existsByUserId(user.getId())) {
                throw new AppException("Resident profile already exists for email: " + request.getEmail());
            }
        }

        // Generate admission number if not provided
        String admissionNumber = request.getAdmissionNumber();
        if (admissionNumber == null || admissionNumber.isBlank()) {
            admissionNumber = "RES-" + (System.currentTimeMillis() % 1000000);
        } else if (residentRepository.existsByAdmissionNumber(admissionNumber)) {
            throw new AppException("Admission number already in use: " + admissionNumber);
        }

        // Handle bed allocation if requested
        Bed bed = null;
        if (request.getBedId() != null) {
            bed = bedRepository.findById(request.getBedId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bed", "id", request.getBedId()));
            if (bed.getStatus() != BedStatus.AVAILABLE) {
                throw new AppException("Selected bed (" + bed.getBedNumber() + ") is not available (Status: " + bed.getStatus() + ")");
            }
        }

        Resident resident = new Resident(
                user,
                bed,
                admissionNumber,
                request.getIdProofType(),
                request.getIdProofNumber(),
                request.getEmergencyContactName(),
                request.getEmergencyContactRelation(),
                request.getEmergencyContactPhone(),
                request.getCheckInDate() != null ? request.getCheckInDate() : LocalDate.now(),
                request.getMonthlyRent(),
                request.getDepositAmount(),
                request.getPermanentAddress(),
                request.getNotes()
        );

        Resident saved = residentRepository.save(resident);

        if (bed != null) {
            bed.setStatus(BedStatus.OCCUPIED);
            bed.setCurrentResidentId(saved.getId());
            bedRepository.save(bed);
            recalculateRoomStatus(bed.getRoom().getId());
        }

        return ResidentResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ResidentResponse> getResidents(String search, ResidentStatus status) {
        String keyword = (search != null && !search.isBlank()) ? search.trim() : null;
        return residentRepository.searchResidents(keyword, status).stream()
                .map(ResidentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResidentResponse getResidentById(Long id) {
        Resident resident = residentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resident", "id", id));
        return ResidentResponse.fromEntity(resident);
    }

    @Transactional(readOnly = true)
    public ResidentResponse getResidentByEmail(String email) {
        Resident resident = residentRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Resident profile", "email", email));
        return ResidentResponse.fromEntity(resident);
    }

    public ResidentResponse updateProfileByEmail(String email, ResidentProfileUpdateRequest request) {
        Resident resident = residentRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Resident profile", "email", email));

        if (resident.getUser() != null) {
            if (request.getFullName() != null && !request.getFullName().isBlank()) {
                resident.getUser().setFullName(request.getFullName());
            }
            if (request.getPhone() != null && !request.getPhone().isBlank()) {
                resident.getUser().setPhone(request.getPhone());
            }
            userRepository.save(resident.getUser());
        }

        if (request.getEmergencyContactName() != null) {
            resident.setEmergencyContactName(request.getEmergencyContactName());
        }
        if (request.getEmergencyContactRelation() != null) {
            resident.setEmergencyContactRelation(request.getEmergencyContactRelation());
        }
        if (request.getEmergencyContactPhone() != null) {
            resident.setEmergencyContactPhone(request.getEmergencyContactPhone());
        }
        if (request.getPermanentAddress() != null) {
            resident.setPermanentAddress(request.getPermanentAddress());
        }

        Resident updated = residentRepository.save(resident);
        return ResidentResponse.fromEntity(updated);
    }

    public ResidentResponse allocateBed(Long residentId, BedAllocationRequest request) {
        Resident resident = residentRepository.findById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident", "id", residentId));

        Bed newBed = bedRepository.findById(request.getBedId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed", "id", request.getBedId()));

        if (newBed.getStatus() != BedStatus.AVAILABLE) {
            throw new AppException("Target bed (" + newBed.getBedNumber() + ") is not available (Status: " + newBed.getStatus() + ")");
        }

        // Free previous bed if resident already had one
        Bed oldBed = resident.getBed();
        if (oldBed != null && !oldBed.getId().equals(newBed.getId())) {
            oldBed.setStatus(BedStatus.AVAILABLE);
            oldBed.setCurrentResidentId(null);
            bedRepository.save(oldBed);
            recalculateRoomStatus(oldBed.getRoom().getId());
        }

        // Allocate new bed
        newBed.setStatus(BedStatus.OCCUPIED);
        newBed.setCurrentResidentId(resident.getId());
        bedRepository.save(newBed);
        recalculateRoomStatus(newBed.getRoom().getId());

        resident.setBed(newBed);
        resident.setStatus(ResidentStatus.ACTIVE);
        Resident updated = residentRepository.save(resident);

        return ResidentResponse.fromEntity(updated);
    }

    public ResidentResponse checkoutResident(Long residentId) {
        Resident resident = residentRepository.findById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("Resident", "id", residentId));

        Bed bed = resident.getBed();
        if (bed != null) {
            bed.setStatus(BedStatus.AVAILABLE);
            bed.setCurrentResidentId(null);
            bedRepository.save(bed);
            recalculateRoomStatus(bed.getRoom().getId());
            resident.setBed(null);
        }

        resident.setStatus(ResidentStatus.CHECKED_OUT);
        resident.setCheckOutDate(LocalDate.now());

        Resident updated = residentRepository.save(resident);
        return ResidentResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public ResidentSummaryResponse getResidentSummary() {
        long total = residentRepository.count();
        long active = residentRepository.countByStatus(ResidentStatus.ACTIVE);
        long pending = residentRepository.countByStatus(ResidentStatus.PENDING_VERIFICATION);
        long checkedOut = residentRepository.countByStatus(ResidentStatus.CHECKED_OUT);
        long allocatedBeds = residentRepository.findAll().stream()
                .filter(r -> r.getBed() != null)
                .count();

        return new ResidentSummaryResponse(total, active, pending, checkedOut, allocatedBeds);
    }

    private void recalculateRoomStatus(Long roomId) {
        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) return;

        long occupied = bedRepository.findByRoomIdAndStatus(roomId, BedStatus.OCCUPIED).size();
        long maintenance = bedRepository.findByRoomIdAndStatus(roomId, BedStatus.UNDER_MAINTENANCE).size();
        long total = bedRepository.findByRoomId(roomId).size();

        room.setOccupiedBeds((int) occupied);
        if (total > 0 && maintenance == total) {
            room.setStatus(RoomStatus.UNDER_MAINTENANCE);
        } else if (occupied >= room.getCapacity()) {
            room.setStatus(RoomStatus.OCCUPIED);
        } else {
            room.setStatus(RoomStatus.AVAILABLE);
        }
        roomRepository.save(room);
    }
}
