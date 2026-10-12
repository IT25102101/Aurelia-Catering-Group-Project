# Test Environment Setup Guide
## Project: Aurelia Web-Based Catering Management System

---

## 1. Prerequisites & Tooling Requirements

To execute the complete testing suite on a fresh clone of the Aurelia Catering Management System, the following dependencies and runtimes are required:

| Component | Required Version | Verified Local Path | Purpose |
| :--- | :--- | :--- | :--- |
| **Java JDK** | OpenJDK 25 (or JDK 21 LTS) | `C:\Program Files\Java\jdk-25.0.4` | Backend compilation and test execution |
| **Maven** | Apache Maven 3.9+ | Bundled wrapper / IntelliJ plugin lib | Build tool and test lifecycle manager |
| **Node.js** | Node.js v18+ (v20+ Recommended) | `C:\Program Files\nodejs\node.exe` | Frontend JavaScript runtime |
| **npm** | npm v9+ | `C:\Program Files\nodejs\npm.cmd` | Package manager |
| **Database** | Microsoft SQL Server 2022 | `MSSQL$SQLEXPRESS` (Port 1433) | Relational database (Optional for unit tests) |

---

## 2. Backend Environment Configuration

### 2.1 Java 25 Mockito Configuration
Java 25 enforces strict encapsulation and restricts dynamic agent loading by default. To allow Mockito byte-buddy proxies without runtime errors, the repository contains:
1. `backend/src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker` containing:
   ```text
   mock-maker-subclass
   ```
2. `backend/pom.xml` configured with:
   ```xml
   <plugin>
       <groupId>org.apache.maven.plugins</groupId>
       <artifactId>maven-surefire-plugin</artifactId>
       <version>3.2.5</version>
       <configuration>
           <argLine>-XX:+EnableDynamicAgentLoading</argLine>
       </configuration>
   </plugin>
   ```

### 2.2 Maven Wrapper (`backend/mvnw.cmd`)
To eliminate manual `JAVA_HOME` configuration across varied terminals, a custom Windows wrapper script is provided in `backend/mvnw.cmd`:
```batch
@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-25.0.4"
set "PATH=%JAVA_HOME%\bin;%PATH%"
"D:\IntelliJ IDEA 2026.2.3\plugins\maven-plugin\lib\maven3\bin\mvn.cmd" %*
```

---

## 3. Frontend Environment Configuration

### 3.1 Vitest & React Testing Library Dependencies
The `frontend/` directory includes the following testing packages installed in `package.json`:
- `vitest@5.0.3`: High-performance Vite-native test runner.
- `@testing-library/react@16.3.3`: DOM element queries and user event simulation.
- `@testing-library/jest-dom@7.0.1`: Custom DOM matchers (`toBeInTheDocument()`, etc.).
- `jsdom@30.1.2`: Pure JavaScript browser environment simulation.

### 3.2 Vite Configuration (`frontend/vite.config.js`)
Configured to support Vitest globals and browser DOM mocking:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
```

---

## 4. Step-by-Step Setup & Verification Procedure

### Step 1: Clone Repository
```bash
git clone <repo-url> Aurelia-Catering-Group-Project
cd Aurelia-Catering-Group-Project
```

### Step 2: Install Frontend Dependencies
```bash
npm install
cd frontend
npm install
cd ..
```

### Step 3: Run Complete Automated Test Suite
From the repository root:
```bash
npm test
```
This executes:
1. `npm run test:backend` (Compiles Java sources and runs all 102 backend JUnit tests via Maven).
2. `npm run test:frontend` (Runs all 33 React component and client tests via Vitest).

---

## 5. Troubleshooting & Common Setup Issues

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| `PSSecurityException: File npm.ps1 cannot be loaded` | Windows PowerShell Execution Policy blocks `.ps1` | Use `cmd.exe /c "npm test"` or `npm.cmd test`. |
| `MockitoException: Could not initialize plugin mock-maker` | Java 25 bytecode restriction | Ensure `org.mockito.plugins.MockMaker` contains `mock-maker-subclass`. |
| `DatabaseIntegrationTest: Skipped` | SQL Server instance offline | Expected behavior. Tests check `Assumptions.assumeTrue(isSqlServerOnline())` and skip safely if offline. |
