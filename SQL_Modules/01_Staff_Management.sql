-- ==========================================================================
-- 01_Staff_Management.sql
-- Module  : Staff management
-- Project : Aurelia Catering System          Database : AureliaCatering2 (SQL Server / T-SQL)
-- Course  : IT2140 Database Design and Development - DDD Assignment 02
-- Student : Devindi E.M.C   Student ID : IT25102098
-- ==========================================================================
-- Staff records and their roles.
--
-- This module's tables : STAFF
--
-- HOW TO RUN
--   Open in SQL Server Management Studio and press Execute (F5).
--   The file is standalone: it creates the database if needed, creates the tables it needs
--   only when they are missing, and loads sample rows only when they are missing.
--   It can be run any number of times, and it works next to the other 6 module files.
--   The demo blocks in Parts 5 and 6 run inside a transaction that is rolled back,
--   so the sample data is never changed.
--
-- PARTS IN THIS FILE
--   Part 1: EER Diagram & Database Design
--   Part 2: Table Creation
--   Part 3: Sample Data
--   Part 4: SQL Queries   (SELECT, JOIN, Aggregation, GROUP BY / HAVING, Subquery)
--   Part 5: Stored Procedure
--   Part 6: Trigger
--
-- PRESENTING (3 minutes): keep the EER diagram open in another tab; show Part 1 first,
--   then run each part in turn. Parts marked "supporting" belong to other modules - skip them.
-- ==========================================================================

-- ---------------------------------------------------------------------------
-- Setup (not one of the 6 parts): create and select the database
-- ---------------------------------------------------------------------------
IF DB_ID(N'AureliaCatering2') IS NULL
    CREATE DATABASE AureliaCatering2;
GO

USE AureliaCatering2;
GO

-- ==========================================================================
-- Part 1: EER Diagram & Database Design
-- ==========================================================================
-- Entity      : STAFF  (supertype)
-- Attributes  : StaffID (PK), Name, Phone, Email (unique), Role
--
-- ISA         : STAFF is specialised by job role into six subclasses:
--                 ADMIN, OPERATIONS_SUPERVISOR, KITCHEN_STAFF,
--                 DELIVERY_STAFF, FINANCE_OFFICER, INVENTORY_COORDINATOR
--               Total (every staff member has a role) and disjoint (exactly one role).
-- ISA mapping : SINGLE-TABLE mapping. All subclasses are stored in the one STAFF table and the
--               column Role is the discriminator (a CHECK limits it to the six values).
--               The subclasses have no attributes of their own, so separate subclass tables
--               would only add extra joins.
--
-- Relational schema:
--     STAFF (StaffID PK, Name, Phone, Email UNIQUE, Role)
--
-- Primary key : StaffID
-- Foreign keys: none leave this table (STAFF is a parent table). The PK/FK connections are the
--               foreign keys of other tables that point to STAFF.StaffID:
--     STAFF 1 --- 0..N ORDER                (ORDER.PreparedByStaffID)
--     STAFF 1 --- 0..N ORDER_REVIEW         (ORDER_REVIEW.StaffID)
--     STAFF 1 --- 0..N ORDER_REQUEST        (ORDER_REQUEST.ReviewedByStaffID)
--     STAFF 1 --- 0..N ORDER_STATUS_HISTORY (ORDER_STATUS_HISTORY.ChangedByStaffID)
--     STAFF 1 --- 0..N DELIVERY             (DELIVERY.StaffID - delivery staff only)
--     STAFF 1 --- 1    STAFF_ACCOUNT        (login account)
--
--     +------------------------------+
--     | STAFF                        |
--     |------------------------------|
--     | StaffID (PK)                 |   Role = discriminator
--     | Name, Phone, Email (UQ)      |   ( ADMIN | OPERATIONS_SUPERVISOR | KITCHEN_STAFF |
--     | Role                         |     DELIVERY_STAFF | FINANCE_OFFICER | INVENTORY_COORDINATOR )
--     +------------------------------+

-- ==========================================================================
-- Part 2: Table Creation
-- Each table is created only if it does not exist yet.
-- ==========================================================================
-- Part 2B: this module's tables

IF OBJECT_ID(N'dbo.STAFF', N'U') IS NULL
CREATE TABLE dbo.STAFF (
                           StaffID INT          NOT NULL,
                           Name    VARCHAR(100) NOT NULL,
                           Phone   VARCHAR(20)  NOT NULL,
                           Email   VARCHAR(100) NOT NULL,
                           Role    VARCHAR(50)  NOT NULL,
                           CONSTRAINT PK_STAFF       PRIMARY KEY (StaffID),
                           CONSTRAINT UQ_STAFF_EMAIL UNIQUE (Email),
                           CONSTRAINT CK_STAFF_PHONE CHECK (Phone NOT LIKE '%[^0-9+ ]%' AND LEN(Phone) >= 9),
                           CONSTRAINT CK_STAFF_EMAIL CHECK (Email LIKE '%_@_%._%'),
                           CONSTRAINT CK_STAFF_ROLE  CHECK (Role IN ('ADMIN', 'OPERATIONS_SUPERVISOR', 'KITCHEN_STAFF',
                                                                     'DELIVERY_STAFF', 'FINANCE_OFFICER', 'INVENTORY_COORDINATOR'))
);
GO

-- ==========================================================================
-- Part 3: Sample Data
-- Each row is inserted only if its key is not there yet (WHERE NOT EXISTS), so the file can be run twice.
-- ==========================================================================
-- Part 3B: this module's rows

INSERT INTO dbo.STAFF (StaffID, Name, Phone, Email, Role)
SELECT v.StaffID, v.Name, v.Phone, v.Email, v.Role
FROM (VALUES
          (1, 'Nadeesha Perera', '0770000001', 'admin@aurelia.com', 'ADMIN'),
          (2, 'Ruwan Silva', '0770000002', 'ops@aurelia.com', 'OPERATIONS_SUPERVISOR'),
          (3, 'Tharushi Fernando', '0770000003', 'kitchen@aurelia.com', 'KITCHEN_STAFF'),
          (4, 'Sunil Perera', '0770000004', 'sunil@aurelia.com', 'KITCHEN_STAFF'),
          (5, 'Kasun Wijesinghe', '0770000005', 'delivery@aurelia.com', 'DELIVERY_STAFF'),
          (6, 'Amal Fernando', '0770000006', 'amal@aurelia.com', 'DELIVERY_STAFF'),
          (7, 'Dinithi Jayawardena','0770000007', 'finance@aurelia.com', 'FINANCE_OFFICER'),
          (8, 'Ravindu Jayasinghe', '0770000008', 'inventory@aurelia.com', 'INVENTORY_COORDINATOR')
     ) AS v (StaffID, Name, Phone, Email, Role)
WHERE NOT EXISTS (SELECT 1 FROM dbo.STAFF t WHERE t.StaffID = v.StaffID);
GO

-- ==========================================================================
-- Part 4: SQL Queries
-- Five queries: SELECT, JOIN, Aggregation, GROUP BY / HAVING, Subquery
-- ==========================================================================
-- Query 1: SELECT - list every staff member, sorted by role then name
SELECT StaffID, Name, Role, Email
FROM dbo.STAFF
ORDER BY Role, Name;

-- Query 2: JOIN - pairs of colleagues who share the same role (STAFF joined to itself)
SELECT a.Name AS StaffMember, b.Name AS Colleague, a.Role
FROM dbo.STAFF a
         INNER JOIN dbo.STAFF b ON a.Role = b.Role AND a.StaffID < b.StaffID
ORDER BY a.Role;

-- Query 3: Aggregation - how many staff and how many different roles
SELECT COUNT(*)             AS TotalStaff,
       COUNT(DISTINCT Role) AS DifferentRoles
FROM dbo.STAFF;

-- Query 4: GROUP BY / HAVING - roles that have two or more staff
SELECT Role, COUNT(*) AS StaffCount
FROM dbo.STAFF
GROUP BY Role
HAVING COUNT(*) >= 2;

-- Query 5: Subquery - staff whose role has more members than the average role
SELECT s.StaffID, s.Name, s.Role
FROM dbo.STAFF s
WHERE s.Role IN (SELECT Role
                 FROM dbo.STAFF
                 GROUP BY Role
                 HAVING COUNT(*) > (SELECT AVG(r.cnt * 1.0)
                                    FROM (SELECT COUNT(*) AS cnt FROM dbo.STAFF GROUP BY Role) r))
ORDER BY s.Role, s.Name;
GO

-- ==========================================================================
-- Part 5: Stored Procedure
-- ==========================================================================
-- Feature: add a new staff member. Checks for a duplicate email, creates the next StaffID
-- and returns it. The CHECK constraints on STAFF reject a bad role, phone or email.
CREATE OR ALTER PROCEDURE dbo.AddStaff
    @Name       VARCHAR(100),
    @Phone      VARCHAR(20),
    @Email      VARCHAR(100),
    @Role       VARCHAR(50),
    @NewStaffID INT OUTPUT
    AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF EXISTS (SELECT 1 FROM dbo.STAFF WHERE Email = @Email)
BEGIN
        THROW 50101, 'A staff member with this email already exists.', 1;
END;

BEGIN TRANSACTION;
SELECT @NewStaffID = ISNULL(MAX(StaffID), 0) + 1 FROM dbo.STAFF WITH (UPDLOCK, HOLDLOCK);

INSERT INTO dbo.STAFF (StaffID, Name, Phone, Email, Role)
VALUES (@NewStaffID, @Name, @Phone, LOWER(@Email), @Role);
COMMIT TRANSACTION;
END;
GO

-- Demo: add a kitchen staff member, show the new row, then undo it (ROLLBACK)
BEGIN TRANSACTION;
    DECLARE @NewID INT;
EXEC dbo.AddStaff @Name = 'Chamara Bandara', @Phone = '0770000009',
                      @Email = 'Chamara@Aurelia.com', @Role = 'KITCHEN_STAFF',
                      @NewStaffID = @NewID OUTPUT;
SELECT * FROM dbo.STAFF WHERE StaffID = @NewID;
ROLLBACK TRANSACTION;

-- Error case (remove the comment marks to try it): the email already exists
-- DECLARE @X INT;
-- EXEC dbo.AddStaff 'Test Person', '0770000010', 'admin@aurelia.com', 'ADMIN', @X OUTPUT;
GO

-- ==========================================================================
-- Part 6: Trigger
-- ==========================================================================
-- Feature: the system must always keep at least one ADMIN.
-- After any UPDATE or DELETE on STAFF, if no ADMIN is left the change is cancelled.
CREATE OR ALTER TRIGGER dbo.trg_Staff_KeepOneAdmin
ON dbo.STAFF
AFTER UPDATE, DELETE
    AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.STAFF WHERE Role = 'ADMIN')
BEGIN
ROLLBACK TRANSACTION;
THROW 50102, 'At least one ADMIN must remain. The change was cancelled.', 1;
END;
END;
GO

-- Demo: try to change the only ADMIN into another role -> the trigger cancels it
BEGIN TRANSACTION;
BEGIN TRY
UPDATE dbo.STAFF SET Role = 'OPERATIONS_SUPERVISOR' WHERE StaffID = 1;
END TRY
BEGIN CATCH
SELECT ERROR_NUMBER() AS ErrorNo, ERROR_MESSAGE() AS TriggerMessage;
END CATCH;
IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

SELECT StaffID, Name, Role FROM dbo.STAFF WHERE Role = 'ADMIN';   -- the admin is still there
GO

-- End of file
