-- ==========================================================================
-- 05_Event_Management.sql
-- Module  : Event management
-- Project : Aurelia Catering System          Database : AureliaCatering2 (SQL Server / T-SQL)
-- Course  : IT2140 Database Design and Development - DDD Assignment 02
-- Student : ______________________________   Student ID : ______________
-- ==========================================================================
-- The event (date, place, guests, type) that each order is catering.
--
-- This module's tables : EVENT
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
-- Entities    : EVENT (the occasion being catered: date, place, guests, type)
--               Supporting (other modules): ORDER, CUSTOMER, STAFF, CateringPackage
--
-- Relationship: ORDER 1 --- 1 EVENT. Each order has exactly one event and each event belongs to one
--               order (EVENT.OrderID is a foreign key with a UNIQUE constraint). EVENT depends on its
--               order for its existence, so it behaves like a weak entity identified through ORDER.
-- ISA         : EVENT is specialised by EventType into Wedding, Birthday, Corporate and Gala events.
-- ISA mapping : SINGLE-TABLE mapping with EventType as the discriminator. The event types share
--               the same attributes, so no separate subclass tables are needed.
--
-- Relational schema:
--     EVENT (EventID PK, OrderID FK UNIQUE, EventDate, Location, GuestCount CHECK > 0,
--            EventType, StartTime)
--
-- Primary key : EventID
-- Foreign key : EVENT.OrderID -> ORDER.OrderID   (ORDER itself points to CUSTOMER, CateringPackage, STAFF)
--
--     CUSTOMER 1---< ORDER 1---1 EVENT          CateringPackage 1---< ORDER

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

IF OBJECT_ID(N'dbo.EVENT', N'U') IS NULL
CREATE TABLE dbo.[EVENT] (
    EventID    INT          NOT NULL,
    OrderID    INT          NOT NULL,
    EventDate  DATE         NOT NULL,
    Location   VARCHAR(200) NOT NULL,
    GuestCount INT          NOT NULL,
    EventType  VARCHAR(50)  NOT NULL,
    StartTime  TIME         NULL,        -- NEW (the booking form collects a start time)
    CONSTRAINT PK_EVENT             PRIMARY KEY (EventID),
    CONSTRAINT UQ_EVENT_ORDER       UNIQUE (OrderID),            -- one event per order
    CONSTRAINT CK_EVENT_GUEST_COUNT CHECK (GuestCount > 0),
    CONSTRAINT FK_EVENT_ORDER       FOREIGN KEY (OrderID) REFERENCES dbo.[ORDER] (OrderID)
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
    (4, 'Sunil Perera', '0770000004', 'sunil@aurelia.com', 'KITCHEN_STAFF')
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
    (7, 1, 3, '2026-09-18', 'Preparing', 'Tea and coffee station at the entrance', 4, '2026-09-22', 1)
) AS v (OrderID, CustomerID, PackageID, OrderDate, Status, SpecialRequests, PreparedByStaffID, CustomerConfirmedDate, InventoryDeducted)
WHERE NOT EXISTS (SELECT 1 FROM dbo.[ORDER] t WHERE t.OrderID = v.OrderID);
GO

-- Part 3B: this module's rows

INSERT INTO dbo.[EVENT] (EventID, OrderID, EventDate, Location, GuestCount, EventType, StartTime)
SELECT v.EventID, v.OrderID, v.EventDate, v.Location, v.GuestCount, v.EventType, v.StartTime
FROM (VALUES
    (1, 1, '2026-09-12', 'Grand Ballroom, Colombo 03', 150, 'Wedding', '18:00'),
    (2, 2, '2026-10-18', 'Private residence, Nugegoda', 40, 'Birthday', '12:30'),
    (3, 3, '2026-10-22', 'Business Park Hall, Colombo 02', 80, 'Corporate', '10:00'),
    (4, 4, '2026-11-15', 'Seaside Hotel Ballroom, Colombo 03', 200, 'Gala', '19:00'),
    (5, 5, '2026-10-30', 'Private residence, Kandy', 30, 'Birthday', '13:00'),
    (6, 6, '2026-10-05', 'Garden Venue, Negombo', 120, 'Wedding', '17:00'),
    (7, 7, '2026-10-04', 'Conference Hall, Colombo 05', 60, 'Corporate', '09:00')
) AS v (EventID, OrderID, EventDate, Location, GuestCount, EventType, StartTime)
WHERE NOT EXISTS (SELECT 1 FROM dbo.[EVENT] t WHERE t.EventID = v.EventID);
GO

-- ==========================================================================
-- Part 4: SQL Queries
-- Five queries: SELECT, JOIN, Aggregation, GROUP BY / HAVING, Subquery
-- ==========================================================================
-- Query 1: SELECT - events from 1 October 2026 onwards, soonest first
SELECT EventID, OrderID, EventDate, Location, GuestCount
FROM dbo.[EVENT]
WHERE EventDate >= '2026-10-01'
ORDER BY EventDate;

-- Query 2: JOIN - each event with its customer and the order status (EVENT + ORDER + CUSTOMER)
SELECT e.EventID, e.EventDate, e.EventType, e.Location, c.Name AS Customer, o.Status
FROM dbo.[EVENT] e
INNER JOIN dbo.[ORDER] o  ON o.OrderID    = e.OrderID
INNER JOIN dbo.CUSTOMER c ON c.CustomerID = o.CustomerID
ORDER BY e.EventDate;

-- Query 3: Aggregation - guest numbers across all events
SELECT COUNT(*)        AS TotalEvents,
       SUM(GuestCount) AS TotalGuests,
       AVG(GuestCount * 1.0) AS AverageGuests,
       MAX(GuestCount) AS LargestEvent
FROM dbo.[EVENT];

-- Query 4: GROUP BY / HAVING - event types that have 100 or more guests in total
SELECT EventType, COUNT(*) AS Events, SUM(GuestCount) AS TotalGuests
FROM dbo.[EVENT]
GROUP BY EventType
HAVING SUM(GuestCount) >= 100;

-- Query 5: Subquery - events with more guests than the average event
SELECT EventID, OrderID, EventType, GuestCount
FROM dbo.[EVENT]
WHERE GuestCount > (SELECT AVG(GuestCount) FROM dbo.[EVENT])
ORDER BY GuestCount DESC;
GO

-- ==========================================================================
-- Part 5: Stored Procedure
-- ==========================================================================
-- Feature: reschedule an event to a new date (and optionally a new place).
CREATE OR ALTER PROCEDURE dbo.RescheduleEvent
    @OrderID      INT,
    @NewEventDate DATE,
    @NewLocation  VARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.[EVENT] WHERE OrderID = @OrderID)
    BEGIN
        THROW 50501, 'No event was found for this order.', 1;
    END;
    IF @NewEventDate < CAST(GETDATE() AS DATE)
    BEGIN
        THROW 50502, 'The new event date cannot be in the past.', 1;
    END;

    UPDATE dbo.[EVENT]
    SET EventDate = @NewEventDate,
        Location  = ISNULL(@NewLocation, Location)
    WHERE OrderID = @OrderID;

    SELECT EventID, OrderID, EventDate, Location, GuestCount, EventType
    FROM dbo.[EVENT]
    WHERE OrderID = @OrderID;
END;
GO

-- Demo: move the event of order 2 (still waiting for payment) 30 days from today, then undo it
BEGIN TRANSACTION;
    DECLARE @NewDate DATE = DATEADD(DAY, 30, CAST(GETDATE() AS DATE));
    EXEC dbo.RescheduleEvent @OrderID = 2, @NewEventDate = @NewDate, @NewLocation = 'Garden Venue, Nugegoda';
ROLLBACK TRANSACTION;

-- Error case (remove the comment marks to try it): a date in the past
-- EXEC dbo.RescheduleEvent @OrderID = 2, @NewEventDate = '2020-01-01';
GO

-- ==========================================================================
-- Part 6: Trigger
-- ==========================================================================
-- Feature: once the kitchen has started (status Preparing, Ready for Delivery or Delivered)
-- the event date and place are fixed. A later change is cancelled.
CREATE OR ALTER TRIGGER dbo.trg_Event_BlockLateChange
ON dbo.[EVENT]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF (UPDATE(EventDate) OR UPDATE(Location))
       AND EXISTS (SELECT 1
                   FROM inserted i
                   INNER JOIN deleted d  ON d.EventID  = i.EventID
                   INNER JOIN dbo.[ORDER] o ON o.OrderID = i.OrderID
                   WHERE (i.EventDate <> d.EventDate OR i.Location <> d.Location)
                     AND o.Status IN ('Preparing', 'Ready for Delivery', 'Delivered'))
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50503, 'The event date or place cannot change once the order is being prepared or delivered.', 1;
    END;
END;
GO

-- Demo: order 7 is 'Preparing', so changing its event date is blocked
BEGIN TRANSACTION;
BEGIN TRY
    UPDATE dbo.[EVENT] SET EventDate = '2026-12-24' WHERE OrderID = 7;
END TRY
BEGIN CATCH
    SELECT ERROR_NUMBER() AS ErrorNo, ERROR_MESSAGE() AS TriggerMessage;
END CATCH;
IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

SELECT OrderID, EventDate FROM dbo.[EVENT] WHERE OrderID = 7;   -- date unchanged
GO

-- End of file
