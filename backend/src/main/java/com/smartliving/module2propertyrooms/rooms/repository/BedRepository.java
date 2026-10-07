package com.smartliving.module2propertyrooms.rooms.repository;

import com.smartliving.module2propertyrooms.rooms.model.Bed;
import com.smartliving.module2propertyrooms.rooms.model.BedStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {

    List<Bed> findByRoomId(Long roomId);

    List<Bed> findByRoomIdAndStatus(Long roomId, BedStatus status);

    long countByStatus(BedStatus status);

    boolean existsByRoomIdAndBedNumber(Long roomId, String bedNumber);
}
