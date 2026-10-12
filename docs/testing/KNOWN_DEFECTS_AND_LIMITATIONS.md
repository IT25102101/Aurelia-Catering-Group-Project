# Known Defects, Limitations & Architectural Observations
## Project: Aurelia Web-Based Catering Management System

---

## 1. Overview

During the discovery, test suite construction, and execution phases on the fresh clone of the Aurelia Catering Management System, several architectural quirks, environment constraints, and runtime nuances were investigated. This document honestly records these findings to support university viva examination discussions.

---

## 2. Identified Nuances & Resolutions

### 2.1 Java 25 & Mockito Agent Attachment
- **Symptom:** Running tests on OpenJDK 25 (`jdk-25.0.4`) resulted in warnings regarding dynamic agent loading and potential byte-buddy inline mockmaker failures.
- **Root Cause:** Java 21+ and Java 25 restrict unauthorized dynamic agent attachment at runtime by default.
- **Resolution:**
  1. Configured `maven-surefire-plugin` with `<argLine>-XX:+EnableDynamicAgentLoading</argLine>`.
  2. Registered `mock-maker-subclass` in `src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker`. This ensures stable Mockito proxy generation without requiring unsafe dynamic bytecode instrumentation.

### 2.2 PowerShell Execution Policy on Windows
- **Symptom:** Attempting to run `npm test` directly from PowerShell threw `PSSecurityException: File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled`.
- **Root Cause:** Windows PowerShell default execution policy blocks unsanctioned `.ps1` wrapper scripts.
- **Resolution:** Invoked test runners using standard Windows batch wrappers (`cmd.exe /c "npm test"` and `cmd.exe /c "mvnw.cmd test"`). Configured `mvnw.cmd` to explicitly lock to Java 25 JDK.

### 2.3 SQL Server Port & Environment Isolation
- **Observation:** The local machine has a running Microsoft SQL Server instance (`MSSQL$SQLEXPRESS` listening on port 1433).
- **Safety Precaution:** The test suite follows strict non-destructive policies:
  - Tests **NEVER** drop or truncate database tables.
  - Integration tests use `DatabaseMetaData` to inspect table and column schema non-invasively.
  - Database tests wrap execution in `Assumptions.assumeTrue(...)` to guarantee that CI/CD pipelines running on machines without an active SQL Server instance skip gracefully without throwing false-positive failures.

### 2.4 Currency Formatter Regional Variation
- **Observation:** In Node.js / JSDOM with locale `en-LK` (Sri Lanka English), the currency string uses `Rs.` formatting rather than `LKR`.
- **Impact:** Frontend tests asserting currency figures verify the exact rendered format `Rs. 161,500.00`.

---

## 3. Application Design Limitations (Honest Viva Assessment)

1. **Junction Table Cascading Deletes:**
   - In SQL Server, deleting a `CateringPackage` that has rows in `PACKAGE_MENU_ITEM` requires either cascading deletes or manual deletion of child records first. The application code handles this safely in `CateringPackageDAO.delete()`.
2. **Session Storage vs. JWT Expiration:**
   - The application relies on server-managed sessions and local state rather than stateless JWT token refresh cycles. For a university-level production prototype, this is appropriate and functional, but in high-availability multi-node deployments, sticky sessions or Redis-backed session stores would be recommended.
3. **Food Value Costing Data Freshness:**
   - The `FoodValueCostingStrategy` computes food cost dynamically from assigned `MenuItem` prices. If a dish price is updated in `MenuItem`, existing past order records retain their original quotation snapshot rather than recalculating retroactively, which is the correct business behavior.
