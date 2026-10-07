package com.smartliving.module2propertyrooms.properties.service;

import com.smartliving.common.exception.AppException;
import com.smartliving.common.exception.ResourceNotFoundException;
import com.smartliving.module2propertyrooms.properties.dto.BuildingRequest;
import com.smartliving.module2propertyrooms.properties.dto.BuildingResponse;
import com.smartliving.module2propertyrooms.properties.dto.FloorRequest;
import com.smartliving.module2propertyrooms.properties.dto.FloorResponse;
import com.smartliving.module2propertyrooms.properties.dto.PropertyRequest;
import com.smartliving.module2propertyrooms.properties.dto.PropertyResponse;
import com.smartliving.module2propertyrooms.properties.model.Building;
import com.smartliving.module2propertyrooms.properties.model.Floor;
import com.smartliving.module2propertyrooms.properties.model.Property;
import com.smartliving.module2propertyrooms.properties.repository.BuildingRepository;
import com.smartliving.module2propertyrooms.properties.repository.FloorRepository;
import com.smartliving.module2propertyrooms.properties.repository.PropertyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;

    public PropertyService(PropertyRepository propertyRepository,
                           BuildingRepository buildingRepository,
                           FloorRepository floorRepository) {
        this.propertyRepository = propertyRepository;
        this.buildingRepository = buildingRepository;
        this.floorRepository = floorRepository;
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> getAllProperties() {
        return propertyRepository.findAll().stream()
                .map(PropertyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PropertyResponse getPropertyById(Long id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", id));
        return PropertyResponse.fromEntity(property);
    }

    public PropertyResponse createProperty(PropertyRequest request) {
        if (propertyRepository.existsByName(request.getName())) {
            throw new AppException("Property with name '" + request.getName() + "' already exists");
        }
        Property property = new Property(
                request.getName(),
                request.getAddress(),
                request.getCity(),
                request.getState(),
                request.getPincode(),
                request.getPropertyType(),
                request.getContactPhone(),
                request.getContactEmail(),
                request.getDescription()
        );
        Property saved = propertyRepository.save(property);
        return PropertyResponse.fromEntity(saved);
    }

    public PropertyResponse updateProperty(Long id, PropertyRequest request) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", id));

        if (!property.getName().equalsIgnoreCase(request.getName()) &&
                propertyRepository.existsByName(request.getName())) {
            throw new AppException("Another property with name '" + request.getName() + "' already exists");
        }

        property.setName(request.getName());
        property.setAddress(request.getAddress());
        property.setCity(request.getCity());
        property.setState(request.getState());
        property.setPincode(request.getPincode());
        property.setPropertyType(request.getPropertyType());
        property.setContactPhone(request.getContactPhone());
        property.setContactEmail(request.getContactEmail());
        property.setDescription(request.getDescription());

        Property updated = propertyRepository.save(property);
        return PropertyResponse.fromEntity(updated);
    }

    public void deleteProperty(Long id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", id));
        propertyRepository.delete(property);
    }

    public BuildingResponse addBuilding(Long propertyId, BuildingRequest request) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", propertyId));

        if (buildingRepository.existsByPropertyIdAndName(propertyId, request.getName())) {
            throw new AppException("Building '" + request.getName() + "' already exists in this property");
        }

        Building building = new Building(
                property,
                request.getName(),
                request.getCode(),
                request.getTotalFloors() != null ? request.getTotalFloors() : 1,
                request.getDescription()
        );
        Building saved = buildingRepository.save(building);
        return BuildingResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<BuildingResponse> getBuildingsByProperty(Long propertyId) {
        if (!propertyRepository.existsById(propertyId)) {
            throw new ResourceNotFoundException("Property", "id", propertyId);
        }
        return buildingRepository.findByPropertyId(propertyId).stream()
                .map(BuildingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public FloorResponse addFloor(Long buildingId, FloorRequest request) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Building", "id", buildingId));

        if (floorRepository.existsByBuildingIdAndFloorNumber(buildingId, request.getFloorNumber())) {
            throw new AppException("Floor number " + request.getFloorNumber() + " already exists in this building");
        }

        String floorName = request.getFloorName();
        if (floorName == null || floorName.isBlank()) {
            floorName = "Floor " + request.getFloorNumber();
        }

        Floor floor = new Floor(building, request.getFloorNumber(), floorName);
        Floor saved = floorRepository.save(floor);
        return FloorResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<FloorResponse> getFloorsByBuilding(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building", "id", buildingId);
        }
        return floorRepository.findByBuildingId(buildingId).stream()
                .map(FloorResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
