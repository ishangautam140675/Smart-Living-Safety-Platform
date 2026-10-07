package com.smartliving.module10inventory.repository;

import com.smartliving.module10inventory.model.AssetCategory;
import com.smartliving.module10inventory.model.AssetCondition;
import com.smartliving.module10inventory.model.AssetItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssetItemRepository extends JpaRepository<AssetItem, Long> {

    Optional<AssetItem> findByAssetTag(String assetTag);

    boolean existsByAssetTag(String assetTag);

    List<AssetItem> findByRoomIdOrderByAssetTagAsc(Long roomId);

    @Query("""
            SELECT a FROM AssetItem a
            LEFT JOIN a.room r
            LEFT JOIN r.floor f
            LEFT JOIN f.building b
            WHERE (:category IS NULL OR a.category = :category)
              AND (:condition IS NULL OR a.condition = :condition)
              AND (:roomId IS NULL OR a.room.id = :roomId)
              AND (
                   LOWER(a.assetTag) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(a.name)     LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR (r IS NOT NULL AND LOWER(r.roomNumber) LIKE LOWER(CONCAT('%', :keyword, '%')))
              )
            ORDER BY a.assetTag ASC
            """)
    List<AssetItem> searchAssets(@Param("keyword") String keyword,
                                 @Param("category") AssetCategory category,
                                 @Param("condition") AssetCondition condition,
                                 @Param("roomId") Long roomId);

    long countByCondition(AssetCondition condition);

    @Query("SELECT SUM(a.cost) FROM AssetItem a")
    BigDecimal sumTotalAssetCost();
}
