-- ==========================================================================
-- 06_Delivery_Management.sql
-- Module  : Delivery management
-- Project : Aurelia Catering System          Database : AureliaCatering2 (SQL Server / T-SQL)
-- Course  : IT2140 Database Design and Development - DDD Assignment 02
-- Student : ______________________________   Student ID : ______________
-- ==========================================================================
-- Delivery of the prepared food to the event venue.
--
-- This module's tables : DELIVERY
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
-- Entities    : DELIVERY (the trip that takes an order's food to the venue)
--               Supporting (other modules): ORDER, STAFF, CUSTOMER, CateringPackage
--
-- Relationships:
--     ORDER 1 --- 0..1 DELIVERY   (an order has at most one delivery; DELIVERY.OrderID is UNIQUE)
--     STAFF 1 --- 0..N DELIVERY   (a delivery staff member handles many deliveries)
-- ISA         : the person doing the delivery belongs to the STAFF subclass DELIVERY_STAFF
--               (STAFF is specialised by job role - see the Staff module).
-- ISA mapping : SINGLE-TABLE mapping: the subclass is stored in STAFF with Role = 'DELIVERY_STAFF'.
--               DELIVERY.StaffID is a foreign key to the STAFF supertype, so the stored procedure
--               in Part 5 checks that the chosen person really has the DELIVERY_STAFF role.
--
-- Relational schema:
--     DELIVERY (DeliveryID PK, OrderID FK UNIQUE, StaffID FK, DeliveryDate, DeliveryStatus, Location)
--     DeliveryStatus CHECK: Pending | Assigned | Out for Delivery | Delivered | Cancelled
--
-- Primary key : DeliveryID
-- Foreign keys: DELIVERY.OrderID -> ORDER.OrderID ; DELIVERY.StaffID -> STAFF.StaffID
--
--     ORDER 1---0..1 DELIVERY >---1 STAFF (DELIVERY_STAFF)
--
-- Note: orders 8 to 11 are extra sample orders added only in this file, so that the delivery
--       queries have enough rows to show. (In the full system the delivery location comes from
--       the EVENT table; here it is passed to the procedure so this file stays standalone.)

-- ==========================================================================
-- Part 2: Table Creation
-- Each table is created only if it does not exist yet.
-- ==========================================================================
-- Part 2A: supporting tables owned by other modules (needed for the foreign keys) - skip when presenting

IF OBJECT_ID(N'dbo.CUSTOMER', N'U') IS NULL
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
GO

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

IF OBJECT_ID(N'dbo.CateringPackage', N'U') IS NULL
CREATE TABLE dbo.CateringPackage (
    PackageID   INT           NOT NULL,
    PackageName VARCHAR(100)  NOT NULL,
    Description VARCHAR(500)  NULL,
    Price       DECIMAL(10,2) NOT NULL,
    PackageType VARCHAR(30)   NOT NULL CONSTRAINT DF_CateringPackage_Type DEFAULT ('General'),  -- ISA discriminator
    CONSTRAINT PK_CateringPackage       PRIMARY KEY (PackageID),
    CONSTRAINT UQ_CateringPackage_Name  UNIQUE (PackageName),
    CONSTRAINT CK_CateringPackage_Price CHECK (Price >= 0),
    CONSTRAINT CK_CateringPackage_Type  CHECK (PackageType IN ('Wedding', 'Birthday', 'Corporate', 'Gala', 'General'))
);
GO

IF OBJECT_ID(N'dbo.ORDER', N'U') IS NULL
CREATE TABLE dbo.[ORDER] (
    OrderID               INT           NOT NULL,
    CustomerID            INT           NOT NULL,
    PackageID             INT           NOT NULL,
    OrderDate             DATE          NOT NULL,
    Status                VARCHAR(50)   NOT NULL CONSTRAINT DF_ORDER_Status DEFAULT ('Pending Verification'),
    SpecialRequests       VARCHAR(1000) NULL,
    PreparedByStaffID     INT           NULL,
    CustomerConfirmedDate DATE          NULL,
    InventoryDeducted     BIT           NOT NULL CONSTRAINT DF_ORDER_InvDeducted DEFAULT (0),  -- NEW
    CONSTRAINT PK_ORDER PRIMARY KEY (OrderID),
    CONSTRAINT CK_ORDER_STATUS CHECK (Status IN (
        'Pending Verification', 'Under Staff Review', 'Quotation Ready',
        'Customer Confirmation Pending', 'Payment Pending', 'Confirmed',
        'Preparing', 'Ready for Delivery', 'Delivered', 'Rejected', 'Cancelled')),
    CONSTRAINT FK_ORDER_CUSTOMER       FOREIGN KEY (CustomerID)        REFERENCES dbo.CUSTOMER (CustomerID),
    CONSTRAINT FK_ORDER_PACKAGE        FOREIGN KEY (PackageID)         REFERENCES dbo.CateringPackage (PackageID),
    CONSTRAINT FK_ORDER_PREPARED_STAFF FOREIGN KEY (PreparedByStaffID) REFERENCES dbo.STAFF (StaffID)
);
GO

-- Part 2B: this module's tables

IF OBJECT_ID(N'dbo.DELIVERY', N'U') IS NULL
CREATE TABLE dbo.DELIVERY (
    DeliveryID     INT          NOT NULL,
    OrderID        INT          NOT NULL,
    StaffID        INT          NOT NULL,
    DeliveryDate   DATE         NOT NULL,
    DeliveryStatus VARCHAR(30)  NOT NULL,
    Location       VARCHAR(200) NOT NULL,
    CONSTRAINT PK_DELIVERY        PRIMARY KEY (DeliveryID),
    CONSTRAINT UQ_DELIVERY_ORDER  UNIQUE (OrderID),              -- one delivery per order
    CONSTRAINT CK_DELIVERY_STATUS CHECK (DeliveryStatus IN ('Pending', 'Assigned', 'Out for Delivery', 'Delivered', 'Cancelled')),
    CONSTRAINT FK_DELIVERY_ORDER  FOREIGN KEY (OrderID) REFERENCES dbo.[ORDER] (OrderID),
    CONSTRAINT FK_DELIVERY_STAFF  FOREIGN KEY (StaffID) REFERENCES dbo.STAFF (StaffID)
);
GO

-- ==========================================================================
-- Part 3: Sample Data
-- Each row is inserted only if its key is not there yet (WHERE NOT EXISTS), so the file can be run twice.
-- ==========================================================================
-- Part 3A: supporting rows from other modules - skip when presenting

INSERT INTO dbo.CUSTOMER (CustomerID, Name, Phone, Email)
SELECT v.CustomerID, v.Name, v.Phone, v.Email
FROM (VALUES
    (1, 'Nimal Perera', '0771234567', 'nimal@gmail.com'),
    (2, 'Kamal Silva', '0712345678', 'kamal@gmail.com'),
    (3, 'Ishara Perera', '0775556666', 'customer@aurelia.com'),
    (4, 'Dilini Fernando', '0768887777', 'dilini@gmail.com'),
    (5, 'Sahan Jayawardena', '0702223344', 'sahan@gmail.com'),
    (6, 'Thilini Wickramasinghe', '0719990000', 'thilini@gmail.com')
) AS v (CustomerID, Name, Phone, Email)
WHERE NOT EXISTS (SELECT 1 FROM dbo.CUSTOMER t WHERE t.CustomerID = v.CustomerID);
GO

INSERT INTO dbo.STAFF (StaffID, Name, Phone, Email, Role)
SELECT v.StaffID, v.Name, v.Phone, v.Email, v.Role
FROM (VALUES
    (3, 'Tharushi Fernando', '0770000003', 'kitchen@aurelia.com', 'KITCHEN_STAFF'),
    (4, 'Sunil Perera', '0770000004', 'sunil@aurelia.com', 'KITCHEN_STAFF'),
    (5, 'Kasun Wijesinghe', '0770000005', 'delivery@aurelia.com', 'DELIVERY_STAFF'),
    (6, 'Amal Fernando', '0770000006', 'amal@aurelia.com', 'DELIVERY_STAFF')
) AS v (StaffID, Name, Phone, Email, Role)
WHERE NOT EXISTS (SELECT 1 FROM dbo.STAFF t WHERE t.StaffID = v.StaffID);
GO

INSERT INTO dbo.CateringPackage (PackageID, PackageName, Description, Price, PackageType)
SELECT v.PackageID, v.PackageName, v.Description, v.Price, v.PackageType
FROM (VALUES
    (1, 'Wedding Package', 'Complete wedding catering package', 50000.00, 'Wedding'),
    (2, 'Birthday Package', 'Birthday event catering package', 30000.00, 'Birthday'),
    (3, 'Corporate Package', 'Corporate lunch and conference catering',40000.00, 'Corporate'),
    (4, 'Gala Package', 'Formal gala dinner catering package', 75000.00, 'Gala')
) AS v (PackageID, PackageName, Description, Price, PackageType)
WHERE NOT EXISTS (SELECT 1 FROM dbo.CateringPackage t WHERE t.PackageID = v.PackageID);
GO

INSERT INTO dbo.[ORDER] (OrderID, CustomerID, PackageID, OrderDate, Status, SpecialRequests, PreparedByStaffID, CustomerConfirmedDate, InventoryDeducted)
SELECT v.OrderID, v.CustomerID, v.PackageID, v.OrderDate, v.Status, v.SpecialRequests, v.PreparedByStaffID, v.CustomerConfirmedDate, v.InventoryDeducted
FROM (VALUES
    (1, 1, 1, '2026-08-10', 'Delivered', 'Vegetarian options for 20 guests', 3, '2026-08-18', 1),
    (2, 2, 2, '2026-09-20', 'Payment Pending', 'Chocolate dessert for the birthday child', NULL, '2026-09-25', 0),
    (3, 3, 3, '2026-09-25', 'Quotation Ready', 'Buffet layout near the projector area', NULL, NULL, 0),
    (4, 4, 4, '2026-09-27', 'Under Staff Review', NULL, NULL, NULL, 0),
    (5, 5, 2, '2026-09-30', 'Pending Verification', NULL, NULL, NULL, 0),
    (6, 6, 1, '2026-09-05', 'Cancelled', NULL, NULL, NULL, 0),
    (7, 1, 3, '2026-09-18', 'Preparing', 'Tea and coffee station at the entrance', 4, '2026-09-22', 1),
    (8, 5, 2, '2026-09-29', 'Confirmed', 'Pickup point at the main gate', NULL, '2026-09-30', 0),
    (9, 4, 2, '2026-08-05', 'Delivered', NULL, 3, '2026-08-08', 1),
    (10, 6, 3, '2026-08-12', 'Delivered', NULL, 4, '2026-08-15', 1),
    (11, 3, 1, '2026-08-20', 'Delivered', 'Extra serving staff requested', 3, '2026-08-23', 1)
) AS v (OrderID, CustomerID, PackageID, OrderDate, Status, SpecialRequests, PreparedByStaffID, CustomerConfirmedDate, InventoryDeducted)
WHERE NOT EXISTS (SELECT 1 FROM dbo.[ORDER] t WHERE t.OrderID = v.OrderID);
GO

-- Part 3B: this module's rows

INSERT INTO dbo.DELIVERY (DeliveryID, OrderID, StaffID, DeliveryDate, DeliveryStatus, Location)
SELECT v.DeliveryID, v.OrderID, v.StaffID, v.DeliveryDate, v.DeliveryStatus, v.Location
FROM (VALUES
    (1, 1, 5, '2026-09-12', 'Delivered', 'Grand Ballroom, Colombo 03'),
    (2, 7, 6, '2026-10-04', 'Assigned', 'Conference Hall, Colombo 05'),
    (3, 9, 5, '2026-08-22', 'Delivered', 'Community Hall, Kandy'),
    (4, 10, 6, '2026-08-29', 'Delivered', 'Garden Hall, Negombo'),
    (5, 11, 5, '2026-09-06', 'Delivered', 'Business Park Hall, Colombo 02')
) AS v (DeliveryID, OrderID, StaffID, DeliveryDate, DeliveryStatus, Location)
WHERE NOT EXISTS (SELECT 1 FROM dbo.DELIVERY t WHERE t.DeliveryID = v.DeliveryID);
GO

-- ==========================================================================
-- Part 4: SQL Queries
-- Five queries: SELECT, JOIN, Aggregation, GROUP BY / HAVING, Subquery
-- ==========================================================================
-- Query 1: SELECT - deliveries that are not finished yet
SELECT DeliveryID, OrderID, DeliveryDate, DeliveryStatus, Location
FROM dbo.DELIVERY
WHERE DeliveryStatus NOT IN ('Delivered', 'Cancelled')
ORDER BY DeliveryDate;

-- Query 2: JOIN - each delivery with the delivery staff member and the customer (DELIVERY + STAFF + ORDER + CUSTOMER)
SELECT d.DeliveryID, d.DeliveryDate, d.DeliveryStatus,
       s.Name AS DeliveryStaff, c.Name AS Customer, d.Location
FROM dbo.DELIVERY d
INNER JOIN dbo.STAFF s    ON s.StaffID    = d.StaffID
INNER JOIN dbo.[ORDER] o  ON o.OrderID    = d.OrderID
INNER JOIN dbo.CUSTOMER c ON c.CustomerID = o.CustomerID
ORDER BY d.DeliveryDate;

-- Query 3: Aggregation - delivery summary
SELECT COUNT(*)          AS TotalDeliveries,
       MIN(DeliveryDate) AS FirstDelivery,
       MAX(DeliveryDate) AS LastDelivery,
       SUM(CASE WHEN DeliveryStatus = 'Delivered' THEN 1 ELSE 0 END) AS CompletedDeliveries
FROM dbo.DELIVERY;

-- Query 4: GROUP BY / HAVING - delivery staff who handled three or more deliveries
SELECT s.StaffID, s.Name, COUNT(*) AS DeliveryCount
FROM dbo.DELIVERY d
INNER JOIN dbo.STAFF s ON s.StaffID = d.StaffID
GROUP BY s.StaffID, s.Name
HAVING COUNT(*) >= 3;

-- Query 5: Subquery - delivery staff who have no unfinished delivery (free to be assigned)
SELECT StaffID, Name
FROM dbo.STAFF
WHERE Role = 'DELIVERY_STAFF'
  AND StaffID NOT IN (SELECT StaffID
                      FROM dbo.DELIVERY
                      WHERE DeliveryStatus NOT IN ('Delivered', 'Cancelled'));
GO

-- ==========================================================================
-- Part 5: Stored Procedure
-- ==========================================================================
-- Feature: assign a delivery staff member to an order that is ready to go out.
CREATE OR ALTER PROCEDURE dbo.AssignDeliveryStaff
    @OrderID      INT,
    @StaffID      INT,
    @DeliveryDate DATE,
    @Location     VARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Status VARCHAR(50);
    DECLARE @Role   VARCHAR(50);
    DECLARE @NewID  INT;

    SELECT @Status = Status FROM dbo.[ORDER] WHERE OrderID = @OrderID;
    SELECT @Role   = Role   FROM dbo.STAFF   WHERE StaffID = @StaffID;

    IF @Status IS NULL
    BEGIN
        THROW 50601, 'Order not found.', 1;
    END;
    IF @Role IS NULL OR @Role <> 'DELIVERY_STAFF'
    BEGIN
        THROW 50602, 'The selected staff member is not delivery staff.', 1;
    END;
    IF @Status NOT IN ('Confirmed', 'Preparing', 'Ready for Delivery')
    BEGIN
        THROW 50603, 'Delivery can only be assigned to Confirmed, Preparing or Ready for Delivery orders.', 1;
    END;
    IF EXISTS (SELECT 1 FROM dbo.DELIVERY WHERE OrderID = @OrderID)
    BEGIN
        THROW 50604, 'A delivery is already assigned to this order.', 1;
    END;
    IF @Location IS NULL OR LEN(LTRIM(RTRIM(@Location))) = 0
    BEGIN
        THROW 50605, 'A delivery location is required.', 1;
    END;

    BEGIN TRANSACTION;
        SELECT @NewID = ISNULL(MAX(DeliveryID), 0) + 1 FROM dbo.DELIVERY WITH (UPDLOCK, HOLDLOCK);

        INSERT INTO dbo.DELIVERY (DeliveryID, OrderID, StaffID, DeliveryDate, DeliveryStatus, Location)
        VALUES (@NewID, @OrderID, @StaffID, @DeliveryDate, 'Assigned', @Location);
    COMMIT TRANSACTION;

    SELECT * FROM dbo.DELIVERY WHERE DeliveryID = @NewID;
END;
GO

-- Demo 1: order 8 is 'Confirmed' and has no delivery yet -> assign delivery staff 5, then undo it
BEGIN TRANSACTION;
    EXEC dbo.AssignDeliveryStaff @OrderID = 8, @StaffID = 5, @DeliveryDate = '2026-10-20',
                                 @Location = 'Private residence, Kandy';
ROLLBACK TRANSACTION;

-- Demo 2: staff 3 is kitchen staff, not delivery staff -> refused
BEGIN TRY
    EXEC dbo.AssignDeliveryStaff @OrderID = 8, @StaffID = 3, @DeliveryDate = '2026-10-20',
                                 @Location = 'Private residence, Kandy';
END TRY
BEGIN CATCH
    SELECT ERROR_NUMBER() AS ErrorNo, ERROR_MESSAGE() AS ProcedureMessage;
END CATCH;
GO

-- ==========================================================================
-- Part 6: Trigger
-- ==========================================================================
-- Feature: when a delivery is marked 'Delivered', its order automatically becomes 'Delivered'
-- (only if the order was 'Ready for Delivery').
CREATE OR ALTER TRIGGER dbo.trg_Delivery_UpdateOrder
ON dbo.DELIVERY
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(DeliveryStatus)
    BEGIN
        UPDATE o
        SET o.Status = 'Delivered'
        FROM dbo.[ORDER] o
        INNER JOIN inserted i ON i.OrderID    = o.OrderID
        INNER JOIN deleted d  ON d.DeliveryID = i.DeliveryID
        WHERE i.DeliveryStatus = 'Delivered'
          AND d.DeliveryStatus <> 'Delivered'
          AND o.Status = 'Ready for Delivery';
    END;
END;
GO

-- Demo: order 7 becomes 'Ready for Delivery'; the driver marks delivery 2 as Delivered -> the order follows
BEGIN TRANSACTION;
    UPDATE dbo.[ORDER] SET Status = 'Ready for Delivery' WHERE OrderID = 7;
    SELECT OrderID, Status AS OrderStatusBefore FROM dbo.[ORDER] WHERE OrderID = 7;

    UPDATE dbo.DELIVERY SET DeliveryStatus = 'Delivered' WHERE DeliveryID = 2;   -- fires the trigger

    SELECT OrderID, Status AS OrderStatusAfter FROM dbo.[ORDER] WHERE OrderID = 7;
ROLLBACK TRANSACTION;
GO

-- End of file
