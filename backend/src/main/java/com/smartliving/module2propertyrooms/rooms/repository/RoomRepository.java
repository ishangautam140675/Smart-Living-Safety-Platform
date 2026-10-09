package com.smartliving.module2propertyrooms.rooms.repository;

import com.smartliving.module2propertyrooms.rooms.model.Room;
import com.smartliving.module2propertyrooms.rooms.model.RoomStatus;
import com.smartliving.module2propertyrooms.rooms.model.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByFloorId(Long floorId);

    List<Room> findByFloorBuildingId(Long buildingId);

    List<Room> findByFloorBuildingPropertyId(Long propertyId);

    List<Room> findByStatus(RoomStatus status);

    boolean existsByFloorIdAndRoomNumber(Long floorId, String roomNumber);

    long countByStatus(RoomStatus status);

    @Query("SELECT DISTINCT r FROM Room r " +
           "LEFT JOIN FETCH r.floor f " +
           "LEFT JOIN FETCH f.building b " +
           "LEFT JOIN FETCH b.property p " +
           "LEFT JOIN FETCH r.beds bd " +
           "WHERE (:floorId IS NULL OR f.id = :floorId) AND " +
           "(:buildingId IS NULL OR b.id = :buildingId) AND " +
           "(:propertyId IS NULL OR p.id = :propertyId) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:roomType IS NULL OR r.roomType = :roomType)")
    List<Room> findWithFilters(@Param("floorId") Long floorId,
                               @Param("buildingId") Long buildingId,
                               @Param("propertyId") Long propertyId,
                               @Param("status") RoomStatus status,
                               @Param("roomType") RoomType roomType);
}
