-- ==========================================================================
-- 04_Order_Management.sql
-- Module  : Order management
-- Project : Aurelia Catering System          Database : AureliaCatering2 (SQL Server / T-SQL)
-- Course  : IT2140 Database Design and Development - DDD Assignment 02
-- Student : ______________________________   Student ID : ______________
-- ==========================================================================
-- Customer orders, the menu items in them, status history, staff reviews and change requests.
--
-- This module's tables : ORDER, ORDER_MENU_ITEM, ORDER_STATUS_HISTORY, ORDER_REVIEW, ORDER_REQUEST
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
-- Entities    : ORDER (the customer's booking), ORDER_MENU_ITEM, ORDER_STATUS_HISTORY,
--               ORDER_REVIEW (staff review), ORDER_REQUEST (cancellation / rescheduling request)
--               Supporting (other modules): CUSTOMER, STAFF, MenuItem, CateringPackage
--
-- Relationships:
--     CUSTOMER        1 --- N ORDER                  (a customer places many orders)
--     CateringPackage 1 --- N ORDER                  (an order is booked for one package)
--     STAFF           1 --- N ORDER                  (PreparedByStaffID, optional)
--     ORDER           M --- N MenuItem               -> ORDER_MENU_ITEM (Quantity)
--     ORDER           1 --- N ORDER_STATUS_HISTORY   (every status the order went through)
--     ORDER           1 --- N ORDER_REVIEW           (staff review decisions)
--     ORDER           1 --- N ORDER_REQUEST          (cancellation / rescheduling requests)
--     STAFF           1 --- N ORDER_REVIEW, ORDER_REQUEST (reviewed by), ORDER_STATUS_HISTORY (changed by)
--
-- ISA         : ORDER_REQUEST is specialised into Cancellation and Rescheduling requests.
-- ISA mapping : SINGLE-TABLE mapping with RequestType as the discriminator (CHECK: Cancellation |
--               Rescheduling). Both kinds share all attributes; only RequestedEventDate is used by
--               rescheduling requests (it stays NULL for cancellations).
--               ORDER.Status (11 values) is a life-cycle state, not a subclass, so it is a plain column.
--
-- Relational schema:
--     ORDER (OrderID PK, CustomerID FK, PackageID FK, OrderDate, Status, SpecialRequests,
--            PreparedByStaffID FK, CustomerConfirmedDate, InventoryDeducted)
--     ORDER_MENU_ITEM (OrderID PK/FK, MenuItemID PK/FK, Quantity)
--     ORDER_STATUS_HISTORY (StatusHistoryID PK, OrderID FK, Status, ChangedDate, ChangedByStaffID FK)
--     ORDER_REVIEW (OrderReviewID PK, OrderID FK, StaffID FK, ReviewDate, ReviewStatus, Comments)
--     ORDER_REQUEST (RequestID PK, OrderID FK, RequestType, RequestDate, Reason, RequestedEventDate,
--                    RequestStatus, ReviewedByStaffID FK, ReviewDate, Response)
--
-- Primary keys: OrderID, StatusHistoryID, OrderReviewID, RequestID ; ORDER_MENU_ITEM (OrderID, MenuItemID)
-- Foreign keys: ORDER.CustomerID -> CUSTOMER ; ORDER.PackageID -> CateringPackage ;
--               ORDER.PreparedByStaffID -> STAFF ; the other four tables -> ORDER, STAFF, MenuItem
--
--     CUSTOMER 1---< ORDER >---1 CateringPackage            ORDER 1---< ORDER_STATUS_HISTORY
--                      |                                    ORDER 1---< ORDER_REVIEW
--                      +---< ORDER_MENU_ITEM >---1 MenuItem ORDER 1---< ORDER_REQUEST

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

IF OBJECT_ID(N'dbo.MenuItem', N'U') IS NULL
CREATE TABLE dbo.MenuItem (
    MenuItemID  INT           NOT NULL,
    ItemName    VARCHAR(100)  NOT NULL,
    Description VARCHAR(500)  NULL,
    Price       DECIMAL(10,2) NOT NULL,
    Category    VARCHAR(50)   NOT NULL,
    CONSTRAINT PK_MenuItem       PRIMARY KEY (MenuItemID),
    CONSTRAINT UQ_MenuItem_Name  UNIQUE (ItemName),
    CONSTRAINT CK_MenuItem_Price CHECK (Price >= 0)
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

-- Part 2B: this module's tables

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

IF OBJECT_ID(N'dbo.ORDER_MENU_ITEM', N'U') IS NULL
CREATE TABLE dbo.ORDER_MENU_ITEM (
    OrderID    INT NOT NULL,
    MenuItemID INT NOT NULL,
    Quantity   INT NOT NULL,
    CONSTRAINT PK_ORDER_MENU_ITEM          PRIMARY KEY (OrderID, MenuItemID),
    CONSTRAINT CK_ORDER_MENU_ITEM_QUANTITY CHECK (Quantity > 0),
    CONSTRAINT FK_ORDER_MENU_ITEM_ORDER    FOREIGN KEY (OrderID)    REFERENCES dbo.[ORDER] (OrderID),
    CONSTRAINT FK_ORDER_MENU_ITEM_MENU     FOREIGN KEY (MenuItemID) REFERENCES dbo.MenuItem (MenuItemID)
);
GO

IF OBJECT_ID(N'dbo.ORDER_STATUS_HISTORY', N'U') IS NULL
CREATE TABLE dbo.ORDER_STATUS_HISTORY (
    StatusHistoryID  INT         NOT NULL,
    OrderID          INT         NOT NULL,
    Status           VARCHAR(50) NOT NULL,
    ChangedDate      DATETIME    NOT NULL CONSTRAINT DF_ORDER_HISTORY_Changed DEFAULT (GETDATE()),
    ChangedByStaffID INT         NULL,
    CONSTRAINT PK_ORDER_STATUS_HISTORY       PRIMARY KEY (StatusHistoryID),
    CONSTRAINT FK_ORDER_STATUS_HISTORY_ORDER FOREIGN KEY (OrderID)          REFERENCES dbo.[ORDER] (OrderID),
    CONSTRAINT FK_ORDER_STATUS_HISTORY_STAFF FOREIGN KEY (ChangedByStaffID) REFERENCES dbo.STAFF (StaffID)
);
GO

IF OBJECT_ID(N'dbo.ORDER_REVIEW', N'U') IS NULL
CREATE TABLE dbo.ORDER_REVIEW (
    OrderReviewID INT           NOT NULL,
    OrderID       INT           NOT NULL,
    StaffID       INT           NOT NULL,
    ReviewDate    DATETIME      NOT NULL CONSTRAINT DF_ORDER_REVIEW_Date DEFAULT (GETDATE()),
    ReviewStatus  VARCHAR(30)   NOT NULL,
    Comments      VARCHAR(1000) NULL,
    CONSTRAINT PK_ORDER_REVIEW        PRIMARY KEY (OrderReviewID),
    CONSTRAINT CK_ORDER_REVIEW_STATUS CHECK (ReviewStatus IN ('Approved', 'Rejected', 'Changes Requested')),
    CONSTRAINT FK_ORDER_REVIEW_ORDER  FOREIGN KEY (OrderID) REFERENCES dbo.[ORDER] (OrderID),
    CONSTRAINT FK_ORDER_REVIEW_STAFF  FOREIGN KEY (StaffID) REFERENCES dbo.STAFF (StaffID)
);
GO

IF OBJECT_ID(N'dbo.ORDER_REQUEST', N'U') IS NULL
CREATE TABLE dbo.ORDER_REQUEST (
    RequestID          INT           NOT NULL,
    OrderID            INT           NOT NULL,
    RequestType        VARCHAR(20)   NOT NULL,
    RequestDate        DATETIME      NOT NULL CONSTRAINT DF_ORDER_REQUEST_Date DEFAULT (GETDATE()),
    Reason             VARCHAR(1000) NULL,
    RequestedEventDate DATE          NULL,
    RequestStatus      VARCHAR(20)   NOT NULL CONSTRAINT DF_ORDER_REQUEST_Status DEFAULT ('Pending'),
    ReviewedByStaffID  INT           NULL,
    ReviewDate         DATETIME      NULL,
    Response           VARCHAR(1000) NULL,
    CONSTRAINT PK_ORDER_REQUEST        PRIMARY KEY (RequestID),
    CONSTRAINT CK_ORDER_REQUEST_TYPE   CHECK (RequestType IN ('Cancellation', 'Rescheduling')),
    CONSTRAINT CK_ORDER_REQUEST_STATUS CHECK (RequestStatus IN ('Pending', 'Approved', 'Rejected')),
    CONSTRAINT FK_ORDER_REQUEST_ORDER  FOREIGN KEY (OrderID)           REFERENCES dbo.[ORDER] (OrderID),
    CONSTRAINT FK_ORDER_REQUEST_STAFF  FOREIGN KEY (ReviewedByStaffID) REFERENCES dbo.STAFF (StaffID)
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
    (2, 'Ruwan Silva', '0770000002', 'ops@aurelia.com', 'OPERATIONS_SUPERVISOR'),
    (3, 'Tharushi Fernando', '0770000003', 'kitchen@aurelia.com', 'KITCHEN_STAFF'),
    (4, 'Sunil Perera', '0770000004', 'sunil@aurelia.com', 'KITCHEN_STAFF'),
    (5, 'Kasun Wijesinghe', '0770000005', 'delivery@aurelia.com', 'DELIVERY_STAFF')
) AS v (StaffID, Name, Phone, Email, Role)
WHERE NOT EXISTS (SELECT 1 FROM dbo.STAFF t WHERE t.StaffID = v.StaffID);
GO

INSERT INTO dbo.MenuItem (MenuItemID, ItemName, Description, Price, Category)
SELECT v.MenuItemID, v.ItemName, v.Description, v.Price, v.Category
FROM (VALUES
    (1, 'Chicken Rice', 'Rice served with chicken', 800.00, 'Main'),
    (2, 'Vegetable Salad', 'Fresh vegetable salad', 400.00, 'Salad'),
    (3, 'Fruit Juice', 'Fresh mixed fruit juice', 300.00, 'Beverage'),
    (4, 'Grilled Salmon', 'Grilled salmon fillet with vegetables',2200.00,'Main'),
    (5, 'Roast Lamb', 'Slow roasted lamb', 2800.00,'Main'),
    (6, 'Chocolate Fondant', 'Warm chocolate dessert with cream', 900.00,'Dessert'),
    (7, 'Watalappan', 'Traditional coconut custard pudding', 450.00,'Dessert'),
    (8, 'Iced Coffee', 'Chilled coffee', 350.00,'Beverage')
) AS v (MenuItemID, ItemName, Description, Price, Category)
WHERE NOT EXISTS (SELECT 1 FROM dbo.MenuItem t WHERE t.MenuItemID = v.MenuItemID);
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

-- Part 3B: this module's rows

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

INSERT INTO dbo.ORDER_MENU_ITEM (OrderID, MenuItemID, Quantity)
SELECT v.OrderID, v.MenuItemID, v.Quantity
FROM (VALUES
    (1, 1, 150),
    (1, 2, 150),
    (1, 3, 150),
    (2, 6, 40),
    (2, 3, 40),
    (2, 1, 40),
    (3, 1, 80),
    (3, 2, 80),
    (3, 8, 80),
    (4, 4, 200),
    (4, 5, 100),
    (4, 6, 200),
    (5, 1, 30),
    (5, 7, 30),
    (6, 1, 120),
    (6, 3, 120),
    (7, 1, 60),
    (7, 2, 60),
    (7, 4, 20)
) AS v (OrderID, MenuItemID, Quantity)
WHERE NOT EXISTS (SELECT 1 FROM dbo.ORDER_MENU_ITEM t WHERE t.OrderID = v.OrderID AND t.MenuItemID = v.MenuItemID);
GO

INSERT INTO dbo.ORDER_STATUS_HISTORY (StatusHistoryID, OrderID, Status, ChangedDate, ChangedByStaffID)
SELECT v.StatusHistoryID, v.OrderID, v.Status, v.ChangedDate, v.ChangedByStaffID
FROM (VALUES
    (1, 1, 'Pending Verification', '2026-08-10T09:00:00', NULL),
    (2, 1, 'Under Staff Review', '2026-08-11T10:00:00', 2),
    (3, 1, 'Quotation Ready', '2026-08-12T11:00:00', 2),
    (4, 1, 'Customer Confirmation Pending', '2026-08-17T09:30:00', NULL),
    (5, 1, 'Payment Pending', '2026-08-18T14:00:00', NULL),
    (6, 1, 'Confirmed', '2026-09-05T14:15:00', NULL),
    (7, 1, 'Preparing', '2026-09-08T08:00:00', 3),
    (8, 1, 'Ready for Delivery', '2026-09-11T16:00:00', 3),
    (9, 1, 'Delivered', '2026-09-12T19:00:00', 5),
    (10, 2, 'Pending Verification', '2026-09-20T09:00:00', NULL),
    (11, 2, 'Under Staff Review', '2026-09-21T10:00:00', 2),
    (12, 2, 'Quotation Ready', '2026-09-22T11:00:00', 2),
    (13, 2, 'Customer Confirmation Pending', '2026-09-24T09:30:00', NULL),
    (14, 2, 'Payment Pending', '2026-09-25T14:00:00', NULL),
    (15, 3, 'Pending Verification', '2026-09-25T09:00:00', NULL),
    (16, 3, 'Under Staff Review', '2026-09-26T10:00:00', 2),
    (17, 3, 'Quotation Ready', '2026-09-27T11:00:00', 2),
    (18, 4, 'Pending Verification', '2026-09-27T09:00:00', NULL),
    (19, 4, 'Under Staff Review', '2026-09-28T10:00:00', 2),
    (20, 5, 'Pending Verification', '2026-09-30T09:00:00', NULL),
    (21, 6, 'Pending Verification', '2026-09-05T09:00:00', NULL),
    (22, 6, 'Under Staff Review', '2026-09-06T10:00:00', 2),
    (23, 6, 'Cancelled', '2026-09-09T12:00:00', 2),
    (24, 7, 'Pending Verification', '2026-09-18T09:00:00', NULL),
    (25, 7, 'Under Staff Review', '2026-09-19T10:00:00', 2),
    (26, 7, 'Quotation Ready', '2026-09-20T11:00:00', 2),
    (27, 7, 'Customer Confirmation Pending', '2026-09-21T09:30:00', NULL),
    (28, 7, 'Payment Pending', '2026-09-22T14:00:00', NULL),
    (29, 7, 'Confirmed', '2026-09-30T16:20:00', NULL),
    (30, 7, 'Preparing', '2026-10-01T08:00:00', 4)
) AS v (StatusHistoryID, OrderID, Status, ChangedDate, ChangedByStaffID)
WHERE NOT EXISTS (SELECT 1 FROM dbo.ORDER_STATUS_HISTORY t WHERE t.StatusHistoryID = v.StatusHistoryID);
GO

INSERT INTO dbo.ORDER_REVIEW (OrderReviewID, OrderID, StaffID, ReviewDate, ReviewStatus, Comments)
SELECT v.OrderReviewID, v.OrderID, v.StaffID, v.ReviewDate, v.ReviewStatus, v.Comments
FROM (VALUES
    (1, 1, 2, '2026-08-11T00:00:00', 'Approved', 'Menu and guest count verified'),
    (2, 2, 2, '2026-09-21T00:00:00', 'Approved', 'Details are complete'),
    (3, 3, 2, '2026-09-26T00:00:00', 'Approved', 'Venue confirmed with the customer'),
    (4, 4, 2, '2026-09-28T00:00:00', 'Changes Requested', 'Please confirm the final guest count and venue access time'),
    (5, 7, 2, '2026-09-19T00:00:00', 'Approved', 'Details are complete')
) AS v (OrderReviewID, OrderID, StaffID, ReviewDate, ReviewStatus, Comments)
WHERE NOT EXISTS (SELECT 1 FROM dbo.ORDER_REVIEW t WHERE t.OrderReviewID = v.OrderReviewID);
GO

INSERT INTO dbo.ORDER_REQUEST (RequestID, OrderID, RequestType, RequestDate, Reason, RequestedEventDate, RequestStatus, ReviewedByStaffID, ReviewDate, Response)
SELECT v.RequestID, v.OrderID, v.RequestType, v.RequestDate, v.Reason, v.RequestedEventDate, v.RequestStatus, v.ReviewedByStaffID, v.ReviewDate, v.Response
FROM (VALUES
    (1, 6, 'Cancellation', '2026-09-08T00:00:00', 'Venue changed, event postponed', NULL, 'Approved', 2, '2026-09-09T00:00:00', 'Approved - no payment had been made'),
    (2, 2, 'Rescheduling', '2026-09-28T00:00:00', 'Family function moved', '2026-10-25', 'Pending', NULL, NULL, NULL)
) AS v (RequestID, OrderID, RequestType, RequestDate, Reason, RequestedEventDate, RequestStatus, ReviewedByStaffID, ReviewDate, Response)
WHERE NOT EXISTS (SELECT 1 FROM dbo.ORDER_REQUEST t WHERE t.RequestID = v.RequestID);
GO

-- ==========================================================================
-- Part 4: SQL Queries
-- Five queries: SELECT, JOIN, Aggregation, GROUP BY / HAVING, Subquery
-- ==========================================================================
-- Query 1: SELECT - orders that are still active (not cancelled or rejected), oldest first
SELECT OrderID, OrderDate, Status
FROM dbo.[ORDER]
WHERE Status NOT IN ('Cancelled', 'Rejected')
ORDER BY OrderDate;

-- Query 2: JOIN - each order with its customer and package (ORDER + CUSTOMER + CateringPackage)
SELECT o.OrderID, c.Name AS Customer, p.PackageName, o.OrderDate, o.Status
FROM dbo.[ORDER] o
INNER JOIN dbo.CUSTOMER c        ON c.CustomerID = o.CustomerID
INNER JOIN dbo.CateringPackage p ON p.PackageID  = o.PackageID
ORDER BY o.OrderID;

-- Query 3: Aggregation - servings ordered across all order lines
SELECT COUNT(DISTINCT OrderID)  AS OrdersWithItems,
       SUM(Quantity)            AS TotalServings,
       AVG(Quantity * 1.0)      AS AverageServingsPerLine,
       MAX(Quantity)            AS LargestLine
FROM dbo.ORDER_MENU_ITEM;

-- Query 4: GROUP BY / HAVING - customers who have placed two or more orders
SELECT c.CustomerID, c.Name, COUNT(*) AS OrderCount
FROM dbo.[ORDER] o
INNER JOIN dbo.CUSTOMER c ON c.CustomerID = o.CustomerID
GROUP BY c.CustomerID, c.Name
HAVING COUNT(*) >= 2;

-- Query 5: Subquery - orders that have an Approved staff review
SELECT o.OrderID, o.OrderDate, o.Status
FROM dbo.[ORDER] o
WHERE o.OrderID IN (SELECT r.OrderID
                    FROM dbo.ORDER_REVIEW r
                    WHERE r.ReviewStatus = 'Approved')
ORDER BY o.OrderID;
GO

-- ==========================================================================
-- Part 5: Stored Procedure
-- ==========================================================================
-- Feature: move an order to its next status, but only along the allowed steps.
-- The trigger in Part 6 writes the history row; this procedure then records which staff member did it.
CREATE OR ALTER PROCEDURE dbo.UpdateOrderStatus
    @OrderID   INT,
    @NewStatus VARCHAR(50),
    @StaffID   INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Current VARCHAR(50);
    DECLARE @Msg NVARCHAR(300);

    SELECT @Current = Status FROM dbo.[ORDER] WHERE OrderID = @OrderID;

    IF @Current IS NULL
    BEGIN
        THROW 50020, 'Order not found.', 1;
    END;
    IF @StaffID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.STAFF WHERE StaffID = @StaffID)
    BEGIN
        THROW 50021, 'Staff member not found.', 1;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM (VALUES
            ('Pending Verification',         'Under Staff Review'),
            ('Pending Verification',         'Rejected'),
            ('Pending Verification',         'Cancelled'),
            ('Under Staff Review',           'Quotation Ready'),
            ('Under Staff Review',           'Rejected'),
            ('Under Staff Review',           'Cancelled'),
            ('Quotation Ready',              'Customer Confirmation Pending'),
            ('Quotation Ready',              'Cancelled'),
            ('Customer Confirmation Pending','Payment Pending'),
            ('Customer Confirmation Pending','Cancelled'),
            ('Payment Pending',              'Confirmed'),
            ('Payment Pending',              'Cancelled'),
            ('Confirmed',                    'Preparing'),
            ('Confirmed',                    'Cancelled'),
            ('Preparing',                    'Ready for Delivery'),
            ('Ready for Delivery',           'Delivered')
        ) AS t (FromStatus, ToStatus)
        WHERE t.FromStatus = @Current AND t.ToStatus = @NewStatus)
    BEGIN
        SET @Msg = CONCAT('Invalid status change: ', @Current, ' -> ', @NewStatus);
        THROW 50022, @Msg, 1;
    END;

    BEGIN TRANSACTION;

        UPDATE dbo.[ORDER]
        SET Status = @NewStatus,
            PreparedByStaffID = CASE WHEN @NewStatus = 'Preparing' AND @StaffID IS NOT NULL
                                     THEN @StaffID ELSE PreparedByStaffID END
        WHERE OrderID = @OrderID;

        UPDATE dbo.ORDER_STATUS_HISTORY
        SET ChangedByStaffID = @StaffID
        WHERE StatusHistoryID = (SELECT MAX(StatusHistoryID)
                                 FROM dbo.ORDER_STATUS_HISTORY
                                 WHERE OrderID = @OrderID AND Status = @NewStatus);

    COMMIT TRANSACTION;
END;
GO

-- Demo 1: order 3 is 'Quotation Ready' -> move it to 'Customer Confirmation Pending' (allowed), then undo
BEGIN TRANSACTION;
    EXEC dbo.UpdateOrderStatus @OrderID = 3, @NewStatus = 'Customer Confirmation Pending', @StaffID = 2;
    SELECT OrderID, Status FROM dbo.[ORDER] WHERE OrderID = 3;
ROLLBACK TRANSACTION;

-- Demo 2: order 5 is 'Pending Verification' -> jumping straight to 'Delivered' is refused
BEGIN TRY
    EXEC dbo.UpdateOrderStatus @OrderID = 5, @NewStatus = 'Delivered', @StaffID = 2;
END TRY
BEGIN CATCH
    SELECT ERROR_NUMBER() AS ErrorNo, ERROR_MESSAGE() AS ProcedureMessage;
END CATCH;
GO

-- ==========================================================================
-- Part 6: Trigger
-- ==========================================================================
-- Feature: automatic order history. Every time an order is inserted or its Status changes,
-- one row is added to ORDER_STATUS_HISTORY (what, when). Nobody has to remember to log it.
CREATE OR ALTER TRIGGER dbo.trg_Order_StatusHistory
ON dbo.[ORDER]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.ORDER_STATUS_HISTORY (StatusHistoryID, OrderID, Status, ChangedDate, ChangedByStaffID)
    SELECT (SELECT ISNULL(MAX(StatusHistoryID), 0) FROM dbo.ORDER_STATUS_HISTORY)
               + ROW_NUMBER() OVER (ORDER BY i.OrderID),
           i.OrderID, i.Status, GETDATE(), NULL
    FROM inserted i
    LEFT JOIN deleted d ON d.OrderID = i.OrderID
    WHERE d.OrderID IS NULL          -- a brand new order
       OR d.Status <> i.Status;      -- or the status really changed
END;
GO

-- Demo: a plain UPDATE of the status (no procedure) still creates a history row
BEGIN TRANSACTION;
    SELECT COUNT(*) AS HistoryRowsBefore FROM dbo.ORDER_STATUS_HISTORY WHERE OrderID = 5;

    UPDATE dbo.[ORDER] SET Status = 'Under Staff Review' WHERE OrderID = 5;   -- fires the trigger

    SELECT OrderID, Status, ChangedDate
    FROM dbo.ORDER_STATUS_HISTORY
    WHERE OrderID = 5
    ORDER BY StatusHistoryID;                                                  -- one new row
ROLLBACK TRANSACTION;
GO

-- End of file
