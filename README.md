# Smart Living & Safety Platform

A centralized, deployable platform designed to manage daily operations, resident services, and structured emergency response workflows across shared-living communities (hostels, PGs, apartment societies, and student housing).

---

## 🏛 Architecture Overview

- **Pattern**: Modular Monolith
- **Backend**: Java 21 / 25, Spring Boot 3.4, Spring Web, Spring Data JPA, Hibernate
- **Database**: MySQL 8.0+
- **Frontend**: React 18, Vite, React Router 6, Responsive CSS
- **API Protocol**: RESTful JSON with standardized `ApiResponse<T>` and centralized `GlobalExceptionHandler`
- **Security Strategy**: Environment-driven credentials, Spring Security + JWT + RBAC (Phase 2 foundation)

---

## 📁 Repository Structure

```text
smart-living-platform/
├── backend/
│   ├── .mvn/wrapper/
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/smartliving/
│   │   │   │   ├── SmartLivingApplication.java
│   │   │   │   ├── auth/           # Phase 2: JWT & Spring Security
│   │   │   │   ├── users/          # Phase 2: User management & roles
│   │   │   │   ├── properties/     # Phase 3: Properties & blocks
│   │   │   │   ├── rooms/          # Phase 3: Rooms & bed allocation
│   │   │   │   ├── residents/      # Phase 3: Resident records
│   │   │   │   ├── complaints/     # Phase 4: Maintenance tickets
│   │   │   │   ├── visitors/       # Phase 4: Access control & visitor logs
│   │   │   │   ├── payments/       # Phase 4: Fees, dues & receipts
│   │   │   │   ├── emergency/      # Phase 5: One-tap SOS & escalation
│   │   │   │   ├── notifications/  # Phase 7: Alerts & messaging
│   │   │   │   ├── audit/          # Administrative audit logs
│   │   │   │   └── common/
│   │   │   │       ├── config/     # CorsConfig
│   │   │   │       ├── controller/ # HealthController (/api/health)
│   │   │   │       ├── dto/        # ApiResponse, HealthResponse
│   │   │   │       └── exception/  # GlobalExceptionHandler, AppException
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   └── test/
│   │       ├── java/com/smartliving/
│   │       │   ├── SmartLivingApplicationTests.java
│   │       │   └── common/controller/HealthControllerTest.java
│   │       └── resources/
│   │           └── application.yml # Isolated H2 in-memory test configuration
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     # Overview & live backend health check
│   │   │   ├── LoginPage.jsx       # Auth placeholder
│   │   │   └── DashboardPage.jsx   # Role portal placeholder
│   │   ├── services/
│   │   │   └── api.js              # Backend communication client
│   │   ├── App.jsx                 # Routing & navigation bar
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js              # Dev proxy to backend
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Java**: JDK 21 or 25 installed
- **Node.js**: v18+ and npm
- **MySQL**: MySQL 8.0 server running locally or via Docker

### 2. Backend Setup
1. Open terminal in `backend/`:
   ```bash
   cd backend
   ```
2. Build and verify test suites:
   ```bash
   .\mvnw.cmd clean test
   ```
3. Run the Spring Boot application:
   ```bash
   .\mvnw.cmd spring-boot:run
   ```
4. Verify backend health endpoint in browser or curl:
   ```bash
   curl http://localhost:8080/api/health
   ```
   Expected JSON response:
   ```json
   {
     "status": "UP",
     "service": "smart-living-backend",
     "version": "0.0.1-SNAPSHOT",
     "timestamp": "2026-10-06T..."
   }
   ```

### 3. Frontend Setup
1. Open a second terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 🔒 Environment Configuration

All database credentials, ports, and security secrets are supplied via environment variables (`.env`). Refer to `.env.example`:
- `DB_URL`: MySQL connection string (default: `jdbc:mysql://localhost:3306/smart_living_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`)
- `DB_USERNAME`: Database username (default: `root`)
- `DB_PASSWORD`: Database password
- `ALLOWED_ORIGINS`: Allowed CORS origins for REST APIs (default: `http://localhost:5173,http://localhost:3000`)
- `JWT_SECRET`: 256-bit secret key for tokens
