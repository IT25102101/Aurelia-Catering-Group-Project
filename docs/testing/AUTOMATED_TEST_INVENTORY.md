# Automated Test Inventory
## Project: Aurelia Web-Based Catering Management System

---

## 1. Inventory Summary

| Metric | Backend (Java / Spring Boot) | Frontend (React / Vitest) | Total System |
| :--- | :--- | :--- | :--- |
| **Test Classes / Files** | 17 Test Classes | 6 Test Files | **23 Test Suites** |
| **Automated Tests Executed** | 102 Tests | 33 Tests | **135 Automated Tests** |
| **Pass Rate** | 100% (102 / 102) | 100% (33 / 33) | **100% PASS** |
| **Execution Framework** | JUnit 5.10.3 + Mockito 5.11.0 + MockMvc | Vitest 5.0.3 + React Testing Library 16.3.3 | Multi-Engine |
| **Execution Speed** | ~8.5 seconds (Maven) | ~5.4 seconds (Vitest) | **~14.0 seconds total** |

---

## 2. Backend Automated Test Suite Inventory

### Directory: `backend/src/test/java/com/aurelia/catering/`

| # | Test Class File | Methods / Tests | Purpose & Coverage |
| :---: | :--- | :---: | :--- |
| 1 | `CateringPackageFactoryTest.java` | 6 | **Factory Pattern:** Subclass instantiation (`Wedding`, `Birthday`, `Corporate`, `Gala`, `General`), default bounds. |
| 2 | `PackagePricingStrategyTest.java` | 5 | **Strategy Pattern:** Core pricing formulas (`fixed`, `per_guest`, `occasion`, `food_value`). |
| 3 | `StrategyEdgeCaseTest.java` | 12 | **Boundary Value Analysis:** 99/100/199/200/499/500 guests, negative/zero guest clamps, case-insensitivity, 0-item fallback. |
| 4 | `CateringPackageServiceTest.java` | 12 | **Service Layer:** Package CRUD, factory integration, validation checks, exception handling. |
| 5 | `CateringPackageControllerTest.java` | 12 | **REST Controller (MockMvc):** `GET`, `POST`, `PUT`, `DELETE /api/catering-packages`, strategy simulation endpoint, 400 & 404 handling. |
| 6 | `PackageMenuItemControllerTest.java` | 6 | **Junction Controller (MockMvc):** `/api/catering-packages/{id}/menu-items` dish assignments, 409 duplicate conflict handling, unassignments. |
| 7 | `AuthControllerTest.java` | 8 | **Authentication Controller:** Login, logout, PBKDF2 hashing, inactive account 403 guard, registration. |
| 8 | `MenuItemControllerTest.java` | 7 | **Menu Item Controller:** Menu dish catalog CRUD, negative price validation, retrieval. |
| 9 | `OrderControllerTest.java` | 7 | **Order Controller:** Customer order booking, guest count verification, status progression, inventory checks. |
| 10 | `QuotationControllerTest.java` | 5 | **Quotation Controller:** Quotation generation, customer ownership guard, draft protection. |
| 11 | `PaymentControllerTest.java` | 3 | **Payment Controller:** Advance deposit and settlement recording, order balance calculations. |
| 12 | `InventoryItemControllerTest.java` | 3 | **Inventory Controller:** Inventory item stock management and updates. |
| 13 | `StaffControllerTest.java` | 3 | **Staff Controller:** Staff employee profile CRUD and role checks. |
| 14 | `DeliveryControllerTest.java` | 3 | **Delivery Controller:** Delivery dispatch, driver assignment, status transitions. |
| 15 | `PasswordUtilTest.java` | 5 | **Security Utility:** PBKDF2 hashing, format validation (`pbkdf2$...`), constant-time verify, legacy upgrade. |
| 16 | `CrossModuleIntegrationTest.java` | 1 | **End-to-End Pipeline:** Complete lifecycle from Login -> Dish -> Package -> Dynamic Pricing -> Order -> Quotation -> Payment. |
| 17 | `DatabaseIntegrationTest.java` | 4 | **SQL Server Schema Tests:** Safe dynamic JDBC metadata validation of `CateringPackage`, `MenuItem`, `PACKAGE_MENU_ITEM` tables. |
| **TOTAL** | **17 Classes** | **102 Tests** | **All 102 Tests Passed (0 Failures, 0 Errors, 0 Skipped)** |

---

## 3. Frontend Automated Test Suite Inventory

### Directory: `frontend/src/test/`

| # | Test File | Tests | Purpose & Coverage |
| :---: | :--- | :---: | :--- |
| 1 | `CateringPackagesPage.test.jsx` | 9 | **Package UI (Individual Contribution):** Header render, Factory occasion selector, validation of title & price, Factory creation payload, dish composition display, dropdown assignment, 409 duplicate conflict handling, Strategy simulator breakdown (Rs. 161,500.00), delete confirmation. |
| 2 | `LoginPage.test.jsx` | 4 | **Auth UI:** Login form rendering, credentials input, submission with token storage, validation error alerts. |
| 3 | `Navbar.test.jsx` | 3 | **Navigation UI:** Brand title, public navigation links, staff portal access button, logout trigger. |
| 4 | `RequireRole.test.jsx` | 4 | **Route Security:** Unauthenticated redirect to `/login`, role matching, non-permitted 403 access denial. |
| 5 | `AuthContext.test.jsx` | 3 | **Context State:** User state initialization, login authentication storage, logout session clearing. |
| 6 | `apiClients.test.js` | 10 | **API Client Layer:** Request URL formatting, headers, JSON serialization for packages, menu items, orders, quotations, payments, and strategy pricing calculations. |
| **TOTAL** | **6 Files** | **33 Tests** | **All 33 Tests Passed (0 Failures, 0 Errors, 0 Skipped)** |

---

## 4. Test Configuration & Support Files

1. `backend/pom.xml`: Configured `maven-surefire-plugin` with `-XX:+EnableDynamicAgentLoading` and native library paths for Java 25 compatibility.
2. `backend/src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker`: Contains `mock-maker-subclass` to allow Mockito bytebuddy subclassing on Java 25.
3. `backend/mvnw.cmd`: Custom execution wrapper script specifying JDK 25 path and executing bundled Maven 3.9.16.
4. `frontend/vite.config.js`: Configured `test` block with `globals: true`, `environment: 'jsdom'`, and `setupFiles: './src/test/setup.js'`.
5. `frontend/src/test/setup.js`: Extends Vitest expectations with `@testing-library/jest-dom/vitest`.
6. `package.json`: Configured root scripts:
   - `npm test`: Runs both backend and frontend suites sequentially.
   - `npm run test:backend`: Invokes Maven Surefire test harness.
   - `npm run test:frontend`: Invokes Vitest test runner.
