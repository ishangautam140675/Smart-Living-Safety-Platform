package com.smartliving.module8notifications.service;

import com.smartliving.common.exception.ResourceNotFoundException;
import com.smartliving.module1authentication.users.model.User;
import com.smartliving.module1authentication.users.repository.UserRepository;
import com.smartliving.module8notifications.dto.CreateNoticeRequest;
import com.smartliving.module8notifications.dto.NoticeResponse;
import com.smartliving.module8notifications.model.CommunityNotice;
import com.smartliving.module8notifications.model.NoticeCategory;
import com.smartliving.module8notifications.repository.CommunityNoticeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NoticeService {

    private static final Logger log = LoggerFactory.getLogger(NoticeService.class);

    private final CommunityNoticeRepository noticeRepository;
    private final UserRepository userRepository;

    public NoticeService(CommunityNoticeRepository noticeRepository,
                         UserRepository userRepository) {
        this.noticeRepository = noticeRepository;
        this.userRepository = userRepository;
    }

    public NoticeResponse publishNotice(CreateNoticeRequest request, String publisherEmail) {
        User user = userRepository.findByEmail(publisherEmail).orElse(null);
        String publisherName = user != null ? user.getFullName() : "Management Office";

        CommunityNotice notice = new CommunityNotice();
        notice.setTitle(request.getTitle().trim());
        notice.setContent(request.getContent().trim());
        notice.setCategory(request.getCategory());
        notice.setPriority(request.getPriority());
        notice.setTargetAudience(request.getTargetAudience());
        notice.setPinned(request.isPinned());
        notice.setExpiresAt(request.getExpiresAt());
        notice.setPublishedBy(publisherEmail);
        notice.setPublishedByName(publisherName);

        CommunityNotice saved = noticeRepository.save(notice);
        log.info("📢 Published notice #{} '{}' in [{}] by {}",
                saved.getId(), saved.getTitle(), saved.getCategory(), publisherEmail);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<NoticeResponse> getNotices(String keyword, NoticeCategory category) {
        String kw = (keyword == null) ? "" : keyword.trim();
        return noticeRepository.searchNotices(kw, category)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NoticeResponse getNoticeById(Long id) {
        CommunityNotice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found with id: " + id));
        return toResponse(notice);
    }

    public NoticeResponse togglePin(Long id) {
        CommunityNotice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found with id: " + id));
        notice.setPinned(!notice.isPinned());
        return toResponse(noticeRepository.save(notice));
    }

    public void deleteNotice(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notice not found with id: " + id);
        }
        noticeRepository.deleteById(id);
        log.info("Deleted notice #{}", id);
    }

    private NoticeResponse toResponse(CommunityNotice notice) {
        NoticeResponse resp = new NoticeResponse();
        resp.setId(notice.getId());
        resp.setTitle(notice.getTitle());
        resp.setContent(notice.getContent());
        resp.setCategory(notice.getCategory());
        resp.setPriority(notice.getPriority());
        resp.setTargetAudience(notice.getTargetAudience());
        resp.setPinned(notice.isPinned());
        resp.setExpiresAt(notice.getExpiresAt());
        resp.setPublishedBy(notice.getPublishedBy());
        resp.setPublishedByName(notice.getPublishedByName());
        resp.setCreatedAt(notice.getCreatedAt());
        resp.setUpdatedAt(notice.getUpdatedAt());
        return resp;
    }
}
