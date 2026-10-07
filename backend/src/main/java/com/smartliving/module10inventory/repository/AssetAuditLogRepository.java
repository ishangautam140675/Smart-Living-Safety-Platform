package com.smartliving.module10inventory.repository;

import com.smartliving.module10inventory.model.AssetAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetAuditLogRepository extends JpaRepository<AssetAuditLog, Long> {

    List<AssetAuditLog> findByAssetItemIdOrderByAuditedAtDesc(Long assetItemId);
}
