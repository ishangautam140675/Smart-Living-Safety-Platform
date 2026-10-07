package com.smartliving.module10inventory.service;

import com.smartliving.common.exception.AppException;
import com.smartliving.common.exception.ResourceNotFoundException;
import com.smartliving.module1authentication.users.model.User;
import com.smartliving.module1authentication.users.repository.UserRepository;
import com.smartliving.module2propertyrooms.rooms.model.Room;
import com.smartliving.module2propertyrooms.rooms.repository.RoomRepository;
import com.smartliving.module10inventory.dto.*;
import com.smartliving.module10inventory.model.AssetAuditLog;
import com.smartliving.module10inventory.model.AssetCategory;
import com.smartliving.module10inventory.model.AssetCondition;
import com.smartliving.module10inventory.model.AssetItem;
import com.smartliving.module10inventory.repository.AssetAuditLogRepository;
import com.smartliving.module10inventory.repository.AssetItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final AssetItemRepository assetRepository;
    private final AssetAuditLogRepository auditLogRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public InventoryService(AssetItemRepository assetRepository,
                            AssetAuditLogRepository auditLogRepository,
                            RoomRepository roomRepository,
                            UserRepository userRepository) {
        this.assetRepository = assetRepository;
        this.auditLogRepository = auditLogRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    public AssetResponse createAsset(CreateAssetRequest request) {
        String tag = request.getAssetTag().trim().toUpperCase();
        if (assetRepository.existsByAssetTag(tag)) {
            throw new AppException("Asset with tag '" + tag + "' already exists");
        }

        Room room = null;
        if (request.getRoomId() != null) {
            room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + request.getRoomId()));
        }

        AssetItem asset = new AssetItem(
                tag,
                request.getName().trim(),
                request.getCategory(),
                request.getCondition() != null ? request.getCondition() : AssetCondition.FUNCTIONAL,
                room,
                request.getPurchaseDate(),
                request.getWarrantyExpiry(),
                request.getCost(),
                request.getNotes()
        );

        AssetItem saved = assetRepository.save(asset);
        log.info("Registered new asset [{}] - '{}' in room {}",
                saved.getAssetTag(), saved.getName(), room != null ? room.getRoomNumber() : "Unassigned");

        return toResponse(saved);
    }

    public AssetResponse updateAsset(Long id, CreateAssetRequest request) {
        AssetItem asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + id));

        String newTag = request.getAssetTag().trim().toUpperCase();
        if (!asset.getAssetTag().equalsIgnoreCase(newTag) && assetRepository.existsByAssetTag(newTag)) {
            throw new AppException("Asset with tag '" + newTag + "' already exists");
        }

        Room room = null;
        if (request.getRoomId() != null) {
            room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + request.getRoomId()));
        }

        asset.setAssetTag(newTag);
        asset.setName(request.getName().trim());
        asset.setCategory(request.getCategory());
        asset.setRoom(room);
        asset.setPurchaseDate(request.getPurchaseDate());
        asset.setWarrantyExpiry(request.getWarrantyExpiry());
        asset.setCost(request.getCost());
        asset.setNotes(request.getNotes());

        AssetItem saved = assetRepository.save(asset);
        log.info("Updated asset [{}]: {}", saved.getAssetTag(), saved.getName());

        return toResponse(saved);
    }

    public AssetResponse auditAssetCondition(Long id, AuditAssetRequest request, String staffEmail) {
        AssetItem asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + id));

        AssetCondition previous = asset.getCondition();
        AssetCondition updated = request.getNewCondition();

        User staff = userRepository.findByEmail(staffEmail).orElse(null);
        String staffName = staff != null ? staff.getFullName() : "Inventory Inspector";

        asset.setCondition(updated);
        AssetItem saved = assetRepository.save(asset);

        AssetAuditLog logEntry = new AssetAuditLog(
                saved,
                previous,
                updated,
                staffEmail,
                staffName,
                request.getRemarks()
        );
        auditLogRepository.save(logEntry);

        log.info("Audited asset [{}] condition transitioned: {} -> {} by {}",
                saved.getAssetTag(), previous, updated, staffEmail);

        return toResponse(saved);
    }

    public void deleteAsset(Long id) {
        AssetItem asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + id));
        // Delete audit logs first
        auditLogRepository.deleteAll(auditLogRepository.findByAssetItemIdOrderByAuditedAtDesc(id));
        assetRepository.delete(asset);
        log.info("Permanently deleted asset [{}] - '{}'", asset.getAssetTag(), asset.getName());
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> searchAssets(String keyword, AssetCategory category, AssetCondition condition, Long roomId) {
        String kw = (keyword == null) ? "" : keyword.trim();
        return assetRepository.searchAssets(kw, category, condition, roomId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> getRoomAssets(Long roomId) {
        return assetRepository.findByRoomIdOrderByAssetTagAsc(roomId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssetAuditLogResponse> getAssetAuditHistory(Long assetId) {
        if (!assetRepository.existsById(assetId)) {
            throw new ResourceNotFoundException("Asset not found with id: " + assetId);
        }

        return auditLogRepository.findByAssetItemIdOrderByAuditedAtDesc(assetId)
                .stream()
                .map(logEntry -> new AssetAuditLogResponse(
                        logEntry.getId(),
                        logEntry.getAssetItem().getId(),
                        logEntry.getAssetItem().getAssetTag(),
                        logEntry.getAssetItem().getName(),
                        logEntry.getPreviousCondition(),
                        logEntry.getNewCondition(),
                        logEntry.getAuditedBy(),
                        logEntry.getAuditedByName(),
                        logEntry.getRemarks(),
                        logEntry.getAuditedAt()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InventorySummaryResponse getInventorySummary() {
        long total = assetRepository.count();
        long functional = assetRepository.countByCondition(AssetCondition.FUNCTIONAL);
        long underRepair = assetRepository.countByCondition(AssetCondition.UNDER_REPAIR);
        long damaged = assetRepository.countByCondition(AssetCondition.DAMAGED);
        BigDecimal totalCost = assetRepository.sumTotalAssetCost();

        return new InventorySummaryResponse(
                total,
                functional,
                underRepair,
                damaged,
                totalCost != null ? totalCost : BigDecimal.ZERO
        );
    }

    private AssetResponse toResponse(AssetItem asset) {
        AssetResponse resp = new AssetResponse();
        resp.setId(asset.getId());
        resp.setAssetTag(asset.getAssetTag());
        resp.setName(asset.getName());
        resp.setCategory(asset.getCategory());
        resp.setCondition(asset.getCondition());
        resp.setPurchaseDate(asset.getPurchaseDate());
        resp.setWarrantyExpiry(asset.getWarrantyExpiry());
        resp.setCost(asset.getCost());
        resp.setNotes(asset.getNotes());
        resp.setCreatedAt(asset.getCreatedAt());
        resp.setUpdatedAt(asset.getUpdatedAt());

        if (asset.getRoom() != null) {
            resp.setRoomId(asset.getRoom().getId());
            resp.setRoomNumber(asset.getRoom().getRoomNumber());
            if (asset.getRoom().getFloor() != null && asset.getRoom().getFloor().getBuilding() != null) {
                resp.setBuildingName(asset.getRoom().getFloor().getBuilding().getName());
            }
        }

        return resp;
    }
}
