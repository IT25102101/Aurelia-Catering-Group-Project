# Test Execution Commands Reference
## Project: Aurelia Web-Based Catering Management System

---

## 1. Quick Command Cheatsheet

| Goal | Working Directory | Command |
| :--- | :--- | :--- |
| **Run All Tests (Full Suite)** | Project Root (`/`) | `npm test` |
| **Run All Backend Tests** | Project Root (`/`) | `npm run test:backend` |
| **Run All Frontend Tests** | Project Root (`/`) | `npm run test:frontend` |
| **Run Backend via Maven Wrapper** | `backend/` | `mvnw.cmd test` |
| **Run Frontend via Vitest** | `frontend/` | `npx vitest run` |
| **Run Frontend with Interactive Watcher** | `frontend/` | `npx vitest` |

---

## 2. Backend Test Commands (Maven / JUnit 5)

All backend commands should be run from the `backend/` directory or using the `mvnw.cmd` wrapper.

### 2.1 Run All Backend Tests
```cmd
cd backend
mvnw.cmd test
```

### 2.2 Run a Specific Test Class
To run only the individual contribution test classes:
```cmd
cd backend
mvnw.cmd test -Dtest=CateringPackageControllerTest
mvnw.cmd test -Dtest=CateringPackageServiceTest
mvnw.cmd test -Dtest=CateringPackageFactoryTest
mvnw.cmd test -Dtest=PackagePricingStrategyTest
mvnw.cmd test -Dtest=StrategyEdgeCaseTest
```

### 2.3 Run Tests for a Specific Module
- **Authentication & Security:**
  ```cmd
  mvnw.cmd test -Dtest=AuthControllerTest,PasswordUtilTest
  ```
- **Order & Quotation Management:**
  ```cmd
  mvnw.cmd test -Dtest=OrderControllerTest,QuotationControllerTest,PaymentControllerTest
  ```
- **Database Schema Validation:**
  ```cmd
  mvnw.cmd test -Dtest=DatabaseIntegrationTest
  ```
- **Cross-Module Integration Pipeline:**
  ```cmd
  mvnw.cmd test -Dtest=CrossModuleIntegrationTest
  ```

---

## 3. Frontend Test Commands (Vitest / React Testing Library)

All frontend commands should be run from the `frontend/` directory.

### 3.1 Run All Frontend Tests Headless
```cmd
cd frontend
npm test
```
*Alternatively:*
```cmd
npx vitest run
```

### 3.2 Run a Specific Frontend Test File
- **Catering Package Management Component (Contribution):**
  ```cmd
  cd frontend
  npx vitest run src/test/CateringPackagesPage.test.jsx
  ```
- **Authentication & Route Security:**
  ```cmd
  npx vitest run src/test/LoginPage.test.jsx
  npx vitest run src/test/RequireRole.test.jsx
  npx vitest run src/test/AuthContext.test.jsx
  ```
- **API Client Suite:**
  ```cmd
  npx vitest run src/test/apiClients.test.js
  ```

### 3.3 Run Tests Matching a Specific Pattern or Title
```cmd
cd frontend
npx vitest run -t "Strategy Pattern"
npx vitest run -t "validates"
```

---

## 4. Troubleshooting Windows PowerShell Command Execution

If running in Windows PowerShell, execute commands using `cmd.exe /c` to bypass `.ps1` execution policy restrictions:

```powershell
cmd.exe /c "npm test"
cmd.exe /c "npm run test:backend"
cmd.exe /c "npm run test:frontend"
```
