# Comprehensive Viva Voce Testing Preparation Guide
## 30+ Project-Specific Testing Questions & Answers (English & Sinhala)
### Project: Aurelia Web-Based Catering Management System
### Individual Contribution Focus: Catering Package Management

---

## 1. Introduction for Viva Candidates

This guide is designed for your university final year viva examination. It breaks down the exact testing tools, methodologies, design patterns, and test execution results from the **Aurelia Catering Management System** into simple, beginner-friendly English, accompanied by **Sinhala explanations** to help you understand and present every concept with confidence.

---

## Part 1: Architecture & Testing Overview

### Q1. What is the overall testing approach used in the Aurelia Catering System?
- **English Answer:** We implemented a multi-layered testing pyramid consisting of **Unit Testing**, **Controller/MockMvc API Testing**, **Cross-Module Integration Testing**, **Database Schema Verification**, and **Frontend Component Interaction Testing**. In total, we automated **135 tests** across 23 test suites (102 backend tests + 33 frontend tests), achieving a 100% pass rate.
- **Sinhala Explanation:** අපගේ සිස්ටම් එකේ අපි testing layers කිහිපයක් භාවිතා කළා (Unit tests, Controller/API tests, Integration tests, Database tests සහ Frontend UI tests). මුළු automated tests 135 ක් ලියලා run කළා (Backend 102 සහ Frontend 33), ඒ හැම එකක්ම 100% ක් pass වුණා.

### Q2. Why did you choose JUnit 5 and Mockito for backend testing?
- **English Answer:** JUnit 5 (Jupiter) is the modern industry standard for Java testing, offering robust annotations like `@Test`, `@BeforeEach`, and `Assumptions`. Mockito allows us to isolate classes under test by mocking dependencies (like DAOs or services), enabling fast in-memory unit tests without needing an active database or web server.
- **Sinhala Explanation:** Java වල standard testing framework එක JUnit 5. Mockito මගින් අපිට පුළුවන් database එකක් හෝ server එකක් නැතුව classes isolate කරලා mock objects හදාගෙන වේගයෙන් unit test කරන්න.

### Q3. Why did you choose Vitest and React Testing Library for frontend testing?
- **English Answer:** Vitest is natively integrated with Vite, making it extremely fast compared to legacy Jest. React Testing Library focuses on user-centric testing—testing how actual users interact with forms, buttons, and tables rather than testing internal component state variables.
- **Sinhala Explanation:** Vitest කියන්නේ Vite project වලට තියෙන ඉතාම වේගවත් test runner එකක්. React Testing Library මගින් අපි component එකේ ඇතුලේ තියෙන variables වෙනුවට, user කෙනෙක් screen එකේ දකින දේවල් (buttons, inputs, messages) හරියට වැඩ කරනවද කියලා test කරනවා.

---

## Part 2: Individual Contribution (Catering Package Management)

### Q4. What was your individual contribution to the group project, and how did you test it?
- **English Answer:** My individual contribution was **Catering Package Management (Module 6.3)**. I implemented occasion-specific packages using the **Factory Pattern** and dynamic price calculation algorithms using the **Strategy Pattern**, along with dish assignment and a dynamic pricing simulator. I tested this module extensively with **52 dedicated automated tests** (41 backend tests and 11 frontend tests) covering all subclasses, formula boundaries, error handling, and UI interactions.
- **Sinhala Explanation:** මගේ individual contribution එක තමයි **Catering Package Management**. මෙහිදී මම **Factory Pattern** (Wedding, Birthday, Corporate packages හැදීමට) සහ **Strategy Pattern** (Dynamic pricing algorithms වලට) භාවිතා කළා. මේ module එක වෙනුවෙන් මම dedicated automated tests 52 ක් (Backend 41 + Frontend 11) ලියලා 100% pass කරලා තියෙනවා.

### Q5. Explain the Factory Pattern implemented in Catering Package Management.
- **English Answer:** We created `PackageFactory` to instantiate specialized package subclasses based on the occasion type (`WeddingCateringPackage`, `BirthdayCateringPackage`, `CorporateCateringPackage`, `GalaCateringPackage`, and `GeneralCateringPackage`). Each subclass encapsulates its own default guest capacity bounds (e.g., Birthday is 15-80 guests, while Wedding is 50-500 guests).
- **Sinhala Explanation:** Factory Pattern එකෙන් කරන්නේ occasion type එක අනුව අදාළ package object එක හදන එකයි. උදාහරණයක් ලෙස Birthday package එකකට guest bounds 15-80 වන අතර Wedding package එකකට 50-500 වෙනවා.

### Q6. How did you test the Factory Pattern?
- **English Answer:** In `CateringPackageFactoryTest.java`, we wrote 6 test cases verifying:
  1. Correct subclass instantiation for each valid string (`"Wedding"`, `"Birthday"`, etc.).
  2. Verification that guest boundaries are properly initialized.
  3. Safe fallback to `GeneralCateringPackage` when the input is null or an unknown occasion type, preventing `NullPointerException`.
- **Sinhala Explanation:** `CateringPackageFactoryTest` එකේදී අපි occasion types වලට අදාළ subclasses හරියට හැදෙනවද, guest limits හරියට set වෙනවද, සහ null හෝ වැරදි type එකක් දුන්නොත් crash නොවී `GeneralCateringPackage` එකට fallback වෙනවද කියලා test කළා.

### Q7. Explain the Strategy Pattern implemented in Catering Package Management.
- **English Answer:** The Strategy Pattern defines a family of interchangeable pricing algorithms adhering to the `PackagePricingStrategy` interface. We implemented four concrete strategies:
  1. `FixedPackagePricingStrategy`: Flat base package fee.
  2. `PerGuestPackagePricingStrategy`: Price per head with tiered bulk discounts (5% for 100+ guests, 10% for 200+ guests, 15% for 500+ guests).
  3. `OccasionTieredPricingStrategy`: Luxury/commercial multipliers (1.25x for Wedding, 1.30x for Gala, 0.95x for Corporate).
  4. `FoodValueCostingStrategy`: Sum of itemized dish costs plus a 25% catering preparation margin.
- **Sinhala Explanation:** Strategy Pattern එකෙන් package එකේ මිල ගණනය කරන algorithms වෙන වෙනම classes වලට වෙන් කරලා runtime එකේ මාරු කරන්න පුළුවන් කළා. Fixed pricing, Per-guest headcount with bulk discounts, Occasion multipliers, සහ Menu food value costing කියලා strategies 4 ක් තියෙනවා.

### Q8. What is Boundary Value Analysis (BVA), and how did you apply it to the Strategy Pattern?
- **English Answer:** Boundary Value Analysis tests values at the exact edges of input equivalence partitions where bugs most commonly occur. In `StrategyEdgeCaseTest.java`, we tested:
  - Immediately below and at the 5% discount tier: **99 guests** (0% discount) vs. **100 guests** (5% discount).
  - Immediately below and at the 10% discount tier: **199 guests** (5% discount) vs. **200 guests** (10% discount).
  - Immediately below and at the 15% discount tier: **499 guests** (10% discount) vs. **500 guests** (15% discount).
- **Sinhala Explanation:** Boundary Value Analysis කියන්නේ discount එක වෙනස් වෙන මායිම් අගයන් (edges) test කරන එකයි. 99 දී 0% discount වන අතර 100 දී හරියටම 5% discount එක ක්‍රියාත්මක වෙනවා. ඒ වගේම 199 සහ 200, 499 සහ 500 මායිම් වලදී algorithms හරියටම ක්‍රියාත්මක වෙනවද කියලා test කළා.

### Q9. How does your strategy handle zero or negative guest counts?
- **English Answer:** In `StrategyEdgeCaseTest.java`, we verified defensive clamping. If a user submits 0 or -50 guests, the strategy automatically clamps the calculation to a minimum of 1 guest rather than throwing an `ArithmeticException` (division by zero) or generating negative revenue.
- **Sinhala Explanation:** කවුරුහරි 0 ක් හෝ සෘණ අගයක් (-50) දුන්නොත් arithmetic error එකක් හෝ සෘණ ගණනක් එන්නේ නැතුව, සිස්ටම් එක ආරක්ෂිතව එය 1 guest හැටියට clamp කරලා ගණනය කරනවා.

### Q10. How did you test package menu item assignments (`PACKAGE_MENU_ITEM`)?
- **English Answer:** In `PackageMenuItemControllerTest.java`, we tested:
  - Assigning a dish to a package.
  - Querying assigned dishes for a package.
  - **Duplicate prevention:** Submitting the same dish twice returns an **HTTP 409 Conflict** error.
  - Removing a dish assignment returns **HTTP 204 No Content**.
- **Sinhala Explanation:** Package එකකට කෑම වර්ග (dishes) assign කිරීම test කළා. විශේෂයෙන්ම එකම dish එක දෙපාරක් දැම්මොත් සිස්ටම් එකෙන් HTTP 409 Conflict error එකක් දීලා duplicate වීම වළක්වන බව තහවුරු කළා.

### Q11. How does the frontend Catering Packages Page test work?
- **English Answer:** In `CateringPackagesPage.test.jsx`, we used React Testing Library to simulate user workflows:
  1. Renders the package list table and active badges.
  2. Submits an empty title form and asserts that `"Please enter the package title."` appears.
  3. Enters a negative price and asserts `"Price cannot be negative."`.
  4. Tests the dynamic pricing simulator by clicking `"Execute Strategy"` and asserting that `Rs. 161,500.00` and `"5% bulk discount applied"` are displayed.
  5. Verifies package deletion after user confirmation.
- **Sinhala Explanation:** Frontend test එකෙන් user කෙනෙක් screen එකේ කරන වැඩ (create, validate, error alerts, calculate simulator) test කළා. මිල සෘණ උනොත් error පෙන්වීම, සහ Execute Strategy click කළ විට `Rs. 161,500.00` සහ discount note එක screen එකේ පෙන්වීම තහවුරු කළා.

---

## Part 3: Backend & Security Testing

### Q12. How is authentication implemented and tested?
- **English Answer:** Authentication uses **PBKDF2** password hashing with salt and iteration counts (`pbkdf2$iterations$salt$hash`). In `PasswordUtilTest.java` and `AuthControllerTest.java`, we tested:
  - Hash generation format.
  - Constant-time password verification to prevent timing attacks.
  - Inactive staff accounts returning **HTTP 403 Forbidden**.
  - Invalid credentials returning **HTTP 401 Unauthorized**.
  - Seamless automatic upgrade of legacy plaintext passwords to PBKDF2 on successful login.
- **Sinhala Explanation:** අපි passwords වලට PBKDF2 hashing භාවිතා කරනවා. වැරදි password එකකට 401 error එකක්ද, deactive කරපු staff account එකකට 403 error එකක්ද ලැබෙන බව test කළා. පරණ plaintext passwords තිබුණොත් login වෙනකොටම auto hash වෙන විදියට test කරලා තියෙනවා.

### Q13. What is MockMvc and why is it used for controller testing?
- **English Answer:** `MockMvc` is part of Spring Test. It simulates HTTP requests (`GET`, `POST`, `PUT`, `DELETE`) and verifies HTTP responses, status codes, and JSON serialization without starting a physical HTTP server. This makes tests fast and reliable.
- **Sinhala Explanation:** MockMvc කියන්නේ Spring Test වල තියෙන tool එකක්. Server එක start නොකර HTTP requests යවලා status codes (200, 400, 404, 409) සහ JSON responses හරියට එනවද කියලා ඉතා වේගයෙන් test කරන්න පුළුවන්.

### Q14. What special configuration was needed for Java 25 with Mockito?
- **English Answer:** Java 25 restricts dynamic JVM agent loading. To ensure Mockito can generate proxies without errors, we configured:
  1. `-XX:+EnableDynamicAgentLoading` in `maven-surefire-plugin`.
  2. Registered `mock-maker-subclass` in `src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker`.
- **Sinhala Explanation:** Java 25 වල security වැඩි නිසා Mockito වලට dynamic agents load කරන්න දෙන්නේ නෑ. ඒ නිසා අපි Maven surefire එකට `-XX:+EnableDynamicAgentLoading` flag එක දුන්නා සහ `mock-maker-subclass` එක configure කළා.

---

## Part 4: Database & Integration Testing

### Q15. How did you test the database without risking existing data?
- **English Answer:** We followed a strict non-destructive database testing policy. Tests **NEVER** drop, truncate, or delete tables. In `DatabaseIntegrationTest.java`, we inspect database table existence and foreign keys via JDBC `DatabaseMetaData`. Furthermore, tests use `Assumptions.assumeTrue(isSqlServerOnline())` so that if SQL Server is not running, the tests skip safely without failing.
- **Sinhala Explanation:** Database testing වලදී අපි කවදාවත් tables drop හෝ truncate කළේ නෑ. ඒ වෙනුවට JDBC metadata මගින් tables සහ foreign keys තියෙනවද කියලා ආරක්ෂිතව check කළා. Database එක offline නම් test එක fail නොවී safely skip වෙනවා.

### Q16. Explain the Cross-Module Integration Test.
- **English Answer:** In `CrossModuleIntegrationTest.java`, we verified the complete end-to-end catering pipeline:
  1. Staff logs in (`AUTH`).
  2. Menu item is created (`MENU`).
  3. Catering package is created and dish assigned (`PACKAGE`).
  4. Strategy pattern calculates dynamic price (`PRICING`).
  5. Order is booked with that package (`ORDER`).
  6. Quotation is generated (`QUOTATION`).
  7. Advance deposit and final balance are recorded (`PAYMENT`).
- **Sinhala Explanation:** `CrossModuleIntegrationTest` එකෙන් මුළු සිස්ටම් එකේම complete workflow එක එක දිගට test කළා: Login -> Menu Dish -> Package -> Strategy Pricing -> Order -> Quotation -> Payment.

---

## Part 5: Additional Modules & Edge Cases

### Q17. How did you test Order Management?
- **English Answer:** In `OrderControllerTest.java`, we tested order creation with customer and package IDs, validated guest counts, verified inventory stock availability checks, and tested state transitions from `PENDING` to `CONFIRMED`.
- **Sinhala Explanation:** Order එකක් දැමීම, package එකේ guest limits චෙක් කිරීම, inventory stock එක තියෙනවද බැලීම, සහ status එක PENDING සිට CONFIRMED දක්වා මාරු වීම test කළා.

### Q18. How did you test Quotation and Payment Management?
- **English Answer:** In `QuotationControllerTest.java` and `PaymentControllerTest.java`, we tested quotation generation, customer data isolation, advance payment recording, and balance calculation. We also verified that payments cannot exceed the total quotation balance.
- **Sinhala Explanation:** Quotation හැදීම, advance payments සහ final settlements record කිරීම, සහ quotation එකේ ගානට වඩා වැඩිපුර pay කරන්න බැරි විදියට validation test කළා.

### Q19. How did you test Inventory Management?
- **English Answer:** In `InventoryItemControllerTest.java`, we tested stock additions, stock level queries, non-negative quantity validation, and reorder threshold alerts.
- **Sinhala Explanation:** Inventory බඩු ඇතුලත් කිරීම, stock ප්‍රමාණයන් බැලීම, සෘණ ප්‍රමාණ නොගැනීම, සහ minimum threshold එකට වඩා අඩු උනොත් alert වීම test කළා.

### Q20. How did you test Staff Management?
- **English Answer:** In `StaffControllerTest.java`, we tested staff profile creation, role assignment (`ADMIN`, `STAFF`, `DELIVERY`), duplicate email prevention, and account deactivation.
- **Sinhala Explanation:** Staff සාමාජිකයන් register කිරීම, roles දීම, duplicate email වැළැක්වීම සහ deactive කිරීම test කළා.

### Q21. How did you test Delivery Management?
- **English Answer:** In `DeliveryControllerTest.java`, we tested delivery dispatch creation for confirmed orders, driver assignment, destination address verification, and status progressions (`DISPATCHED -> IN_TRANSIT -> DELIVERED`).
- **Sinhala Explanation:** Confirm වූ orders වලට delivery dispatch හැදීම, driver කෙනෙක් assign කිරීම, ලිපිනයන් පරීක්ෂා කිරීම සහ status මාරු වීම test කළා.

### Q22. How did you test Route Security in React (`RequireRole`)?
- **English Answer:** In `RequireRole.test.jsx`, we verified that:
  - Unauthenticated visitors are automatically redirected to `/login`.
  - Users with matching roles (e.g. `STAFF`) are granted access to protected pages.
  - Users with non-permitted roles receive an **HTTP 403 Access Denied** notification.
- **Sinhala Explanation:** React වල protected routes test කළා. Login නොවී ආවොත් `/login` එකට redirect වෙනවා. Role එක ගැලපෙනවා නම් page එක පෙන්වන අතර role එක නැත්නම් Access Denied පෙන්වනවා.

### Q23. What is the purpose of `apiClients.test.js`?
- **English Answer:** It isolates and tests client-side HTTP request formatting—verifying that HTTP methods (`GET`, `POST`, `PUT`, `DELETE`), headers (`Content-Type: application/json`), query parameters, and JSON payloads sent to backend endpoints are well-formed.
- **Sinhala Explanation:** Frontend එකේ සිට backend එකට යන API calls වල URLs, headers, සහ JSON data හරියට හැදෙනවද කියලා test කරන්න තමයි `apiClients.test.js` පාවිච්චි කළේ.

### Q24. What is Equivalence Partitioning?
- **English Answer:** It is a black-box test design technique that divides input data into valid and invalid partitions. For example, for package prices:
  - Valid partition: Numbers >= 0 (e.g., 50000.0).
  - Invalid partition: Numbers < 0 (e.g., -500.0) or non-numeric strings.
- **Sinhala Explanation:** Inputs කොටස් වලට (partitions) බෙදලා test කිරීමයි. උදාහරණයක් ලෙස price එකක් සඳහා වලංගු (>= 0) සහ අවලංගු (< 0) අගයන් වෙන වෙනම test කිරීම.

### Q25. What were the 4 test failures encountered during initial runs, and how were they resolved?
- **English Answer:**
  1. *Header Title:* Test expected `Catering Package Management`, but UI was `Manage Catering Packages`. (Updated test string).
  2. *Placeholder:* Test expected `Imperial Royal Banquet`, but UI placeholder was `Royal Wedding Grand Package`. (Updated test string).
  3. *Currency Formatter:* Test expected `LKR 161,500`, but UI rendered `Rs. 161,500.00`. (Updated test string).
  4. *Mock Property:* Strategy test mock omitted `finalTotalPrice` during edit. (Restored property in mock).
  Importantly, **zero application business logic was altered**; only test fixtures were aligned to the real code.
- **Sinhala Explanation:** මුලින්ම run කරනකොට test assertions 4 ක් fail වුණා text formatting වෙනස්කම් නිසා (Manage Catering Packages, placeholder text, සහ Rs. currency format). අපි කිසිම application code එකක් වෙනස් නොකර, test එකේ assertions හරියට align කළා. ඉන්පසු සියලු tests pass වුණා.

### Q26. Can your tests run without an active internet connection?
- **English Answer:** Yes. All unit tests, MockMvc controller tests, and React Testing Library frontend tests execute completely offline in local memory using mocks and JSDOM.
- **Sinhala Explanation:** ඔව්. සියලුම unit tests සහ mock tests offline local memory එකේ run වෙනවා. Internet connection එකක් අවශ්‍ය නෑ.

### Q27. What is Regression Testing, and how is it supported in this project?
- **English Answer:** Regression testing ensures that new features or bug fixes do not break existing working functionality. With `npm test`, the complete suite of 135 tests can be re-run in under 15 seconds after any code modification to guarantee zero regressions.
- **Sinhala Explanation:** අලුතින් code එකක් වෙනස් කළ විට පරණ වැඩ කරපු දේවල් කැඩුනද කියලා බලන එක regression testing. අපේ `npm test` command එකෙන් තත්පර 15 ක් ඇතුලත tests 135 ම run කරලා කිසිවක් කැඩී නැති බව තහවුරු කරගන්න පුළුවන්.

### Q28. What is the difference between Unit Testing and Integration Testing?
- **English Answer:** Unit testing verifies isolated classes in memory using mocks (e.g., testing `PackageFactory` or `PasswordUtil`). Integration testing verifies how multiple components or tiers interact together (e.g., `CrossModuleIntegrationTest` testing Auth -> Package -> Order -> Payment, or JDBC metadata testing).
- **Sinhala Explanation:** Unit testing වලදී class එකක් තනියම isolate කරලා mock කරලා test කරනවා. Integration testing වලදී components කිහිපයක් එකතු වෙලා එකට වැඩ කරන හැටි test කරනවා.

### Q29. How do you defend against SQL Injection in the backend?
- **English Answer:** In the JDBC DAOs, all database queries use `PreparedStatement` with parameterized queries (`?` placeholders) rather than raw string concatenation. This ensures all user input is treated strictly as data literals.
- **Sinhala Explanation:** අපි JDBC වලදී string concatenation වෙනුවට `PreparedStatement` සහ parameterized queries (`?`) පාවිච්චි කරන නිසා SQL injection ප්‍රහාර වලින් 100% ආරක්ෂා වෙනවා.

### Q30. If an examiner asks: "What will happen if you add a new occasion package type tomorrow?", what is your answer?
- **English Answer:** Because the system follows the **Open/Closed Principle** via the **Factory Pattern**, I only need to create a new subclass extending `CateringPackage` (e.g. `FestivalCateringPackage`) and add its case to `PackageFactory`. The controllers, services, database access code, and UI will seamlessly work with the new type without requiring modifications to existing logic.
- **Sinhala Explanation:** අපේ package subsystem එක Factory Pattern එක නිසා Open/Closed Principle එකට අනුකූලයි. මට තියෙන්නේ අලුත් subclass එකක් හදලා Factory එකට register කරන්න විතරයි. Controllers හෝ DAOs වෙනස් කරන්න ඕනේ නෑ.
