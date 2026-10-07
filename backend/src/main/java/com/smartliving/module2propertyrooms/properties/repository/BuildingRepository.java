package com.smartliving.module2propertyrooms.properties.repository;

import com.smartliving.module2propertyrooms.properties.model.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Long> {
    List<Building> findByPropertyId(Long propertyId);
    boolean existsByPropertyIdAndName(Long propertyId, String name);
}
