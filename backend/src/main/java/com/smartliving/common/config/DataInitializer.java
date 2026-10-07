package com.smartliving.common.config;

import com.smartliving.module1authentication.users.model.Role;
import com.smartliving.module1authentication.users.model.RoleType;
import com.smartliving.module1authentication.users.model.User;
import com.smartliving.module1authentication.users.repository.RoleRepository;
import com.smartliving.module1authentication.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.smartliving.module2propertyrooms.properties.repository.PropertyRepository propertyRepository;
    private final com.smartliving.module2propertyrooms.properties.repository.BuildingRepository buildingRepository;
    private final com.smartliving.module2propertyrooms.properties.repository.FloorRepository floorRepository;
    private final com.smartliving.module2propertyrooms.rooms.service.RoomService roomService;
    private final com.smartliving.module2propertyrooms.rooms.repository.BedRepository bedRepository;
    private final com.smartliving.module3residents.service.ResidentService residentService;
    private final com.smartliving.module9food.service.FoodService foodService;
    private final com.smartliving.module6payments.service.PaymentService paymentService;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           com.smartliving.module2propertyrooms.properties.repository.PropertyRepository propertyRepository,
                           com.smartliving.module2propertyrooms.properties.repository.BuildingRepository buildingRepository,
                           com.smartliving.module2propertyrooms.properties.repository.FloorRepository floorRepository,
                           com.smartliving.module2propertyrooms.rooms.service.RoomService roomService,
                           com.smartliving.module2propertyrooms.rooms.repository.BedRepository bedRepository,
                           com.smartliving.module3residents.service.ResidentService residentService,
                           com.smartliving.module9food.service.FoodService foodService,
                           com.smartliving.module6payments.service.PaymentService paymentService) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.propertyRepository = propertyRepository;
        this.buildingRepository = buildingRepository;
        this.floorRepository = floorRepository;
        this.roomService = roomService;
        this.bedRepository = bedRepository;
        this.residentService = residentService;
        this.foodService = foodService;
        this.paymentService = paymentService;
    }

    @Override
    public void run(String... args) {
        // Initialize standard RBAC roles
        for (RoleType roleType : RoleType.values()) {
            if (roleRepository.findByName(roleType).isEmpty()) {
                roleRepository.save(new Role(roleType));
                log.info("Initialized role: {}", roleType);
            }
        }

        // Initialize default super admin if none exists
        String adminEmail = "admin@smartliving.local";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User(
                    "System Administrator",
                    adminEmail,
                    passwordEncoder.encode("Admin@12345"),
                    "+91-9876543210"
            );
            Role adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN)
                    .orElseGet(() -> roleRepository.save(new Role(RoleType.ROLE_ADMIN)));

            admin.setRoles(Collections.singleton(adminRole));
            userRepository.save(admin);
            log.info("Initialized default administrator account: {}", adminEmail);
        }

        // Initialize default property, building, floor, rooms and beds
        if (propertyRepository.count() == 0) {
            com.smartliving.module2propertyrooms.properties.model.Property property = new com.smartliving.module2propertyrooms.properties.model.Property(
                    "Greenwood Student Living & PG",
                    "Plot 42, Sector 14, IT Corridor",
                    "Bengaluru",
                    "Karnataka",
                    "560100",
                    com.smartliving.module2propertyrooms.properties.model.PropertyType.PG,
                    "+91-9876500001",
                    "info@greenwoodliving.com",
                    "Modern co-living and student hostel platform."
            );
            property = propertyRepository.save(property);

            com.smartliving.module2propertyrooms.properties.model.Building blockA = new com.smartliving.module2propertyrooms.properties.model.Building(
                    property, "Block A - Boys Wing", "A", 2, "Main accommodation block"
            );
            blockA = buildingRepository.save(blockA);

            com.smartliving.module2propertyrooms.properties.model.Floor floor1 = floorRepository.save(
                    new com.smartliving.module2propertyrooms.properties.model.Floor(blockA, 1, "First Floor")
            );
            com.smartliving.module2propertyrooms.properties.model.Floor floor2 = floorRepository.save(
                    new com.smartliving.module2propertyrooms.properties.model.Floor(blockA, 2, "Second Floor")
            );

            // Rooms on Floor 1
            com.smartliving.module2propertyrooms.rooms.dto.RoomRequest r101 = new com.smartliving.module2propertyrooms.rooms.dto.RoomRequest();
            r101.setFloorId(floor1.getId());
            r101.setRoomNumber("101");
            r101.setRoomType(com.smartliving.module2propertyrooms.rooms.model.RoomType.DOUBLE);
            r101.setCapacity(2);
            r101.setBaseRent(new java.math.BigDecimal("7500.00"));
            r101.setDescription("AC Double Sharing with attached bathroom");
            var r101Created = roomService.createRoom(r101);

            com.smartliving.module2propertyrooms.rooms.dto.RoomRequest r102 = new com.smartliving.module2propertyrooms.rooms.dto.RoomRequest();
            r102.setFloorId(floor1.getId());
            r102.setRoomNumber("102");
            r102.setRoomType(com.smartliving.module2propertyrooms.rooms.model.RoomType.SINGLE);
            r102.setCapacity(1);
            r102.setBaseRent(new java.math.BigDecimal("12000.00"));
            r102.setDescription("Premium Single Room with balcony");
            roomService.createRoom(r102);

            // Rooms on Floor 2
            com.smartliving.module2propertyrooms.rooms.dto.RoomRequest r201 = new com.smartliving.module2propertyrooms.rooms.dto.RoomRequest();
            r201.setFloorId(floor2.getId());
            r201.setRoomNumber("201");
            r201.setRoomType(com.smartliving.module2propertyrooms.rooms.model.RoomType.TRIPLE);
            r201.setCapacity(3);
            r201.setBaseRent(new java.math.BigDecimal("6000.00"));
            r201.setDescription("Economy Triple Sharing with study desks");
            roomService.createRoom(r201);

            log.info("Initialized default property, buildings, floors, rooms, and beds");

            // Seed default resident allocated to first available bed
            var availableBeds = bedRepository.findByRoomIdAndStatus(
                    r101Created.getId(),
                    com.smartliving.module2propertyrooms.rooms.model.BedStatus.AVAILABLE
            );
            if (!availableBeds.isEmpty()) {
                com.smartliving.module3residents.dto.ResidentOnboardingRequest residentReq = new com.smartliving.module3residents.dto.ResidentOnboardingRequest();
                residentReq.setFullName("Rahul Sharma");
                residentReq.setEmail("rahul.resident@smartliving.local");
                residentReq.setPassword("Resident@12345");
                residentReq.setPhone("+91-9876501234");
                residentReq.setAdmissionNumber("RES-2026-001");
                residentReq.setBedId(availableBeds.get(0).getId());
                residentReq.setIdProofType(com.smartliving.module3residents.model.IdProofType.AADHAAR);
                residentReq.setIdProofNumber("1234-5678-9012");
                residentReq.setEmergencyContactName("Suresh Sharma");
                residentReq.setEmergencyContactRelation("Father");
                residentReq.setEmergencyContactPhone("+91-9876509999");
                residentReq.setMonthlyRent(new java.math.BigDecimal("7500.00"));
                residentReq.setDepositAmount(new java.math.BigDecimal("15000.00"));
                residentReq.setPermanentAddress("12, Green Park, New Delhi");
                residentReq.setNotes("First enrolled resident in Block A");
                var onboarded = residentService.onboardResident(residentReq);
                log.info("Initialized default resident account: rahul.resident@smartliving.local (Allocated bed: {})", availableBeds.get(0).getBedNumber());

                // Seed monthly rent invoice for Rahul
                com.smartliving.module6payments.dto.CreateInvoiceRequest invReq = new com.smartliving.module6payments.dto.CreateInvoiceRequest();
                invReq.setResidentId(onboarded.getId());
                invReq.setTitle("October 2026 Monthly Accommodation & PG Rent");
                invReq.setDescription("Includes Double-AC room rent, high-speed Wi-Fi, laundry, and daily mess catering.");
                invReq.setAmount(new java.math.BigDecimal("7500.00"));
                invReq.setDueDate(java.time.LocalDate.now().plusDays(5));
                invReq.setBillingMonth("2026-10");
                paymentService.createInvoice(invReq);
                log.info("Initialized default rent invoice of ₹7500 for Rahul Sharma");
            }
        }

        // Seed daily mess menu for today if none exists
        java.time.LocalDate today = java.time.LocalDate.now();
        if (foodService.getDailyMenu(today, null).isEmpty()) {
            com.smartliving.module9food.dto.CreateMealMenuRequest breakfast = new com.smartliving.module9food.dto.CreateMealMenuRequest();
            breakfast.setMenuDate(today);
            breakfast.setMealType(com.smartliving.module9food.model.MealType.BREAKFAST);
            breakfast.setTitle("North & South Indian Breakfast Buffet");
            breakfast.setItems("Idli Sambhar, Masala Poha, Boiled Eggs / Sprouts, Fresh Cut Fruits, Tea & Coffee");
            breakfast.setVeg(false);
            breakfast.setDietaryNotes("Gluten-free options available on request");
            breakfast.setCalories("420 kcal");
            foodService.createOrUpdateMenu(breakfast);

            com.smartliving.module9food.dto.CreateMealMenuRequest lunch = new com.smartliving.module9food.dto.CreateMealMenuRequest();
            lunch.setMenuDate(today);
            lunch.setMealType(com.smartliving.module9food.model.MealType.LUNCH);
            lunch.setTitle("Wholesome Executive Lunch");
            lunch.setItems("Paneer Butter Masala, Dal Tadka, Jeera Rice, Phulka, Boondi Raita, Gulab Jamun");
            lunch.setVeg(true);
            lunch.setDietaryNotes("Rich in protein, prepared with pure cow ghee");
            lunch.setCalories("680 kcal");
            foodService.createOrUpdateMenu(lunch);

            com.smartliving.module9food.dto.CreateMealMenuRequest snacks = new com.smartliving.module9food.dto.CreateMealMenuRequest();
            snacks.setMenuDate(today);
            snacks.setMealType(com.smartliving.module9food.model.MealType.SNACKS);
            snacks.setTitle("Evening Hi-Tea & Snacks");
            snacks.setItems("Veg Samosa with Mint Chutney, Assorted Biscuits, Masala Chai & Filter Coffee");
            snacks.setVeg(true);
            snacks.setDietaryNotes("Freshly prepared at 4:30 PM");
            snacks.setCalories("280 kcal");
            foodService.createOrUpdateMenu(snacks);

            com.smartliving.module9food.dto.CreateMealMenuRequest dinner = new com.smartliving.module9food.dto.CreateMealMenuRequest();
            dinner.setMenuDate(today);
            dinner.setMealType(com.smartliving.module9food.model.MealType.DINNER);
            dinner.setTitle("Special Co-Living Community Dinner");
            dinner.setItems("Kadai Chicken / Shahi Paneer, Dal Makhani, Steamed Rice, Tandoori Roti, Green Salad");
            dinner.setVeg(false);
            dinner.setDietaryNotes("Separate vegetarian preparation and serving counter");
            dinner.setCalories("620 kcal");
            foodService.createOrUpdateMenu(dinner);

            log.info("Initialized 4-tier daily mess menu (Breakfast, Lunch, Snacks, Dinner) for {}", today);
        }
    }
}
