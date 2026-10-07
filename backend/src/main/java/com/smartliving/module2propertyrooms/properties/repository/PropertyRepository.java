package com.smartliving.module2propertyrooms.properties.repository;

import com.smartliving.module2propertyrooms.properties.model.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {
    Optional<Property> findByName(String name);
    boolean existsByName(String name);
}
