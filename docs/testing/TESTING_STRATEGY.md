# Testing Strategy & Quality Assurance Framework
## Project: Aurelia Web-Based Catering Management System

---

## 1. Executive Summary

This document defines the comprehensive quality assurance and testing strategy established for the **Aurelia Web-Based Catering Management System**. The system is a full-stack enterprise catering operations platform consisting of a Spring Boot (Java 25) backend, a React 18 + Vite frontend, and a Microsoft SQL Server database.

The testing strategy spans unit tests, integration tests, API/controller endpoint tests, security tests, database schema validation, and front-end interaction testing, with an exhaustive, deep-dive focus on the **Catering Package Management** subsystem (individual contribution featuring the Factory and Strategy design patterns).

---

## 2. System Architecture & Scope

| Tier | Component | Technology / Stack | Testing Tools |
| :--- | :--- | :--- | :--- |
| **Frontend** | Client SPA & Staff Dashboard | React 18, React Router 6, Vite | Vitest, React Testing Library, jsdom, Jest-DOM |
| **Backend** | REST API & Core Services | Java 25, Spring Boot 3.3.4, Maven | JUnit 5, Mockito (ByteBuddy Subclass), MockMvc |
| **Database** | Relational Data Store | Microsoft SQL Server (MSSQL$SQLEXPRESS) | JDBC Native Drivers, DAO Test Harness, Assumptions |
| **Cross-Cutting** | Security, Hashing, Inter-module | PBKDF2 Password Hashing, Session Auth | Custom Assertions, MockMvc Session Context |

### Discovered Functional Modules Under Test:
1. **Catering Package Management** *(Individual Contribution - Intensive Coverage)*
   - Occasion-specific object creation (**Factory Pattern**)
   - Dynamic price computation & discounting (**Strategy Pattern**)
   - Menu item dish assignments (`PACKAGE_MENU_ITEM`)
   - Interactive Pricing Simulator UI
2. **Authentication & User Management**
   - PBKDF2 salt-hash authentication, legacy plaintext upgrade, inactive staff guards
3. **Catering Menu Management**
   - Menu catalog CRUD, pricing validations, category filtering
4. **Order Management**
   - Customer orders, status transitions, guest counts, inventory allocations
5. **Quotation & Payment Management**
   - Advance payments, settlements, customer quotation isolation
6. **Inventory Management**
   - Stock level tracking, unit pricing, item restocking
7. **Staff Management**
   - Role assignments (`ADMIN`, `STAFF`, `DELIVERY`), credentials, profiles
8. **Delivery Management**
   - Delivery dispatch, status progressions, driver assignments

---

## 3. Multi-Layer Testing Architecture

```
+-------------------------------------------------------------------------+
|                         Frontend Testing Layer                          |
|         (Vitest + React Testing Library + JSDOM + Mock APIs)            |
| - Component Rendering, State Updates, Form Validations, DOM Events     |
| - Protected Routes (RequireRole), Context (AuthContext), API Clients   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                          API & Controller Layer                         |
|             (Spring MockMvc + Jackson JSON Serialization)                |
| - HTTP Status Codes (200, 201, 400, 401, 403, 404, 409)                |
| - JSON Payloads, Query Params, Request Body Validation, Session Context |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       Service & Domain Logic Layer                      |
|                  (JUnit 5 + Mockito + Edge Case Tests)                  |
| - Design Patterns: Package Factory Pattern & Pricing Strategy Pattern  |
| - Boundary Analysis: Guest count tiers (99, 100, 199, 200, 499, 500)    |
| - Calculation Accuracy: Margins, Discounts, Clamps, Multipliers         |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         Database & Storage Layer                        |
|                     (JDBC DAOs + SQL Server Instance)                   |
| - SQL Server 2022 Schema & Table Validation (21 Tables Detected)       |
| - Conditional Dynamic Execution (Assumptions.assumeTrue)                |
| - Safe Non-Destructive Transactions (Zero Dropping or Truncation)       |
+-------------------------------------------------------------------------+
```

---

## 4. Test Levels & Methodology

### 4.1 Unit Testing (Isolated Verification)
- **Scope:** Individual classes and functions tested without network, servlet container, or active database dependencies.
- **Backend Implementation:** JUnit 5 with Mockito subclass mockmaker (`backend/src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker`).
- **Frontend Implementation:** Vitest unit tests verifying pure utility functions and isolated API client modules (`apiClients.test.js`).

### 4.2 Controller & Integration MockMvc Testing
- **Scope:** Verifies Spring REST controllers, HTTP request mapping, parameter binding, JSON serialization, and error response contracts.
- **Methodology:** Isolated `MockMvcBuilders.standaloneSetup()` with Mockito service mocks, eliminating the need to launch an active embedded server or database during unit/integration suites.

### 4.3 Database Integration Testing
- **Safety Standard:** No test ever drops tables, truncates tables, or alters database definitions.
- **Strategy:** Uses `Assumptions.assumeTrue(isSqlServerOnline())`. If SQL Server is reachable on port 1433, table presence (`CateringPackage`, `MenuItem`, `PACKAGE_MENU_ITEM`, `ORDER`, `QUOTATION`, etc.) is validated directly via JDBC `DatabaseMetaData`. If offline, tests skip gracefully without false failures.

### 4.4 End-to-End Business Flow Integration
- **Scope:** Single deterministic integration pipeline verifying cross-module workflow:
  `Authentication -> Menu Catalog -> Package Creation -> Strategy Dynamic Pricing -> Order Creation -> Quotation Issuance -> Payment Settlement`.

---

## 5. Defect Severity & Priority Classification

| Severity Level | Definition | Response Protocol |
| :--- | :--- | :--- |
| **Critical / Blocker** | System crash, data loss, total authentication failure, or pricing formula corruption. | Immediate investigation; fix required before any release. |
| **Major** | Primary business flow broken (e.g., package cannot assign menu items, duplicate conflict unhandled). | Addressed with high priority and regression verified. |
| **Minor / Moderate** | UI cosmetic mismatch, non-blocking input formatting inconsistency, minor edge-case clamping. | Logged with root cause documented; safe minimal fix applied. |
| **Trivial** | Typographical error or styling polish. | Documented for future refinement. |

---

## 6. Exit Criteria for Test Suite

1. **100% of automated tests pass** without failures or flakiness across all test runs.
2. **Zero destructive modifications** to the existing production application code.
3. **Deep design pattern test suite** covering all Factory package subclasses and Strategy pricing algorithms, including exact mathematical boundaries.
4. **Complete documentation** providing clear traceability between requirements, source files, and test cases for academic defense and university viva examination.
