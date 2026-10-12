/* ==============================================================================
   AURELIA CATERING MANAGEMENT SYSTEM - SAFE AUTHENTICATION SETUP
   Target Database: AureliaCatering2
   
   PURPOSE:
     Creates the missing authentication tables (STAFF_ACCOUNT, CUSTOMER,
     and CUSTOMER_ACCOUNT) and inserts account credentials for existing staff
     and customers without dropping or modifying the existing STAFF table.

   HOW TO RUN:
     1. Open SQL Server Management Studio (SSMS).
     2. Connect to your local SQL Server instance.
     3. Open this file (File > Open > File...) or paste its contents into a Query window.
     4. Press Execute (F5).
   ============================================================================== */

USE AureliaCatering2;
GO

-- -----------------------------------------------------------------------------
-- 1. Create CUSTOMER table (if not exists)
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.CUSTOMER', N'U') IS NULL
BEGIN
    PRINT 'Creating table CUSTOMER...';
    CREATE TABLE dbo.CUSTOMER (
        CustomerID INT          NOT NULL,
        Name       VARCHAR(100) NOT NULL,
        Phone      VARCHAR(20)  NOT NULL,
        Email      VARCHAR(100) NOT NULL,
        CONSTRAINT PK_CUSTOMER       PRIMARY KEY (CustomerID),
        CONSTRAINT UQ_CUSTOMER_EMAIL UNIQUE (Email),
        CONSTRAINT CK_CUSTOMER_PHONE CHECK (Phone NOT LIKE '%[^0-9+ ]%' AND LEN(Phone) >= 9),
        CONSTRAINT CK_CUSTOMER_EMAIL CHECK (Email LIKE '%_@_%._%')
    );

    PRINT 'Inserting sample customer records...';
    INSERT INTO dbo.CUSTOMER (CustomerID, Name, Phone, Email) VALUES
    (1, 'Kavinda Silva',        '0771234567', 'kavinda@gmail.com'),
    (2, 'Anuki Perera',         '0712345678', 'anuki@gmail.com'),
    (3, 'Dhanushka Fernando',   '0763456789', 'dhanushka@gmail.com'),
    (4, 'Malsha Jayawardena',   '0784567890', 'malsha@gmail.com'),
    (5, 'Sahan Wickramasinghe', '0725678901', 'sahan@gmail.com'),
    (6, 'Hiruni De Silva',      '0756789012', 'hiruni@gmail.com');
END
ELSE
BEGIN
    PRINT 'Table CUSTOMER already exists. Skipping creation.';
END
GO

-- -----------------------------------------------------------------------------
-- 2. Create CUSTOMER_ACCOUNT table (if not exists)
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.CUSTOMER_ACCOUNT', N'U') IS NULL
BEGIN
    PRINT 'Creating table CUSTOMER_ACCOUNT...';
    CREATE TABLE dbo.CUSTOMER_ACCOUNT (
        AccountID     INT          NOT NULL,
        CustomerID    INT          NOT NULL,
        PasswordHash  VARCHAR(255) NOT NULL,
        AccountStatus VARCHAR(20)  NOT NULL CONSTRAINT DF_CUSTOMER_ACCOUNT_Status DEFAULT ('Active'),
        CreatedDate   DATETIME     NOT NULL CONSTRAINT DF_CUSTOMER_ACCOUNT_Created DEFAULT (GETDATE()),
        LastLoginDate DATETIME     NULL,
        CONSTRAINT PK_CUSTOMER_ACCOUNT          PRIMARY KEY (AccountID),
        CONSTRAINT UQ_CUSTOMER_ACCOUNT_CUSTOMER UNIQUE (CustomerID),
        CONSTRAINT CK_CUSTOMER_ACCOUNT_STATUS   CHECK (AccountStatus IN ('Active', 'Inactive', 'Locked')),
        CONSTRAINT FK_CUSTOMER_ACCOUNT_CUSTOMER FOREIGN KEY (CustomerID) REFERENCES dbo.CUSTOMER (CustomerID)
    );

    PRINT 'Inserting sample customer accounts (password: password123)...';
    INSERT INTO dbo.CUSTOMER_ACCOUNT (AccountID, CustomerID, PasswordHash) VALUES
    (1, 1, 'pbkdf2$120000$FF12LVXfjHouNXxPhTSFSQ==$yhAbFZPcXe5+KidAwiULYtoj9/Qwoyjp/8VyYaxWA30='),
    (2, 2, 'pbkdf2$120000$ui5lodKVMIp2mBUcnuRTJA==$C1ISXkLR7TKXu+Oy7N8KQ/GHr+pSmwuAgopac2QzCN8='),
    (3, 3, 'pbkdf2$120000$GN8n+ltG8xzTD6LOwXN/dw==$GwEUkRX/PWKaVW11rNuJhJ2KDzE8QZ9pxkapJ8mqKn0='),
    (4, 4, 'pbkdf2$120000$aRjEF29mZGXqLwT4UrNbOA==$iGeK1Gg50auqziso74YMGunNK1EnUED5c+IOWcBwXao='),
    (5, 5, 'pbkdf2$120000$C19SYCZ4SIN7wFJsHniB8w==$AqLlEo8d3pjpD3e6YqGSNczG+wuxpq+vqviSz1pAXVQ='),
    (6, 6, 'pbkdf2$120000$7r7lr3LCihfuc21GK/n5KQ==$iSkOl2KRQG6zakuUcaQn9JWlENgUp3n6Ae+Cmj7m9XI=');
END
ELSE
BEGIN
    PRINT 'Table CUSTOMER_ACCOUNT already exists. Skipping creation.';
END
GO

-- -----------------------------------------------------------------------------
-- 3. Create STAFF_ACCOUNT table (if not exists)
--    Links directly to the existing 8 rows in dbo.STAFF
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.STAFF_ACCOUNT', N'U') IS NULL
BEGIN
    PRINT 'Creating table STAFF_ACCOUNT...';
    CREATE TABLE dbo.STAFF_ACCOUNT (
        AccountID     INT          NOT NULL,
        StaffID       INT          NOT NULL,
        Username      VARCHAR(50)  NOT NULL,
        PasswordHash  VARCHAR(255) NOT NULL,
        AccountStatus VARCHAR(20)  NOT NULL CONSTRAINT DF_STAFF_ACCOUNT_Status DEFAULT ('Active'),
        CreatedDate   DATETIME     NOT NULL CONSTRAINT DF_STAFF_ACCOUNT_Created DEFAULT (GETDATE()),
        LastLoginDate DATETIME     NULL,
        CONSTRAINT PK_STAFF_ACCOUNT          PRIMARY KEY (AccountID),
        CONSTRAINT UQ_STAFF_ACCOUNT_STAFF    UNIQUE (StaffID),
        CONSTRAINT UQ_STAFF_ACCOUNT_USERNAME UNIQUE (Username),
        CONSTRAINT CK_STAFF_ACCOUNT_STATUS   CHECK (AccountStatus IN ('Active', 'Inactive', 'Locked')),
        CONSTRAINT FK_STAFF_ACCOUNT_STAFF    FOREIGN KEY (StaffID) REFERENCES dbo.STAFF (StaffID)
    );

    PRINT 'Inserting staff accounts for existing 8 staff members (password: password123)...';
    INSERT INTO dbo.STAFF_ACCOUNT (AccountID, StaffID, Username, PasswordHash) VALUES
    (1, 1, 'admin',             'pbkdf2$120000$kD0vqCljHaO+WdKIb7ZOMg==$bpD1xZQttB7U921hL8ToMViAFtGhx2jSLXMCr3I/NqM='),
    (2, 2, 'ops.supervisor',    'pbkdf2$120000$/e5+dAVCnsBcswy6ZLNVJg==$Ah839G1NBXAO1ROVoEhAp7JMrd5ARGe//51d53bQ5Po='),
    (3, 3, 'kitchen.tharushi',  'pbkdf2$120000$V9153aHsG/U6+shbWNYlNQ==$yCiRMBDaOryIrngV2b5bKHxwU4jb4QHJj+VnxdcTYNk='),
    (4, 4, 'kitchen.sunil',     'pbkdf2$120000$0ilcBYK9+5VZ4QlLO0B4yQ==$x/3kPXAOU4JrRuOMLLYEXkVx5r8Be1zjDIVA2krbmjU='),
    (5, 5, 'delivery.kasun',    'pbkdf2$120000$0Q10RwJqL56WMoxzXtVihA==$/qh01PnLcmoMXHVUgoP/Tbb5pbO/dnHKgAESqaANHP0='),
    (6, 6, 'delivery.amal',     'pbkdf2$120000$F/heOXLT1jp0F/fFvdMSnQ==$CMtdyzmz/aFpt7dqIOMp2m2vOIai7eQvl68lfwUgx+0='),
    (7, 7, 'finance',           'pbkdf2$120000$M44VnebljiHsz3UPdkrqZQ==$OMgcgA+iMjxZlKP42kS3DxDrewtVkFbDCApybYd5l8I='),
    (8, 8, 'inventory',         'pbkdf2$120000$nyhE1AFrm4H+h0yE+cCYMA==$cupR2Ypf91niYn1MtFXMiLeqfdQFIjpsKHZS7svOrbE=');
END
ELSE
BEGIN
    PRINT 'Table STAFF_ACCOUNT already exists. Skipping creation.';
END
GO

-- -----------------------------------------------------------------------------
-- 4. Verification queries
-- -----------------------------------------------------------------------------
PRINT '----------------------------------------';
PRINT 'Setup Complete! Current Record Counts:';
SELECT 'STAFF' AS [Table], COUNT(*) AS [Rows] FROM dbo.STAFF
UNION ALL
SELECT 'STAFF_ACCOUNT', COUNT(*) FROM dbo.STAFF_ACCOUNT
UNION ALL
SELECT 'CUSTOMER', COUNT(*) FROM dbo.CUSTOMER
UNION ALL
SELECT 'CUSTOMER_ACCOUNT', COUNT(*) FROM dbo.CUSTOMER_ACCOUNT;
GO
