package com.smartliving.module2propertyrooms.rooms.repository;

import com.smartliving.module2propertyrooms.rooms.model.BookingRequestStatus;
import com.smartliving.module2propertyrooms.rooms.model.RoomBookingRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomBookingRequestRepository extends JpaRepository<RoomBookingRequest, Long> {
    List<RoomBookingRequest> findByStatusOrderByRequestedAtDesc(BookingRequestStatus status);
    List<RoomBookingRequest> findByUserIdOrderByRequestedAtDesc(Long userId);
    List<RoomBookingRequest> findAllByOrderByRequestedAtDesc();
}
