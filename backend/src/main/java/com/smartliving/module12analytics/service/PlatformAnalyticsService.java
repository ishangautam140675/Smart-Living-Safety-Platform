package com.smartliving.module12analytics.service;

import com.smartliving.module12analytics.dto.PlatformAnalyticsResponse;
import com.smartliving.module10inventory.model.AssetCondition;
import com.smartliving.module10inventory.repository.AssetItemRepository;
import com.smartliving.module11staffroster.model.ShiftStatus;
import com.smartliving.module11staffroster.repository.PatrolLogRepository;
import com.smartliving.module11staffroster.repository.StaffShiftRepository;
import com.smartliving.module2propertyrooms.rooms.model.RoomStatus;
import com.smartliving.module2propertyrooms.rooms.repository.RoomRepository;
import com.smartliving.module3residents.model.ResidentStatus;
import com.smartliving.module3residents.repository.ResidentRepository;
import com.smartliving.module4complaints.model.ComplaintStatus;
import com.smartliving.module4complaints.repository.ComplaintRepository;
import com.smartliving.module5visitors.repository.VisitorPassRepository;
import com.smartliving.module6payments.repository.InvoiceRepository;
import com.smartliving.module7emergency.model.EmergencyStatus;
import com.smartliving.module7emergency.repository.EmergencyAlertRepository;
import com.smartliving.module8notifications.repository.CommunityNoticeRepository;
import com.smartliving.module9food.repository.MealFeedbackRepository;
import com.smartliving.module9food.repository.MealMenuRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@Transactional(readOnly = true)
public class PlatformAnalyticsService {

    private final RoomRepository roomRepo;
    private final ResidentRepository residentRepo;
    private final ComplaintRepository complaintRepo;
    private final VisitorPassRepository visitorRepo;
    private final InvoiceRepository invoiceRepo;
    private final EmergencyAlertRepository emergencyRepo;
    private final CommunityNoticeRepository noticeRepo;
    private final MealMenuRepository menuRepo;
    private final MealFeedbackRepository feedbackRepo;
    private final AssetItemRepository assetRepo;
    private final StaffShiftRepository shiftRepo;
    private final PatrolLogRepository patrolRepo;

    public PlatformAnalyticsService(
            RoomRepository roomRepo,
            ResidentRepository residentRepo,
            ComplaintRepository complaintRepo,
            VisitorPassRepository visitorRepo,
            InvoiceRepository invoiceRepo,
            EmergencyAlertRepository emergencyRepo,
            CommunityNoticeRepository noticeRepo,
            MealMenuRepository menuRepo,
            MealFeedbackRepository feedbackRepo,
            AssetItemRepository assetRepo,
            StaffShiftRepository shiftRepo,
            PatrolLogRepository patrolRepo) {
        this.roomRepo = roomRepo;
        this.residentRepo = residentRepo;
        this.complaintRepo = complaintRepo;
        this.visitorRepo = visitorRepo;
        this.invoiceRepo = invoiceRepo;
        this.emergencyRepo = emergencyRepo;
        this.noticeRepo = noticeRepo;
        this.menuRepo = menuRepo;
        this.feedbackRepo = feedbackRepo;
        this.assetRepo = assetRepo;
        this.shiftRepo = shiftRepo;
        this.patrolRepo = patrolRepo;
    }

    public PlatformAnalyticsResponse getFullAnalytics() {
        PlatformAnalyticsResponse r = new PlatformAnalyticsResponse();
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        // Module 2: Rooms
        long totalRooms = roomRepo.count();
        long occupiedRooms = roomRepo.countByStatus(RoomStatus.OCCUPIED);
        long availableRooms = roomRepo.countByStatus(RoomStatus.AVAILABLE);
        r.setTotalRooms(totalRooms);
        r.setOccupiedRooms(occupiedRooms);
        r.setAvailableRooms(availableRooms);
        r.setOccupancyPercent(totalRooms > 0 ? Math.round((occupiedRooms * 100.0 / totalRooms) * 10.0) / 10.0 : 0.0);

        // Module 3: Residents
        long totalResidents = residentRepo.count();
        long activeResidents = residentRepo.countByStatus(ResidentStatus.ACTIVE);
        r.setTotalResidents(totalResidents);
        r.setActiveResidents(activeResidents);

        // Module 4: Complaints
        long totalComplaints = complaintRepo.count();
        long openComplaints = complaintRepo.countByStatus(ComplaintStatus.OPEN);
        long resolvedComplaints = complaintRepo.countByStatus(ComplaintStatus.RESOLVED);
        r.setTotalComplaints(totalComplaints);
        r.setOpenComplaints(openComplaints);
        r.setResolvedComplaints(resolvedComplaints);
        r.setComplaintResolutionRate(totalComplaints > 0 ?
                Math.round((resolvedComplaints * 100.0 / totalComplaints) * 10.0) / 10.0 : 0.0);

        // Module 5: Visitors
        r.setVisitorsToday(visitorRepo.countExpectedOnDate(today));
        r.setTotalVisitors(visitorRepo.count());

        // Module 6: Payments
        BigDecimal collected = invoiceRepo.sumTotalCollected();
        BigDecimal pending = invoiceRepo.sumTotalPending();
        double collectedAmt = collected != null ? collected.doubleValue() : 0.0;
        double pendingAmt = pending != null ? pending.doubleValue() : 0.0;
        double invoicedAmt = collectedAmt + pendingAmt;
        r.setTotalCollected(collectedAmt);
        r.setTotalInvoiced(invoicedAmt);
        r.setCollectionRate(invoicedAmt > 0 ?
                Math.round((collectedAmt * 100.0 / invoicedAmt) * 10.0) / 10.0 : 0.0);

        // Module 7: Emergency
        r.setTotalSosAlerts(emergencyRepo.count());
        r.setUnresolvedSos(emergencyRepo.countByStatus(EmergencyStatus.ACTIVE));

        // Module 8: Notices
        r.setTotalNotices(noticeRepo.count());
        r.setActiveNotices(noticeRepo.countByPinnedTrue());

        // Module 9: Food & Mess
        r.setTotalMenuItems(menuRepo.count());
        Double avgRating = feedbackRepo.calculateOverallAverageRating();
        r.setAvgMessRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0);

        // Module 10: Inventory
        r.setTotalAssets(assetRepo.count());
        r.setDamagedAssets(assetRepo.countByCondition(AssetCondition.DAMAGED));

        // Module 11: Staff Roster
        r.setStaffShiftsToday(shiftRepo.countByShiftDate(today));
        r.setActiveShifts(shiftRepo.countByShiftDateAndStatus(today, ShiftStatus.ACTIVE));
        r.setIncidentsToday(patrolRepo.countIncidentsByVerifiedAtBetween(startOfDay, endOfDay));

        return r;
    }
}
