package com.smartliving.module8notifications.repository;

import com.smartliving.module8notifications.model.CommunityNotice;
import com.smartliving.module8notifications.model.NoticeCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityNoticeRepository extends JpaRepository<CommunityNotice, Long> {

    @Query("""
            SELECT n FROM CommunityNotice n
            WHERE (:category IS NULL OR n.category = :category)
              AND (
                   LOWER(n.title)   LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(n.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            ORDER BY n.pinned DESC, n.createdAt DESC
            """)
    List<CommunityNotice> searchNotices(@Param("keyword") String keyword,
                                        @Param("category") NoticeCategory category);

    List<CommunityNotice> findByPinnedTrueOrderByCreatedAtDesc();

    long countByCategory(NoticeCategory category);

    long countByPinnedTrue();
}
