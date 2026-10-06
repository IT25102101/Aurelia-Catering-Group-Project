/* ==============================================================================
   AURELIA CATERING SYSTEM - COMPLETE DATABASE SCRIPT (SQL Server / T-SQL)
   Database : AureliaCatering2   (same name the Java DBConnection.java uses)
   Modules  : Auth/Accounts, Customer, Staff, Menu, Package, Order, Event,
              Quotation, Payment, Delivery, Inventory & Recipes
   Course   : IT2140 - covers Lab 02 to Lab 07 concepts

   PARTS
     1. Create database + drop old objects
     2. Tables (PK, FK, UNIQUE, CHECK, DEFAULT)         -> Lab 03
     3. Indexes
     4. Sample data (INSERT / UPDATE)                   -> Lab 04
     5. Functions                                       -> Lab 06
     6. Views                                           -> Lab 06
     7. Stored procedures (7b = the assignment procedures) -> Lab 07
     8. Triggers (8b = the assignment triggers)           -> Lab 07
     9. Sample data that uses the triggers + procedures
    10. Example queries (JOIN, GROUP BY, HAVING ...)    -> Lab 02 / Lab 05

   HOW TO RUN: open in SQL Server Management Studio and press Execute (F5).
   The script is re-runnable: it drops and recreates everything.

   LOGIN: every sample account (customers and staff) has the password
   password123. It is stored as a salted PBKDF2 hash made by the Java class
   PasswordUtil, so the Java login works with it. CHANGE these passwords before
   any real use.
   ============================================================================== */

/* ==============================================================================
   PART 1 - CREATE DATABASE
   ============================================================================== */
IF DB_ID(N'AureliaCatering2') IS NULL
    CREATE DATABASE AureliaCatering2;
GO

USE AureliaCatering2;
GO

/* ---- drop views, procedures, functions (if they already exist) ---- */
IF OBJECT_ID(N'dbo.vw_OrderSummary', N'V')       IS NOT NULL DROP VIEW dbo.vw_OrderSummary;
IF OBJECT_ID(N'dbo.vw_PaymentSummary', N'V')     IS NOT NULL DROP VIEW dbo.vw_PaymentSummary;
IF OBJECT_ID(N'dbo.vw_LowStockItems', N'V')      IS NOT NULL DROP VIEW dbo.vw_LowStockItems;
IF OBJECT_ID(N'dbo.vw_PendingDeliveries', N'V')  IS NOT NULL DROP VIEW dbo.vw_PendingDeliveries;
IF OBJECT_ID(N'dbo.vw_PackageDetails', N'V')     IS NOT NULL DROP VIEW dbo.vw_PackageDetails;
IF OBJECT_ID(N'dbo.vw_StaffWorkload', N'V')      IS NOT NULL DROP VIEW dbo.vw_StaffWorkload;
IF OBJECT_ID(N'dbo.vw_MonthlyRevenue', N'V')     IS NOT NULL DROP VIEW dbo.vw_MonthlyRevenue;
IF OBJECT_ID(N'dbo.vw_PopularMenuItems', N'V')   IS NOT NULL DROP VIEW dbo.vw_PopularMenuItems;

IF OBJECT_ID(N'dbo.AddPayment', N'P')               IS NOT NULL DROP PROCEDURE dbo.AddPayment;
IF OBJECT_ID(N'dbo.UpdateOrderStatus', N'P')        IS NOT NULL DROP PROCEDURE dbo.UpdateOrderStatus;
IF OBJECT_ID(N'dbo.CreateOrderWithEvent', N'P')     IS NOT NULL DROP PROCEDURE dbo.CreateOrderWithEvent;
IF OBJECT_ID(N'dbo.AddOrderItem', N'P')             IS NOT NULL DROP PROCEDURE dbo.AddOrderItem;
IF OBJECT_ID(N'dbo.BuildQuotationFromOrder', N'P')  IS NOT NULL DROP PROCEDURE dbo.BuildQuotationFromOrder;
IF OBJECT_ID(N'dbo.AssignDelivery', N'P')           IS NOT NULL DROP PROCEDURE dbo.AssignDelivery;
IF OBJECT_ID(N'dbo.CheckInventoryForOrder', N'P')   IS NOT NULL DROP PROCEDURE dbo.CheckInventoryForOrder;
IF OBJECT_ID(N'dbo.DeductInventoryForOrder', N'P')  IS NOT NULL DROP PROCEDURE dbo.DeductInventoryForOrder;

IF OBJECT_ID(N'dbo.CalculateServiceCharge', N'FN')   IS NOT NULL DROP FUNCTION dbo.CalculateServiceCharge;
IF OBJECT_ID(N'dbo.GetOrderTotalPayment', N'FN')     IS NOT NULL DROP FUNCTION dbo.GetOrderTotalPayment;
IF OBJECT_ID(N'dbo.GetRemainingPayment', N'FN')      IS NOT NULL DROP FUNCTION dbo.GetRemainingPayment;
IF OBJECT_ID(N'dbo.GetPaymentStatus', N'FN')         IS NOT NULL DROP FUNCTION dbo.GetPaymentStatus;
IF OBJECT_ID(N'dbo.GetOrderMenuTotal', N'FN')        IS NOT NULL DROP FUNCTION dbo.GetOrderMenuTotal;
IF OBJECT_ID(N'dbo.GetInventoryNeedForOrder', N'IF') IS NOT NULL DROP FUNCTION dbo.GetInventoryNeedForOrder;
GO

/* ---- drop tables: child tables first ---- */
IF OBJECT_ID(N'dbo.INVENTORY_ALERT', N'U')      IS NOT NULL DROP TABLE dbo.INVENTORY_ALERT;   -- table created by 07_Inventory_Recipes.sql
IF OBJECT_ID(N'dbo.PAYMENT', N'U')              IS NOT NULL DROP TABLE dbo.PAYMENT;
IF OBJECT_ID(N'dbo.QUOTATION_ITEM', N'U')       IS NOT NULL DROP TABLE dbo.QUOTATION_ITEM;
IF OBJECT_ID(N'dbo.QUOTATION', N'U')            IS NOT NULL DROP TABLE dbo.QUOTATION;
IF OBJECT_ID(N'dbo.ORDER_REQUEST', N'U')        IS NOT NULL DROP TABLE dbo.ORDER_REQUEST;
IF OBJECT_ID(N'dbo.ORDER_REVIEW', N'U')         IS NOT NULL DROP TABLE dbo.ORDER_REVIEW;
IF OBJECT_ID(N'dbo.ORDER_STATUS_HISTORY', N'U') IS NOT NULL DROP TABLE dbo.ORDER_STATUS_HISTORY;
IF OBJECT_ID(N'dbo.ORDER_MENU_ITEM', N'U')      IS NOT NULL DROP TABLE dbo.ORDER_MENU_ITEM;
IF OBJECT_ID(N'dbo.DELIVERY', N'U')             IS NOT NULL DROP TABLE dbo.DELIVERY;
IF OBJECT_ID(N'dbo.EVENT', N'U')                IS NOT NULL DROP TABLE dbo.[EVENT];
IF OBJECT_ID(N'dbo.ORDER', N'U')                IS NOT NULL DROP TABLE dbo.[ORDER];
IF OBJECT_ID(N'dbo.PACKAGE_MENU_ITEM', N'U')    IS NOT NULL DROP TABLE dbo.PACKAGE_MENU_ITEM;
IF OBJECT_ID(N'dbo.RECIPE_INGREDIENT', N'U')    IS NOT NULL DROP TABLE dbo.RECIPE_INGREDIENT;
IF OBJECT_ID(N'dbo.STAFF_ACCOUNT', N'U')        IS NOT NULL DROP TABLE dbo.STAFF_ACCOUNT;
IF OBJECT_ID(N'dbo.CUSTOMER_ACCOUNT', N'U')     IS NOT NULL DROP TABLE dbo.CUSTOMER_ACCOUNT;
IF OBJECT_ID(N'dbo.RECIPE', N'U')               IS NOT NULL DROP TABLE dbo.RECIPE;
IF OBJECT_ID(N'dbo.INVENTORY_ITEM', N'U')       IS NOT NULL DROP TABLE dbo.INVENTORY_ITEM;
IF OBJECT_ID(N'dbo.MenuItem', N'U')             IS NOT NULL DROP TABLE dbo.MenuItem;
IF OBJECT_ID(N'dbo.CateringPackage', N'U')      IS NOT NULL DROP TABLE dbo.CateringPackage;
IF OBJECT_ID(N'dbo.MENU_ITEM', N'U')            IS NOT NULL DROP TABLE dbo.MENU_ITEM;         -- old duplicate
IF OBJECT_ID(N'dbo.CATERING_PACKAGE', N'U')     IS NOT NULL DROP TABLE dbo.CATERING_PACKAGE;  -- old duplicate
IF OBJECT_ID(N'dbo.STAFF', N'U')                IS NOT NULL DROP TABLE dbo.STAFF;
IF OBJECT_ID(N'dbo.CUSTOMER', N'U')             IS NOT NULL DROP TABLE dbo.CUSTOMER;
GO

/* ==============================================================================
   PART 2 - TABLES
   Table names MenuItem and CateringPackage match the Java DAO classes.
   IDs are plain INT because the Java code generates them (MAX(id)+1).
   ============================================================================== */

/* ---------- MODULE: CUSTOMER ---------- */
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

/* ---------- MODULE: STAFF ---------- */
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

/* ---------- MODULE: AUTHENTICATION / ACCOUNTS ---------- */
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
GO

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
GO

/* ---------- MODULE: MENU ---------- */
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

/* ---------- MODULE: PACKAGE ---------- */
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

CREATE TABLE dbo.PACKAGE_MENU_ITEM (
    PackageID  INT NOT NULL,
    MenuItemID INT NOT NULL,
    Quantity   INT NOT NULL,
    CONSTRAINT PK_PACKAGE_MENU_ITEM          PRIMARY KEY (PackageID, MenuItemID),   -- composite key
    CONSTRAINT CK_PACKAGE_MENU_ITEM_QUANTITY CHECK (Quantity > 0),
    CONSTRAINT FK_PACKAGE_MENU_ITEM_PACKAGE  FOREIGN KEY (PackageID)  REFERENCES dbo.CateringPackage (PackageID),
    CONSTRAINT FK_PACKAGE_MENU_ITEM_MENU     FOREIGN KEY (MenuItemID) REFERENCES dbo.MenuItem (MenuItemID)
);
GO

/* ---------- MODULE: INVENTORY & RECIPES ---------- */
CREATE TABLE dbo.INVENTORY_ITEM (
    InventoryItemID INT           NOT NULL,
    ItemName        VARCHAR(100)  NOT NULL,
    Quantity        DECIMAL(12,3) NOT NULL,
    Unit            VARCHAR(20)   NOT NULL,
    ReorderLevel    DECIMAL(12,3) NOT NULL,
    Category        VARCHAR(30)   NOT NULL CONSTRAINT DF_INVENTORY_ITEM_Category DEFAULT ('Other'),  -- ISA discriminator
    CONSTRAINT PK_INVENTORY_ITEM          PRIMARY KEY (InventoryItemID),
    CONSTRAINT UQ_INVENTORY_ITEM_NAME     UNIQUE (ItemName),
    CONSTRAINT CK_INVENTORY_ITEM_QUANTITY CHECK (Quantity >= 0),
    CONSTRAINT CK_INVENTORY_ITEM_REORDER  CHECK (ReorderLevel >= 0),
    CONSTRAINT CK_INVENTORY_ITEM_CATEGORY CHECK (Category IN ('Meat', 'Seafood', 'Vegetable', 'Dairy', 'Grain', 'Oil', 'Confectionery', 'Other'))
);
GO

/* One recipe per menu item (NEW: MenuItemID links a recipe to the dish it makes) */
CREATE TABLE dbo.RECIPE (
    RecipeID    INT          NOT NULL,
    MenuItemID  INT          NOT NULL,
    RecipeName  VARCHAR(100) NOT NULL,
    Description VARCHAR(500) NULL,
    CONSTRAINT PK_RECIPE         PRIMARY KEY (RecipeID),
    CONSTRAINT UQ_RECIPE_MENU    UNIQUE (MenuItemID),
    CONSTRAINT FK_RECIPE_MENU    FOREIGN KEY (MenuItemID) REFERENCES dbo.MenuItem (MenuItemID)
);
GO

/* QuantityRequired = amount of the inventory item needed for ONE serving */
CREATE TABLE dbo.RECIPE_INGREDIENT (
    RecipeIngredientID INT          NOT NULL,   -- NEW: single id so the app can edit / delete one line
    RecipeID           INT           NOT NULL,
    InventoryItemID    INT           NOT NULL,
    QuantityRequired   DECIMAL(10,3) NOT NULL,
    CONSTRAINT PK_RECIPE_INGREDIENT          PRIMARY KEY (RecipeIngredientID),
    CONSTRAINT UQ_RECIPE_INGREDIENT_PAIR     UNIQUE (RecipeID, InventoryItemID),   -- an item appears once per recipe
    CONSTRAINT CK_RECIPE_INGREDIENT_QUANTITY CHECK (QuantityRequired > 0),
    CONSTRAINT FK_RECIPE_INGREDIENT_RECIPE   FOREIGN KEY (RecipeID)        REFERENCES dbo.RECIPE (RecipeID),
    CONSTRAINT FK_RECIPE_INGREDIENT_INV      FOREIGN KEY (InventoryItemID) REFERENCES dbo.INVENTORY_ITEM (InventoryItemID)
);
GO

/* NEW: low-stock warnings written by trigger trg_InventoryItem_LowStockAlert */
CREATE TABLE dbo.INVENTORY_ALERT (
    AlertID         INT           NOT NULL,
    InventoryItemID INT           NOT NULL,
    AlertDate       DATETIME      NOT NULL CONSTRAINT DF_INVENTORY_ALERT_Date DEFAULT (GETDATE()),
    QuantityLeft    DECIMAL(12,3) NOT NULL,
    ReorderLevel    DECIMAL(12,3) NOT NULL,
    Message         VARCHAR(200)  NOT NULL,
    CONSTRAINT PK_INVENTORY_ALERT      PRIMARY KEY (AlertID),
    CONSTRAINT FK_INVENTORY_ALERT_ITEM FOREIGN KEY (InventoryItemID) REFERENCES dbo.INVENTORY_ITEM (InventoryItemID)
);
GO

/* ---------- MODULE: ORDER ---------- */
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

/* ---------- MODULE: EVENT ---------- */
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

/* ---------- MODULE: QUOTATION ---------- */
CREATE TABLE dbo.QUOTATION (
    QuotationID   INT           NOT NULL,
    OrderID       INT           NOT NULL,
    QuotationDate DATE          NOT NULL,
    TotalAmount   DECIMAL(10,2) NOT NULL,     -- kept up to date by trigger trg_QuotationItem_RecalcTotal
    Status        VARCHAR(20)   NOT NULL,
    CONSTRAINT PK_QUOTATION        PRIMARY KEY (QuotationID),
    CONSTRAINT UQ_QUOTATION_ORDER  UNIQUE (OrderID),             -- one quotation per order
    CONSTRAINT CK_QUOTATION_TOTAL  CHECK (TotalAmount >= 0),
    CONSTRAINT CK_QUOTATION_STATUS CHECK (Status IN ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired')),
    CONSTRAINT FK_QUOTATION_ORDER  FOREIGN KEY (OrderID) REFERENCES dbo.[ORDER] (OrderID)
);
GO

CREATE TABLE dbo.QUOTATION_ITEM (
    QuotationItemID INT           NOT NULL,
    QuotationID     INT           NOT NULL,
    Description     VARCHAR(200)  NOT NULL,
    Quantity        DECIMAL(10,2) NOT NULL,
    UnitPrice       DECIMAL(10,2) NOT NULL,
    LineTotal AS (Quantity * UnitPrice) PERSISTED,             -- computed column
    CONSTRAINT PK_QUOTATION_ITEM           PRIMARY KEY (QuotationItemID),
    CONSTRAINT CK_QUOTATION_ITEM_QUANTITY  CHECK (Quantity > 0),
    CONSTRAINT CK_QUOTATION_ITEM_PRICE     CHECK (UnitPrice >= 0),
    CONSTRAINT FK_QUOTATION_ITEM_QUOTATION FOREIGN KEY (QuotationID) REFERENCES dbo.QUOTATION (QuotationID)
);
GO

/* ---------- MODULE: PAYMENT ---------- */
CREATE TABLE dbo.PAYMENT (
    PaymentID     INT           NOT NULL,
    OrderID       INT           NOT NULL,
    PaymentDate   DATETIME      NOT NULL CONSTRAINT DF_PAYMENT_Date DEFAULT (GETDATE()),
    Amount        DECIMAL(10,2) NOT NULL,
    PaymentType   VARCHAR(20)   NOT NULL,
    PaymentStatus VARCHAR(20)   NOT NULL,
    CONSTRAINT PK_PAYMENT        PRIMARY KEY (PaymentID),
    CONSTRAINT CK_PAYMENT_AMOUNT CHECK (Amount > 0),
    CONSTRAINT CK_PAYMENT_TYPE   CHECK (PaymentType IN ('Advance', 'Balance')),
    CONSTRAINT CK_PAYMENT_STATUS CHECK (PaymentStatus IN ('Pending', 'Paid', 'Failed')),
    CONSTRAINT FK_PAYMENT_ORDER  FOREIGN KEY (OrderID) REFERENCES dbo.[ORDER] (OrderID)
);
GO

/* ---------- MODULE: DELIVERY ---------- */
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

/* ==============================================================================
   PART 3 - INDEXES (speed up the joins and filters the application uses)
   ============================================================================== */
CREATE INDEX IX_ORDER_Customer        ON dbo.[ORDER] (CustomerID);
CREATE INDEX IX_ORDER_Package         ON dbo.[ORDER] (PackageID);
CREATE INDEX IX_ORDER_Status          ON dbo.[ORDER] (Status);
CREATE INDEX IX_EVENT_Date            ON dbo.[EVENT] (EventDate);
CREATE INDEX IX_ORDER_MENU_ITEM_Menu  ON dbo.ORDER_MENU_ITEM (MenuItemID);
CREATE INDEX IX_PACKAGE_MENU_Menu     ON dbo.PACKAGE_MENU_ITEM (MenuItemID);
CREATE INDEX IX_RECIPE_ING_Inventory  ON dbo.RECIPE_INGREDIENT (InventoryItemID);
CREATE INDEX IX_PAYMENT_Order         ON dbo.PAYMENT (OrderID);
CREATE INDEX IX_QUOTATION_ITEM_Quote  ON dbo.QUOTATION_ITEM (QuotationID);
CREATE INDEX IX_HISTORY_Order         ON dbo.ORDER_STATUS_HISTORY (OrderID);
CREATE INDEX IX_REVIEW_Order          ON dbo.ORDER_REVIEW (OrderID);
CREATE INDEX IX_REQUEST_Order         ON dbo.ORDER_REQUEST (OrderID);
CREATE INDEX IX_DELIVERY_Staff        ON dbo.DELIVERY (StaffID);
GO

/* ==============================================================================
   PART 4 - SAMPLE DATA (reference data first, in foreign-key order)
   Orders / quotations / payments / deliveries are loaded in PART 9, after the
   triggers exist, so the triggers fill ORDER_STATUS_HISTORY automatically.
   ============================================================================== */

INSERT INTO dbo.CUSTOMER (CustomerID, Name, Phone, Email) VALUES
(1, 'Nimal Perera',           '0771234567', 'nimal@gmail.com'),
(2, 'Kamal Silva',            '0712345678', 'kamal@gmail.com'),
(3, 'Ishara Perera',          '0775556666', 'customer@aurelia.com'),
(4, 'Dilini Fernando',        '0768887777', 'dilini@gmail.com'),
(5, 'Sahan Jayawardena',      '0702223344', 'sahan@gmail.com'),
(6, 'Thilini Wickramasinghe', '0719990000', 'thilini@gmail.com');

INSERT INTO dbo.STAFF (StaffID, Name, Phone, Email, Role) VALUES
(1, 'Nadeesha Perera',    '0770000001', 'admin@aurelia.com',     'ADMIN'),
(2, 'Ruwan Silva',        '0770000002', 'ops@aurelia.com',       'OPERATIONS_SUPERVISOR'),
(3, 'Tharushi Fernando',  '0770000003', 'kitchen@aurelia.com',   'KITCHEN_STAFF'),
(4, 'Sunil Perera',       '0770000004', 'sunil@aurelia.com',     'KITCHEN_STAFF'),
(5, 'Kasun Wijesinghe',   '0770000005', 'delivery@aurelia.com',  'DELIVERY_STAFF'),
(6, 'Amal Fernando',      '0770000006', 'amal@aurelia.com',      'DELIVERY_STAFF'),
(7, 'Dinithi Jayawardena','0770000007', 'finance@aurelia.com',   'FINANCE_OFFICER'),
(8, 'Ravindu Jayasinghe', '0770000008', 'inventory@aurelia.com', 'INVENTORY_COORDINATOR');

INSERT INTO dbo.CUSTOMER_ACCOUNT (AccountID, CustomerID, PasswordHash) VALUES
(1, 1, 'pbkdf2$120000$FF12LVXfjHouNXxPhTSFSQ==$yhAbFZPcXe5+KidAwiULYtoj9/Qwoyjp/8VyYaxWA30='),
(2, 2, 'pbkdf2$120000$ui5lodKVMIp2mBUcnuRTJA==$C1ISXkLR7TKXu+Oy7N8KQ/GHr+pSmwuAgopac2QzCN8='),
(3, 3, 'pbkdf2$120000$GN8n+ltG8xzTD6LOwXN/dw==$GwEUkRX/PWKaVW11rNuJhJ2KDzE8QZ9pxkapJ8mqKn0='),
(4, 4, 'pbkdf2$120000$aRjEF29mZGXqLwT4UrNbOA==$iGeK1Gg50auqziso74YMGunNK1EnUED5c+IOWcBwXao='),
(5, 5, 'pbkdf2$120000$C19SYCZ4SIN7wFJsHniB8w==$AqLlEo8d3pjpD3e6YqGSNczG+wuxpq+vqviSz1pAXVQ='),
(6, 6, 'pbkdf2$120000$7r7lr3LCihfuc21GK/n5KQ==$iSkOl2KRQG6zakuUcaQn9JWlENgUp3n6Ae+Cmj7m9XI=');

INSERT INTO dbo.STAFF_ACCOUNT (AccountID, StaffID, Username, PasswordHash) VALUES
(1, 1, 'admin', 'pbkdf2$120000$kD0vqCljHaO+WdKIb7ZOMg==$bpD1xZQttB7U921hL8ToMViAFtGhx2jSLXMCr3I/NqM='),
(2, 2, 'ops.supervisor', 'pbkdf2$120000$/e5+dAVCnsBcswy6ZLNVJg==$Ah839G1NBXAO1ROVoEhAp7JMrd5ARGe//51d53bQ5Po='),
(3, 3, 'kitchen.tharushi', 'pbkdf2$120000$V9153aHsG/U6+shbWNYlNQ==$yCiRMBDaOryIrngV2b5bKHxwU4jb4QHJj+VnxdcTYNk='),
(4, 4, 'kitchen.sunil', 'pbkdf2$120000$0ilcBYK9+5VZ4QlLO0B4yQ==$x/3kPXAOU4JrRuOMLLYEXkVx5r8Be1zjDIVA2krbmjU='),
(5, 5, 'delivery.kasun', 'pbkdf2$120000$0Q10RwJqL56WMoxzXtVihA==$/qh01PnLcmoMXHVUgoP/Tbb5pbO/dnHKgAESqaANHP0='),
(6, 6, 'delivery.amal', 'pbkdf2$120000$F/heOXLT1jp0F/fFvdMSnQ==$CMtdyzmz/aFpt7dqIOMp2m2vOIai7eQvl68lfwUgx+0='),
(7, 7, 'finance', 'pbkdf2$120000$M44VnebljiHsz3UPdkrqZQ==$OMgcgA+iMjxZlKP42kS3DxDrewtVkFbDCApybYd5l8I='),
(8, 8, 'inventory', 'pbkdf2$120000$nyhE1AFrm4H+h0yE+cCYMA==$cupR2Ypf91niYn1MtFXMiLeqfdQFIjpsKHZS7svOrbE=');

INSERT INTO dbo.MenuItem (MenuItemID, ItemName, Description, Price, Category) VALUES
(1, 'Chicken Rice',      'Rice served with chicken',             800.00, 'Main'),
(2, 'Vegetable Salad',   'Fresh vegetable salad',                400.00, 'Salad'),
(3, 'Fruit Juice',       'Fresh mixed fruit juice',              300.00, 'Beverage'),
(4, 'Grilled Salmon',    'Grilled salmon fillet with vegetables',2200.00,'Main'),
(5, 'Roast Lamb',        'Slow roasted lamb',                    2800.00,'Main'),
(6, 'Chocolate Fondant', 'Warm chocolate dessert with cream',     900.00,'Dessert'),
(7, 'Watalappan',        'Traditional coconut custard pudding',   450.00,'Dessert'),
(8, 'Iced Coffee',       'Chilled coffee',                        350.00,'Beverage');

INSERT INTO dbo.CateringPackage (PackageID, PackageName, Description, Price, PackageType) VALUES
(1, 'Wedding Package',   'Complete wedding catering package',     50000.00, 'Wedding'),
(2, 'Birthday Package',  'Birthday event catering package',       30000.00, 'Birthday'),
(3, 'Corporate Package', 'Corporate lunch and conference catering',40000.00, 'Corporate'),
(4, 'Gala Package',      'Formal gala dinner catering package',   75000.00, 'Gala');

INSERT INTO dbo.PACKAGE_MENU_ITEM (PackageID, MenuItemID, Quantity) VALUES
(1, 1, 100), (1, 2, 100), (1, 3, 100), (1, 6, 100),
(2, 1, 30),  (2, 3, 30),  (2, 6, 30),
(3, 1, 50),  (3, 2, 50),  (3, 8, 50),
(4, 4, 100), (4, 5, 100), (4, 6, 100);

INSERT INTO dbo.INVENTORY_ITEM (InventoryItemID, ItemName, Quantity, Unit, ReorderLevel, Category) VALUES
(1, 'Rice',           500.000, 'kg',    100.000, 'Grain'),
(2, 'Chicken',        200.000, 'kg',     50.000, 'Meat'),
(3, 'Carrot',         100.000, 'kg',     20.000, 'Vegetable'),
(4, 'Cooking Oil',     80.000, 'litre',  15.000, 'Oil'),
(5, 'Salmon',          60.000, 'kg',     20.000, 'Seafood'),
(6, 'Lamb',            80.000, 'kg',     25.000, 'Meat'),
(7, 'Dark Chocolate',   8.000, 'kg',     10.000, 'Confectionery'),   -- below reorder level on purpose
(8, 'Cream',           12.000, 'litre',  10.000, 'Dairy');

INSERT INTO dbo.RECIPE (RecipeID, MenuItemID, RecipeName, Description) VALUES
(1, 1, 'Chicken Rice Recipe',      'Recipe for chicken rice'),
(2, 2, 'Vegetable Salad Recipe',   'Recipe for vegetable salad'),
(3, 4, 'Grilled Salmon Recipe',    'Recipe for grilled salmon'),
(4, 5, 'Roast Lamb Recipe',        'Recipe for roast lamb'),
(5, 6, 'Chocolate Fondant Recipe', 'Recipe for chocolate fondant');

/* amounts are per ONE serving */
INSERT INTO dbo.RECIPE_INGREDIENT (RecipeIngredientID, RecipeID, InventoryItemID, QuantityRequired) VALUES
(1,  1, 1, 0.150), (2,  1, 2, 0.200), (3,  1, 4, 0.020), (4,  1, 3, 0.030),
(5,  2, 3, 0.100), (6,  2, 4, 0.010),
(7,  3, 5, 0.200), (8,  3, 4, 0.020), (9,  3, 3, 0.050),
(10, 4, 6, 0.250), (11, 4, 4, 0.020),
(12, 5, 7, 0.080), (13, 5, 8, 0.050);
GO

INSERT INTO dbo.INVENTORY_ALERT (AlertID, InventoryItemID, AlertDate, QuantityLeft, ReorderLevel, Message) VALUES
(1, 7, '2026-09-30T10:15:00', 8.000, 10.000, 'Dark Chocolate is at or below its reorder level.');
GO

/* ==============================================================================
   PART 5 - FUNCTIONS
   ============================================================================== */

/* 10% service charge */
CREATE FUNCTION dbo.CalculateServiceCharge (@Amount DECIMAL(10,2))
RETURNS DECIMAL(10,2)
AS
BEGIN
    RETURN ROUND(@Amount * 0.10, 2);
END;
GO

/* total of PAID payments for an order */
CREATE FUNCTION dbo.GetOrderTotalPayment (@OrderID INT)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @Total DECIMAL(10,2);
    SELECT @Total = ISNULL(SUM(Amount), 0)
    FROM dbo.PAYMENT
    WHERE OrderID = @OrderID AND PaymentStatus = 'Paid';
    RETURN @Total;
END;
GO

/* quotation total minus paid payments (0 when the order has no quotation) */
CREATE FUNCTION dbo.GetRemainingPayment (@OrderID INT)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @QuotationTotal DECIMAL(10,2);
    SELECT @QuotationTotal = TotalAmount FROM dbo.QUOTATION WHERE OrderID = @OrderID;
    IF @QuotationTotal IS NULL RETURN 0;
    RETURN @QuotationTotal - dbo.GetOrderTotalPayment(@OrderID);
END;
GO

/* 'No Quotation' / 'Unpaid' / 'Partially Paid' / 'Fully Paid' */
CREATE FUNCTION dbo.GetPaymentStatus (@OrderID INT)
RETURNS VARCHAR(20)
AS
BEGIN
    DECLARE @Total DECIMAL(10,2);
    DECLARE @Paid  DECIMAL(10,2);
    SELECT @Total = TotalAmount FROM dbo.QUOTATION WHERE OrderID = @OrderID;
    SET @Paid = dbo.GetOrderTotalPayment(@OrderID);
    RETURN CASE
              WHEN @Total IS NULL  THEN 'No Quotation'
              WHEN @Paid = 0       THEN 'Unpaid'
              WHEN @Paid >= @Total THEN 'Fully Paid'
              ELSE 'Partially Paid'
           END;
END;
GO

/* sum of (quantity x menu price) for the items chosen in an order */
CREATE FUNCTION dbo.GetOrderMenuTotal (@OrderID INT)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @Total DECIMAL(10,2);
    SELECT @Total = ISNULL(SUM(omi.Quantity * m.Price), 0)
    FROM dbo.ORDER_MENU_ITEM omi
    INNER JOIN dbo.MenuItem m ON m.MenuItemID = omi.MenuItemID
    WHERE omi.OrderID = @OrderID;
    RETURN @Total;
END;
GO

/* table-valued: how much of each inventory item an order needs (menu qty x recipe) */
CREATE FUNCTION dbo.GetInventoryNeedForOrder (@OrderID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT ri.InventoryItemID,
           SUM(omi.Quantity * ri.QuantityRequired) AS RequiredQty
    FROM dbo.ORDER_MENU_ITEM omi
    INNER JOIN dbo.RECIPE r             ON r.MenuItemID = omi.MenuItemID
    INNER JOIN dbo.RECIPE_INGREDIENT ri ON ri.RecipeID  = r.RecipeID
    WHERE omi.OrderID = @OrderID
    GROUP BY ri.InventoryItemID
);
GO

/* ==============================================================================
   PART 6 - VIEWS
   ============================================================================== */

/* one row per order: customer, package, event, quotation and payment status */
CREATE VIEW dbo.vw_OrderSummary
AS
SELECT o.OrderID,
       c.Name  AS CustomerName,
       c.Phone AS CustomerPhone,
       p.PackageName,
       o.OrderDate,
       o.Status,
       e.EventDate,
       e.Location,
       e.GuestCount,
       e.EventType,
       ISNULL(q.TotalAmount, 0)               AS TotalAmount,
       dbo.GetOrderTotalPayment(o.OrderID)    AS AmountPaid,
       dbo.GetRemainingPayment(o.OrderID)     AS RemainingBalance,
       dbo.GetPaymentStatus(o.OrderID)        AS PaymentStatus
FROM dbo.[ORDER] o
INNER JOIN dbo.CUSTOMER c        ON c.CustomerID = o.CustomerID
INNER JOIN dbo.CateringPackage p ON p.PackageID  = o.PackageID
LEFT JOIN  dbo.[EVENT] e         ON e.OrderID    = o.OrderID
LEFT JOIN  dbo.QUOTATION q       ON q.OrderID    = o.OrderID;
GO

/* matches the PaymentSummary class in the Java model */
CREATE VIEW dbo.vw_PaymentSummary
AS
SELECT o.OrderID,
       ISNULL(q.TotalAmount, 0)            AS TotalAmount,
       dbo.GetOrderTotalPayment(o.OrderID) AS AmountPaid,
       dbo.GetRemainingPayment(o.OrderID)  AS RemainingBalance,
       dbo.GetPaymentStatus(o.OrderID)     AS PaymentStatus
FROM dbo.[ORDER] o
LEFT JOIN dbo.QUOTATION q ON q.OrderID = o.OrderID;
GO

/* inventory coordinator: items at or below the reorder level */
CREATE VIEW dbo.vw_LowStockItems
AS
SELECT InventoryItemID,
       ItemName,
       Quantity,
       Unit,
       ReorderLevel,
       ReorderLevel - Quantity AS ShortBy
FROM dbo.INVENTORY_ITEM
WHERE Quantity <= ReorderLevel;
GO

/* delivery staff: deliveries that are not finished */
CREATE VIEW dbo.vw_PendingDeliveries
AS
SELECT d.DeliveryID,
       d.OrderID,
       d.DeliveryDate,
       d.DeliveryStatus,
       d.Location,
       s.Name AS DeliveryStaff,
       c.Name AS CustomerName,
       c.Phone AS CustomerPhone
FROM dbo.DELIVERY d
INNER JOIN dbo.STAFF s    ON s.StaffID    = d.StaffID
INNER JOIN dbo.[ORDER] o  ON o.OrderID    = d.OrderID
INNER JOIN dbo.CUSTOMER c ON c.CustomerID = o.CustomerID
WHERE d.DeliveryStatus NOT IN ('Delivered', 'Cancelled');
GO

/* what each package contains */
CREATE VIEW dbo.vw_PackageDetails
AS
SELECT p.PackageID,
       p.PackageName,
       p.Price AS PackagePrice,
       m.ItemName,
       m.Category,
       pmi.Quantity
FROM dbo.CateringPackage p
INNER JOIN dbo.PACKAGE_MENU_ITEM pmi ON pmi.PackageID  = p.PackageID
INNER JOIN dbo.MenuItem m            ON m.MenuItemID   = pmi.MenuItemID;
GO

/* admin / supervisor: how busy each staff member is */
CREATE VIEW dbo.vw_StaffWorkload
AS
SELECT s.StaffID,
       s.Name,
       s.Role,
       (SELECT COUNT(*) FROM dbo.[ORDER] o
         WHERE o.PreparedByStaffID = s.StaffID)                       AS OrdersPrepared,
       (SELECT COUNT(*) FROM dbo.DELIVERY d
         WHERE d.StaffID = s.StaffID
           AND d.DeliveryStatus NOT IN ('Delivered', 'Cancelled'))    AS ActiveDeliveries,
       (SELECT COUNT(*) FROM dbo.ORDER_REVIEW r
         WHERE r.StaffID = s.StaffID)                                 AS ReviewsDone
FROM dbo.STAFF s;
GO

/* finance officer: money received per month */
CREATE VIEW dbo.vw_MonthlyRevenue
AS
SELECT YEAR(PaymentDate)  AS PaymentYear,
       MONTH(PaymentDate) AS PaymentMonth,
       COUNT(*)           AS PaymentCount,
       SUM(Amount)        AS TotalReceived
FROM dbo.PAYMENT
WHERE PaymentStatus = 'Paid'
GROUP BY YEAR(PaymentDate), MONTH(PaymentDate);
GO

/* best selling menu items (cancelled / rejected orders excluded) */
CREATE VIEW dbo.vw_PopularMenuItems
AS
SELECT m.MenuItemID,
       m.ItemName,
       m.Category,
       SUM(omi.Quantity)           AS TotalServings,
       SUM(omi.Quantity * m.Price) AS TotalValue
FROM dbo.ORDER_MENU_ITEM omi
INNER JOIN dbo.MenuItem m  ON m.MenuItemID = omi.MenuItemID
INNER JOIN dbo.[ORDER] o   ON o.OrderID    = omi.OrderID
WHERE o.Status NOT IN ('Rejected', 'Cancelled')
GROUP BY m.MenuItemID, m.ItemName, m.Category;
GO

/* ==============================================================================
   PART 7 - STORED PROCEDURES
   Error numbers 50001+ are custom errors raised with THROW.
   ============================================================================== */

/* ---- create an order and its event together (one transaction) ---- */
CREATE PROCEDURE dbo.CreateOrderWithEvent
    @CustomerID      INT,
    @PackageID       INT,
    @SpecialRequests VARCHAR(1000) = NULL,
    @EventDate       DATE,
    @Location        VARCHAR(200),
    @GuestCount      INT,
    @EventType       VARCHAR(50),
    @StartTime       TIME = NULL,
    @NewOrderID      INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.CUSTOMER WHERE CustomerID = @CustomerID)
    BEGIN
        THROW 50001, 'Customer not found.', 1;
    END;
    IF NOT EXISTS (SELECT 1 FROM dbo.CateringPackage WHERE PackageID = @PackageID)
    BEGIN
        THROW 50002, 'Catering package not found.', 1;
    END;
    IF @EventDate < CAST(GETDATE() AS DATE)
    BEGIN
        THROW 50003, 'Event date cannot be in the past.', 1;
    END;
    IF @GuestCount <= 0
    BEGIN
        THROW 50004, 'Guest count must be greater than zero.', 1;
    END;

    DECLARE @NewEventID INT;

    BEGIN TRANSACTION;

        SELECT @NewOrderID = ISNULL(MAX(OrderID), 0) + 1 FROM dbo.[ORDER] WITH (UPDLOCK, HOLDLOCK);
        SELECT @NewEventID = ISNULL(MAX(EventID), 0) + 1 FROM dbo.[EVENT] WITH (UPDLOCK, HOLDLOCK);

        INSERT INTO dbo.[ORDER] (OrderID, CustomerID, PackageID, OrderDate, Status, SpecialRequests)
        VALUES (@NewOrderID, @CustomerID, @PackageID, CAST(GETDATE() AS DATE), 'Pending Verification', @SpecialRequests);

        INSERT INTO dbo.[EVENT] (EventID, OrderID, EventDate, Location, GuestCount, EventType, StartTime)
        VALUES (@NewEventID, @NewOrderID, @EventDate, @Location, @GuestCount, @EventType, @StartTime);

    COMMIT TRANSACTION;
END;
GO

/* ---- add (or increase) a menu item on an order ---- */
CREATE PROCEDURE dbo.AddOrderItem
    @OrderID    INT,
    @MenuItemID INT,
    @Quantity   INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Status VARCHAR(50);
    SELECT @Status = Status FROM dbo.[ORDER] WHERE OrderID = @OrderID;

    IF @Status IS NULL
    BEGIN
        THROW 50010, 'Order not found.', 1;
    END;
    IF @Status NOT IN ('Pending Verification', 'Under Staff Review')
    BEGIN
        THROW 50011, 'Menu items can only be changed before the quotation is prepared.', 1;
    END;
    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE MenuItemID = @MenuItemID)
    BEGIN
        THROW 50012, 'Menu item not found.', 1;
    END;
    IF @Quantity <= 0
    BEGIN
        THROW 50013, 'Quantity must be greater than zero.', 1;
    END;

    IF EXISTS (SELECT 1 FROM dbo.ORDER_MENU_ITEM WHERE OrderID = @OrderID AND MenuItemID = @MenuItemID)
        UPDATE dbo.ORDER_MENU_ITEM
        SET Quantity = Quantity + @Quantity
        WHERE OrderID = @OrderID AND MenuItemID = @MenuItemID;
    ELSE
        INSERT INTO dbo.ORDER_MENU_ITEM (OrderID, MenuItemID, Quantity)
        VALUES (@OrderID, @MenuItemID, @Quantity);
END;
GO

/* ---- change order status, only along allowed steps ---- */
CREATE PROCEDURE dbo.UpdateOrderStatus
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

        /* the trigger trg_Order_StatusHistory just wrote the history row; record who did it */
        UPDATE dbo.ORDER_STATUS_HISTORY
        SET ChangedByStaffID = @StaffID
        WHERE StatusHistoryID = (SELECT MAX(StatusHistoryID)
                                 FROM dbo.ORDER_STATUS_HISTORY
                                 WHERE OrderID = @OrderID AND Status = @NewStatus);

    COMMIT TRANSACTION;
END;
GO

/* ---- build a Draft quotation from the order: package + menu items + 10% service charge ---- */
CREATE PROCEDURE dbo.BuildQuotationFromOrder
    @OrderID     INT,
    @QuotationID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Status VARCHAR(50);
    SELECT @Status = Status FROM dbo.[ORDER] WHERE OrderID = @OrderID;

    IF @Status IS NULL
    BEGIN
        THROW 50030, 'Order not found.', 1;
    END;
    IF @Status <> 'Under Staff Review'
    BEGIN
        THROW 50031, 'A quotation can only be built while the order is Under Staff Review.', 1;
    END;
    IF EXISTS (SELECT 1 FROM dbo.QUOTATION WHERE OrderID = @OrderID)
    BEGIN
        THROW 50032, 'This order already has a quotation.', 1;
    END;

    DECLARE @ItemBase INT;
    DECLARE @Subtotal DECIMAL(10,2);

    BEGIN TRANSACTION;

        SELECT @QuotationID = ISNULL(MAX(QuotationID), 0) + 1 FROM dbo.QUOTATION WITH (UPDLOCK, HOLDLOCK);
        SELECT @ItemBase    = ISNULL(MAX(QuotationItemID), 0)  FROM dbo.QUOTATION_ITEM WITH (UPDLOCK, HOLDLOCK);

        INSERT INTO dbo.QUOTATION (QuotationID, OrderID, QuotationDate, TotalAmount, Status)
        VALUES (@QuotationID, @OrderID, CAST(GETDATE() AS DATE), 0, 'Draft');

        INSERT INTO dbo.QUOTATION_ITEM (QuotationItemID, QuotationID, Description, Quantity, UnitPrice)
        SELECT @ItemBase + ROW_NUMBER() OVER (ORDER BY src.SortKey, src.Description),
               @QuotationID, src.Description, src.Quantity, src.UnitPrice
        FROM (
            SELECT 0 AS SortKey,
                   CAST(p.PackageName + ' - base package' AS VARCHAR(200)) AS Description,
                   CAST(1 AS DECIMAL(10,2)) AS Quantity,
                   p.Price AS UnitPrice
            FROM dbo.[ORDER] o
            INNER JOIN dbo.CateringPackage p ON p.PackageID = o.PackageID
            WHERE o.OrderID = @OrderID
            UNION ALL
            SELECT 1,
                   CAST(m.ItemName AS VARCHAR(200)),
                   CAST(omi.Quantity AS DECIMAL(10,2)),
                   m.Price
            FROM dbo.ORDER_MENU_ITEM omi
            INNER JOIN dbo.MenuItem m ON m.MenuItemID = omi.MenuItemID
            WHERE omi.OrderID = @OrderID
        ) AS src;

        /* the trigger trg_QuotationItem_RecalcTotal has set the subtotal; now add the service charge */
        SELECT @Subtotal = TotalAmount FROM dbo.QUOTATION WHERE QuotationID = @QuotationID;

        INSERT INTO dbo.QUOTATION_ITEM (QuotationItemID, QuotationID, Description, Quantity, UnitPrice)
        SELECT ISNULL(MAX(QuotationItemID), 0) + 1, @QuotationID, 'Service charge (10%)', 1,
               dbo.CalculateServiceCharge(@Subtotal)
        FROM dbo.QUOTATION_ITEM;

    COMMIT TRANSACTION;
END;
GO

/* ---- record a payment; refuses overpayment and unaccepted quotations ---- */
CREATE PROCEDURE dbo.AddPayment
    @OrderID      INT,
    @Amount       DECIMAL(10,2),
    @PaymentType  VARCHAR(20),
    @NewPaymentID INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @QStatus VARCHAR(20);
    SELECT @QStatus = Status FROM dbo.QUOTATION WHERE OrderID = @OrderID;

    IF @QStatus IS NULL
    BEGIN
        THROW 50040, 'This order has no quotation.', 1;
    END;
    IF @QStatus <> 'Accepted'
    BEGIN
        THROW 50041, 'The quotation must be Accepted before payments are taken.', 1;
    END;
    IF @PaymentType NOT IN ('Advance', 'Balance')
    BEGIN
        THROW 50042, 'Payment type must be Advance or Balance.', 1;
    END;
    IF @Amount <= 0
    BEGIN
        THROW 50043, 'Payment amount must be greater than zero.', 1;
    END;
    IF @Amount > dbo.GetRemainingPayment(@OrderID)
    BEGIN
        THROW 50044, 'Payment is more than the remaining balance.', 1;
    END;

    BEGIN TRANSACTION;

        SELECT @NewPaymentID = ISNULL(MAX(PaymentID), 0) + 1 FROM dbo.PAYMENT WITH (UPDLOCK, HOLDLOCK);

        INSERT INTO dbo.PAYMENT (PaymentID, OrderID, PaymentDate, Amount, PaymentType, PaymentStatus)
        VALUES (@NewPaymentID, @OrderID, GETDATE(), @Amount, @PaymentType, 'Paid');

    COMMIT TRANSACTION;
END;
GO

/* ---- assign a delivery staff member; location is taken from the event ---- */
CREATE PROCEDURE dbo.AssignDelivery
    @OrderID      INT,
    @StaffID      INT,
    @DeliveryDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Status   VARCHAR(50);
    DECLARE @Role     VARCHAR(50);
    DECLARE @Location VARCHAR(200);
    DECLARE @NewID    INT;

    SELECT @Status = Status FROM dbo.[ORDER] WHERE OrderID = @OrderID;
    SELECT @Role   = Role   FROM dbo.STAFF    WHERE StaffID = @StaffID;
    SELECT @Location = Location FROM dbo.[EVENT] WHERE OrderID = @OrderID;

    IF @Status IS NULL
    BEGIN
        THROW 50050, 'Order not found.', 1;
    END;
    IF @Role IS NULL OR @Role <> 'DELIVERY_STAFF'
    BEGIN
        THROW 50051, 'The selected staff member is not delivery staff.', 1;
    END;
    IF @Status NOT IN ('Confirmed', 'Preparing', 'Ready for Delivery')
    BEGIN
        THROW 50052, 'Delivery can only be assigned to Confirmed, Preparing or Ready orders.', 1;
    END;
    IF @Location IS NULL
    BEGIN
        THROW 50053, 'The order has no event location.', 1;
    END;
    IF EXISTS (SELECT 1 FROM dbo.DELIVERY WHERE OrderID = @OrderID)
    BEGIN
        THROW 50054, 'A delivery is already assigned to this order.', 1;
    END;

    BEGIN TRANSACTION;

        SELECT @NewID = ISNULL(MAX(DeliveryID), 0) + 1 FROM dbo.DELIVERY WITH (UPDLOCK, HOLDLOCK);

        INSERT INTO dbo.DELIVERY (DeliveryID, OrderID, StaffID, DeliveryDate, DeliveryStatus, Location)
        VALUES (@NewID, @OrderID, @StaffID, @DeliveryDate, 'Assigned', @Location);

    COMMIT TRANSACTION;
END;
GO

/* ---- inventory coordinator: is there enough stock for this order? ---- */
CREATE PROCEDURE dbo.CheckInventoryForOrder
    @OrderID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT i.InventoryItemID,
           i.ItemName,
           i.Unit,
           n.RequiredQty,
           i.Quantity AS InStock,
           CASE WHEN i.Quantity >= n.RequiredQty THEN 'OK' ELSE 'SHORT' END AS Result,
           CASE WHEN i.Quantity <  n.RequiredQty THEN n.RequiredQty - i.Quantity ELSE 0 END AS Shortfall
    FROM dbo.GetInventoryNeedForOrder(@OrderID) n
    INNER JOIN dbo.INVENTORY_ITEM i ON i.InventoryItemID = n.InventoryItemID
    ORDER BY i.ItemName;
END;
GO

/* ---- take the ingredients out of stock (once per order) ---- */
CREATE PROCEDURE dbo.DeductInventoryForOrder
    @OrderID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Deducted BIT;
    SELECT @Deducted = InventoryDeducted FROM dbo.[ORDER] WHERE OrderID = @OrderID;

    IF @Deducted IS NULL
    BEGIN
        THROW 50060, 'Order not found.', 1;
    END;
    IF @Deducted = 1
    BEGIN
        THROW 50061, 'Inventory has already been deducted for this order.', 1;
    END;
    IF EXISTS (SELECT 1
               FROM dbo.GetInventoryNeedForOrder(@OrderID) n
               INNER JOIN dbo.INVENTORY_ITEM i ON i.InventoryItemID = n.InventoryItemID
               WHERE i.Quantity < n.RequiredQty)
    BEGIN
        THROW 50062, 'Not enough stock for this order. Run CheckInventoryForOrder to see the shortfall.', 1;
    END;

    BEGIN TRANSACTION;

        UPDATE i
        SET i.Quantity = i.Quantity - n.RequiredQty
        FROM dbo.INVENTORY_ITEM i
        INNER JOIN dbo.GetInventoryNeedForOrder(@OrderID) n ON n.InventoryItemID = i.InventoryItemID;

        UPDATE dbo.[ORDER] SET InventoryDeducted = 1 WHERE OrderID = @OrderID;

    COMMIT TRANSACTION;
END;
GO

/* ------------------------------------------------------------------------------
   7b - PROCEDURES ADDED FOR THE DDD ASSIGNMENT 02 MODULE FILES (SQL_Modules folder)
   The same code is in the 7 module files. CREATE OR ALTER means they can be re-run.
   ------------------------------------------------------------------------------ */

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

-- ==========================================================================
-- Part 5: Stored Procedure
-- ==========================================================================
-- Feature: change every price in one category by a percentage (negative = discount).
-- Shows the changed rows when finished.
CREATE OR ALTER PROCEDURE dbo.ApplyCategoryPriceChange
    @Category VARCHAR(50),
    @Percent  DECIMAL(5,2)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE Category = @Category)
    BEGIN
        THROW 50201, 'No menu items were found in this category.', 1;
    END;

    UPDATE dbo.MenuItem
    SET Price = ROUND(Price * (1 + @Percent / 100.0), 2)
    WHERE Category = @Category;

    SELECT MenuItemID, ItemName, Category, Price
    FROM dbo.MenuItem
    WHERE Category = @Category
    ORDER BY MenuItemID;
END;
GO

-- ==========================================================================
-- Part 5: Stored Procedure
-- ==========================================================================
-- Feature: add a menu item to a package. If the item is already in the package, its quantity grows.
CREATE OR ALTER PROCEDURE dbo.AddMenuItemToPackage
    @PackageID  INT,
    @MenuItemID INT,
    @Quantity   INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.CateringPackage WHERE PackageID = @PackageID)
    BEGIN
        THROW 50301, 'Package not found.', 1;
    END;
    IF NOT EXISTS (SELECT 1 FROM dbo.MenuItem WHERE MenuItemID = @MenuItemID)
    BEGIN
        THROW 50302, 'Menu item not found.', 1;
    END;
    IF @Quantity <= 0
    BEGIN
        THROW 50303, 'Quantity must be greater than zero.', 1;
    END;

    IF EXISTS (SELECT 1 FROM dbo.PACKAGE_MENU_ITEM WHERE PackageID = @PackageID AND MenuItemID = @MenuItemID)
        UPDATE dbo.PACKAGE_MENU_ITEM
        SET Quantity = Quantity + @Quantity
        WHERE PackageID = @PackageID AND MenuItemID = @MenuItemID;
    ELSE
        INSERT INTO dbo.PACKAGE_MENU_ITEM (PackageID, MenuItemID, Quantity)
        VALUES (@PackageID, @MenuItemID, @Quantity);
END;
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

-- ==========================================================================
-- Part 5: Stored Procedure
-- ==========================================================================
-- Feature: record a delivery of stock from a supplier - add the quantity to an ingredient.
-- Shows the new stock level and whether it is still low.
CREATE OR ALTER PROCEDURE dbo.RestockInventoryItem
    @InventoryItemID INT,
    @AddedQuantity   DECIMAL(12,3)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.INVENTORY_ITEM WHERE InventoryItemID = @InventoryItemID)
    BEGIN
        THROW 50701, 'Inventory item not found.', 1;
    END;
    IF @AddedQuantity <= 0
    BEGIN
        THROW 50702, 'The added quantity must be greater than zero.', 1;
    END;

    UPDATE dbo.INVENTORY_ITEM
    SET Quantity = Quantity + @AddedQuantity
    WHERE InventoryItemID = @InventoryItemID;

    SELECT InventoryItemID, ItemName, Quantity, Unit, ReorderLevel,
           CASE WHEN Quantity <= ReorderLevel THEN 'LOW' ELSE 'OK' END AS StockStatus
    FROM dbo.INVENTORY_ITEM
    WHERE InventoryItemID = @InventoryItemID;
END;
GO

/* ==============================================================================
   PART 8 - TRIGGERS
   ============================================================================== */

/* T1: every new order and every status change is written to ORDER_STATUS_HISTORY */
CREATE TRIGGER dbo.trg_Order_StatusHistory
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

/* T2: quotation total = sum of its item lines, kept up to date automatically */
CREATE TRIGGER dbo.trg_QuotationItem_RecalcTotal
ON dbo.QUOTATION_ITEM
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE q
    SET q.TotalAmount = ISNULL((SELECT SUM(qi.LineTotal)
                                FROM dbo.QUOTATION_ITEM qi
                                WHERE qi.QuotationID = q.QuotationID), 0)
    FROM dbo.QUOTATION q
    WHERE q.QuotationID IN (SELECT QuotationID FROM inserted
                            UNION
                            SELECT QuotationID FROM deleted);
END;
GO

/* T3: after a payment is inserted
       (a) block it if paid total would exceed the quotation total
       (b) confirm the order when the quotation is Accepted and fully paid */
CREATE TRIGGER dbo.trg_Payment_AfterInsert
ON dbo.PAYMENT
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM dbo.QUOTATION q
        INNER JOIN (SELECT DISTINCT OrderID FROM inserted) i ON i.OrderID = q.OrderID
        WHERE (SELECT ISNULL(SUM(p.Amount), 0)
               FROM dbo.PAYMENT p
               WHERE p.OrderID = q.OrderID AND p.PaymentStatus = 'Paid') > q.TotalAmount)
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50070, 'Total paid amount cannot be more than the quotation total.', 1;
    END;

    UPDATE o
    SET o.Status = 'Confirmed'
    FROM dbo.[ORDER] o
    INNER JOIN (SELECT DISTINCT OrderID FROM inserted) i ON i.OrderID = o.OrderID
    INNER JOIN dbo.QUOTATION q ON q.OrderID = o.OrderID
    WHERE q.Status = 'Accepted'
      AND (SELECT ISNULL(SUM(p.Amount), 0)
           FROM dbo.PAYMENT p
           WHERE p.OrderID = o.OrderID AND p.PaymentStatus = 'Paid') >= q.TotalAmount
      AND o.Status IN ('Quotation Ready', 'Customer Confirmation Pending', 'Payment Pending');
END;
GO

/* T4: when a delivery is marked Delivered, the order becomes Delivered */
CREATE TRIGGER dbo.trg_Delivery_UpdateOrder
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

/* ------------------------------------------------------------------------------
   8b - TRIGGERS ADDED FOR THE DDD ASSIGNMENT 02 MODULE FILES (SQL_Modules folder)
   They also apply to the web app:
     Staff     - the last ADMIN cannot be demoted or removed
     Menu      - a price cannot rise by more than 50% in one change
     Package   - a package can hold at most 6 different menu items
     Event     - date / place are locked once the order is Preparing or later
     Inventory - a low-stock row is added to INVENTORY_ALERT automatically
   ------------------------------------------------------------------------------ */

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

-- ==========================================================================
-- Part 6: Trigger
-- ==========================================================================
-- Feature: protect customers from sudden price jumps.
-- After an UPDATE of Price, if any item rose by more than 50% the change is cancelled.
CREATE OR ALTER TRIGGER dbo.trg_MenuItem_LimitPriceIncrease
ON dbo.MenuItem
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(Price)
       AND EXISTS (SELECT 1
                   FROM inserted i
                   INNER JOIN deleted d ON d.MenuItemID = i.MenuItemID
                   WHERE d.Price > 0 AND i.Price > d.Price * 1.5)
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50202, 'A menu price cannot rise by more than 50% in one change.', 1;
    END;
END;
GO

-- ==========================================================================
-- Part 6: Trigger
-- ==========================================================================
-- Feature: a package may contain at most 6 different menu items.
-- After an INSERT into PACKAGE_MENU_ITEM, a package that goes over the limit cancels the insert.
CREATE OR ALTER TRIGGER dbo.trg_PackageMenuItem_MaxItems
ON dbo.PACKAGE_MENU_ITEM
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1
               FROM dbo.PACKAGE_MENU_ITEM p
               WHERE p.PackageID IN (SELECT PackageID FROM inserted)
               GROUP BY p.PackageID
               HAVING COUNT(*) > 6)
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50304, 'A package can contain at most 6 different menu items.', 1;
    END;
END;
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

-- ==========================================================================
-- Part 6: Trigger
-- ==========================================================================
-- Feature: automatic low-stock warning. When an UPDATE takes an ingredient from above its
-- reorder level down to or below it, a row is added to INVENTORY_ALERT.
CREATE OR ALTER TRIGGER dbo.trg_InventoryItem_LowStockAlert
ON dbo.INVENTORY_ITEM
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.INVENTORY_ALERT (AlertID, InventoryItemID, AlertDate, QuantityLeft, ReorderLevel, Message)
    SELECT (SELECT ISNULL(MAX(AlertID), 0) FROM dbo.INVENTORY_ALERT)
               + ROW_NUMBER() OVER (ORDER BY i.InventoryItemID),
           i.InventoryItemID, GETDATE(), i.Quantity, i.ReorderLevel,
           CONCAT(i.ItemName, ' is at or below its reorder level.')
    FROM inserted i
    INNER JOIN deleted d ON d.InventoryItemID = i.InventoryItemID
    WHERE i.Quantity <= i.ReorderLevel
      AND d.Quantity  >  d.ReorderLevel;
END;
GO

/* ==============================================================================
   PART 9 - ORDER-RELATED SAMPLE DATA
   Orders start as 'Pending Verification' and are moved step by step with UPDATE
   statements, so trigger T1 records the full history by itself.
   ============================================================================== */

/* 9.1 orders, events, chosen menu items */
INSERT INTO dbo.[ORDER] (OrderID, CustomerID, PackageID, OrderDate, SpecialRequests, PreparedByStaffID) VALUES
(1, 1, 1, '2026-08-10', 'Vegetarian options for 20 guests',          3),
(2, 2, 2, '2026-09-20', 'Chocolate dessert for the birthday child',  NULL),
(3, 3, 3, '2026-09-25', 'Buffet layout near the projector area',     NULL),
(4, 4, 4, '2026-09-27', NULL,                                        NULL),
(5, 5, 2, '2026-09-30', NULL,                                        NULL),
(6, 6, 1, '2026-09-05', NULL,                                        NULL),
(7, 1, 3, '2026-09-18', 'Tea and coffee station at the entrance',    4);

INSERT INTO dbo.[EVENT] (EventID, OrderID, EventDate, Location, GuestCount, EventType, StartTime) VALUES
(1, 1, '2026-09-12', 'Grand Ballroom, Colombo 03',          150, 'Wedding',   '18:00'),
(2, 2, '2026-10-18', 'Private residence, Nugegoda',          40, 'Birthday',  '12:30'),
(3, 3, '2026-10-22', 'Business Park Hall, Colombo 02',       80, 'Corporate', '10:00'),
(4, 4, '2026-11-15', 'Seaside Hotel Ballroom, Colombo 03',  200, 'Gala',      '19:00'),
(5, 5, '2026-10-30', 'Private residence, Kandy',             30, 'Birthday',  '13:00'),
(6, 6, '2026-10-05', 'Garden Venue, Negombo',               120, 'Wedding',   '17:00'),
(7, 7, '2026-10-04', 'Conference Hall, Colombo 05',          60, 'Corporate', '09:00');

INSERT INTO dbo.ORDER_MENU_ITEM (OrderID, MenuItemID, Quantity) VALUES
(1, 1, 150), (1, 2, 150), (1, 3, 150),
(2, 6, 40),  (2, 3, 40),  (2, 1, 40),
(3, 1, 80),  (3, 2, 80),  (3, 8, 80),
(4, 4, 200), (4, 5, 100), (4, 6, 200),
(5, 1, 30),  (5, 7, 30),
(6, 1, 120), (6, 3, 120),
(7, 1, 60),  (7, 2, 60),  (7, 4, 20);
GO

/* 9.2 staff review */
UPDATE dbo.[ORDER] SET Status = 'Under Staff Review' WHERE OrderID IN (1, 2, 3, 4, 6, 7);

INSERT INTO dbo.ORDER_REVIEW (OrderReviewID, OrderID, StaffID, ReviewDate, ReviewStatus, Comments) VALUES
(1, 1, 2, '2026-08-11T00:00:00', 'Approved', 'Menu and guest count verified'),
(2, 2, 2, '2026-09-21T00:00:00', 'Approved', 'Details are complete'),
(3, 3, 2, '2026-09-26T00:00:00', 'Approved', 'Venue confirmed with the customer'),
(4, 4, 2, '2026-09-28T00:00:00', 'Changes Requested', 'Please confirm the final guest count and venue access time'),
(5, 7, 2, '2026-09-19T00:00:00', 'Approved', 'Details are complete');

/* 9.3 order 6 is cancelled by the customer */
INSERT INTO dbo.ORDER_REQUEST (RequestID, OrderID, RequestType, RequestDate, Reason, RequestedEventDate, RequestStatus, ReviewedByStaffID, ReviewDate, Response) VALUES
(1, 6, 'Cancellation', '2026-09-08T00:00:00', 'Venue changed, event postponed', NULL, 'Approved', 2, '2026-09-09T00:00:00', 'Approved - no payment had been made'),
(2, 2, 'Rescheduling', '2026-09-28T00:00:00', 'Family function moved', '2026-10-25', 'Pending', NULL, NULL, NULL);

UPDATE dbo.[ORDER] SET Status = 'Cancelled' WHERE OrderID = 6;

/* 9.4 quotations. TotalAmount starts at 0; trigger T2 fills it in from the items */
INSERT INTO dbo.QUOTATION (QuotationID, OrderID, QuotationDate, TotalAmount, Status) VALUES
(1, 1, '2026-08-12', 0, 'Accepted'),
(2, 2, '2026-09-22', 0, 'Accepted'),
(3, 3, '2026-09-27', 0, 'Sent'),
(4, 7, '2026-09-20', 0, 'Accepted');

INSERT INTO dbo.QUOTATION_ITEM (QuotationItemID, QuotationID, Description, Quantity, UnitPrice) VALUES
(1,  1, 'Wedding Package - base package', 1,   50000.00),
(2,  1, 'Chicken Rice',                   150,    800.00),
(3,  1, 'Vegetable Salad',                150,    400.00),
(4,  1, 'Fruit Juice',                    150,    300.00),
(5,  1, 'Service charge (10%)',           1,    27500.00),
(6,  2, 'Birthday Package - base package',1,    30000.00),
(7,  2, 'Chocolate Fondant',              40,     900.00),
(8,  2, 'Fruit Juice',                    40,     300.00),
(9,  2, 'Chicken Rice',                   40,     800.00),
(10, 2, 'Service charge (10%)',           1,    11000.00),
(11, 3, 'Corporate Package - base package',1,   40000.00),
(12, 3, 'Chicken Rice',                   80,     800.00),
(13, 3, 'Vegetable Salad',                80,     400.00),
(14, 3, 'Iced Coffee',                    80,     350.00),
(15, 3, 'Service charge (10%)',           1,    16400.00),
(16, 4, 'Corporate Package - base package',1,   40000.00),
(17, 4, 'Chicken Rice',                   60,     800.00),
(18, 4, 'Vegetable Salad',                60,     400.00),
(19, 4, 'Grilled Salmon',                 20,    2200.00),
(20, 4, 'Service charge (10%)',           1,    15600.00);

/* 9.5 customers accept quotations */
UPDATE dbo.[ORDER] SET Status = 'Quotation Ready'              WHERE OrderID IN (1, 2, 3, 7);
UPDATE dbo.[ORDER] SET Status = 'Customer Confirmation Pending' WHERE OrderID IN (1, 2, 7);
UPDATE dbo.[ORDER]
SET Status = 'Payment Pending',
    CustomerConfirmedDate = CASE OrderID WHEN 1 THEN '2026-08-18'
                                         WHEN 2 THEN '2026-09-25'
                                         ELSE        '2026-09-22' END
WHERE OrderID IN (1, 2, 7);

/* 9.6 payments. Trigger T3 confirms orders 1 and 7 once they are fully paid */
INSERT INTO dbo.PAYMENT (PaymentID, OrderID, PaymentDate, Amount, PaymentType, PaymentStatus) VALUES
(1, 1, '2026-08-20T10:30:00', 151250.00, 'Advance', 'Paid'),
(2, 1, '2026-09-05T14:15:00', 151250.00, 'Balance', 'Paid'),
(3, 2, '2026-09-26T11:00:00', 60500.00, 'Advance', 'Paid'),
(4, 7, '2026-09-23T09:45:00', 85800.00, 'Advance', 'Paid'),
(5, 7, '2026-09-30T16:20:00', 85800.00, 'Balance', 'Paid');

/* 9.7 kitchen and delivery for orders 1 and 7 */
UPDATE dbo.[ORDER] SET Status = 'Preparing'          WHERE OrderID IN (1, 7);
UPDATE dbo.[ORDER] SET Status = 'Ready for Delivery' WHERE OrderID = 1;
UPDATE dbo.[ORDER] SET InventoryDeducted = 1         WHERE OrderID = 1;   -- stock levels above already reflect order 1

INSERT INTO dbo.DELIVERY (DeliveryID, OrderID, StaffID, DeliveryDate, DeliveryStatus, Location) VALUES
(1, 1, 5, '2026-09-12', 'Assigned', 'Grand Ballroom, Colombo 03'),
(2, 7, 6, '2026-10-04', 'Assigned', 'Conference Hall, Colombo 05');

UPDATE dbo.DELIVERY SET DeliveryStatus = 'Out for Delivery' WHERE DeliveryID = 1;
UPDATE dbo.DELIVERY SET DeliveryStatus = 'Delivered'        WHERE DeliveryID = 1;   -- trigger T4 -> order 1 becomes Delivered

/* order 7 is being prepared: take its ingredients out of stock */
EXEC dbo.DeductInventoryForOrder @OrderID = 7;
GO

/* ==============================================================================
   PART 10 - EXAMPLE QUERIES
   ============================================================================== */

/* Q1 (Lab 02) INNER JOIN 3 tables: every order with customer and package */
SELECT o.OrderID, c.Name AS Customer, p.PackageName, o.OrderDate, o.Status
FROM dbo.[ORDER] o
INNER JOIN dbo.CUSTOMER c        ON c.CustomerID = o.CustomerID
INNER JOIN dbo.CateringPackage p ON p.PackageID  = o.PackageID
ORDER BY o.OrderID;

/* Q2 (Lab 02) WHERE after a join: events in October 2026 with 50 or more guests */
SELECT o.OrderID, e.EventDate, e.Location, e.GuestCount
FROM dbo.[ORDER] o
INNER JOIN dbo.[EVENT] e ON e.OrderID = o.OrderID
WHERE e.EventDate BETWEEN '2026-10-01' AND '2026-10-31'
  AND e.GuestCount >= 50
ORDER BY e.EventDate;

/* Q3 (Lab 02) GROUP BY + HAVING: customers with 2 or more orders */
SELECT c.CustomerID, c.Name, COUNT(*) AS OrderCount
FROM dbo.CUSTOMER c
INNER JOIN dbo.[ORDER] o ON o.CustomerID = c.CustomerID
GROUP BY c.CustomerID, c.Name
HAVING COUNT(*) >= 2;

/* Q4 (Lab 05) SUM per group: money received per package */
SELECT p.PackageName, SUM(pay.Amount) AS TotalReceived
FROM dbo.PAYMENT pay
INNER JOIN dbo.[ORDER] o         ON o.OrderID   = pay.OrderID
INNER JOIN dbo.CateringPackage p ON p.PackageID = o.PackageID
WHERE pay.PaymentStatus = 'Paid'
GROUP BY p.PackageName
ORDER BY TotalReceived DESC;

/* Q5 (Lab 05) COUNT(DISTINCT): how many different customers booked each package */
SELECT p.PackageName, COUNT(DISTINCT o.CustomerID) AS DifferentCustomers
FROM dbo.CateringPackage p
LEFT JOIN dbo.[ORDER] o ON o.PackageID = p.PackageID
GROUP BY p.PackageName;

/* Q6 (Lab 05) subquery: orders whose quotation is fully paid */
SELECT o.OrderID, o.Status
FROM dbo.[ORDER] o
WHERE o.OrderID IN (SELECT q.OrderID
                    FROM dbo.QUOTATION q
                    WHERE q.TotalAmount <= (SELECT ISNULL(SUM(p.Amount), 0)
                                            FROM dbo.PAYMENT p
                                            WHERE p.OrderID = q.OrderID AND p.PaymentStatus = 'Paid'));

/* Q7 (Lab 02) LEFT JOIN: orders that do not have a quotation yet */
SELECT o.OrderID, o.Status
FROM dbo.[ORDER] o
LEFT JOIN dbo.QUOTATION q ON q.OrderID = o.OrderID
WHERE q.QuotationID IS NULL;

/* Q8 (Lab 06) views */
SELECT * FROM dbo.vw_OrderSummary ORDER BY OrderID;
SELECT * FROM dbo.vw_PaymentSummary WHERE RemainingBalance > 0;
SELECT * FROM dbo.vw_LowStockItems;
SELECT * FROM dbo.vw_PendingDeliveries;
SELECT * FROM dbo.vw_PopularMenuItems ORDER BY TotalServings DESC;
SELECT * FROM dbo.vw_MonthlyRevenue ORDER BY PaymentYear, PaymentMonth;
SELECT * FROM dbo.vw_StaffWorkload;

/* Q9 (Lab 06) functions */
SELECT OrderID,
       dbo.GetOrderMenuTotal(OrderID)   AS MenuValue,
       dbo.GetOrderTotalPayment(OrderID) AS Paid,
       dbo.GetRemainingPayment(OrderID)  AS Remaining,
       dbo.GetPaymentStatus(OrderID)     AS PaymentStatus
FROM dbo.[ORDER];

/* Q10 trigger T1 result: full status history of order 1 */
SELECT h.StatusHistoryID, h.Status, h.ChangedDate
FROM dbo.ORDER_STATUS_HISTORY h
WHERE h.OrderID = 1
ORDER BY h.StatusHistoryID;

/* Q11 inventory check: order 4 (Gala, 200 fondants) needs more Dark Chocolate than is in stock */
EXEC dbo.CheckInventoryForOrder @OrderID = 4;

/* ---- PROCEDURE DEMOS (remove the comment marks to try them) ----

-- create a new order + event
DECLARE @NewOrder INT;
EXEC dbo.CreateOrderWithEvent @CustomerID = 3, @PackageID = 2, @SpecialRequests = 'No nuts',
     @EventDate = '2026-12-20', @Location = 'Private residence, Galle', @GuestCount = 35,
     @EventType = 'Birthday', @StartTime = '14:00', @NewOrderID = @NewOrder OUTPUT;
EXEC dbo.AddOrderItem @OrderID = @NewOrder, @MenuItemID = 1, @Quantity = 35;
EXEC dbo.UpdateOrderStatus @OrderID = @NewOrder, @NewStatus = 'Under Staff Review', @StaffID = 2;
DECLARE @Q INT;
EXEC dbo.BuildQuotationFromOrder @OrderID = @NewOrder, @QuotationID = @Q OUTPUT;
SELECT * FROM dbo.QUOTATION_ITEM WHERE QuotationID = @Q;

-- take the balance for order 2 (60,500.00 remaining)
EXEC dbo.AddPayment @OrderID = 2, @Amount = 60500.00, @PaymentType = 'Balance';

-- a wrong status jump is rejected
EXEC dbo.UpdateOrderStatus @OrderID = 5, @NewStatus = 'Delivered';

-- assign delivery for order 2 after it is confirmed
EXEC dbo.AssignDelivery @OrderID = 2, @StaffID = 5, @DeliveryDate = '2026-10-18';

-- order 4 needs more Dark Chocolate than is in stock, so this raises an error
EXEC dbo.DeductInventoryForOrder @OrderID = 4;
---- */

/* Row count of every table */
SELECT 'CUSTOMER' AS TableName, COUNT(*) AS Rows FROM dbo.CUSTOMER
UNION ALL SELECT 'STAFF',                COUNT(*) FROM dbo.STAFF
UNION ALL SELECT 'CUSTOMER_ACCOUNT',     COUNT(*) FROM dbo.CUSTOMER_ACCOUNT
UNION ALL SELECT 'STAFF_ACCOUNT',        COUNT(*) FROM dbo.STAFF_ACCOUNT
UNION ALL SELECT 'MenuItem',             COUNT(*) FROM dbo.MenuItem
UNION ALL SELECT 'CateringPackage',      COUNT(*) FROM dbo.CateringPackage
UNION ALL SELECT 'PACKAGE_MENU_ITEM',    COUNT(*) FROM dbo.PACKAGE_MENU_ITEM
UNION ALL SELECT 'INVENTORY_ITEM',       COUNT(*) FROM dbo.INVENTORY_ITEM
UNION ALL SELECT 'RECIPE',               COUNT(*) FROM dbo.RECIPE
UNION ALL SELECT 'RECIPE_INGREDIENT',    COUNT(*) FROM dbo.RECIPE_INGREDIENT
UNION ALL SELECT 'ORDER',                COUNT(*) FROM dbo.[ORDER]
UNION ALL SELECT 'EVENT',                COUNT(*) FROM dbo.[EVENT]
UNION ALL SELECT 'ORDER_MENU_ITEM',      COUNT(*) FROM dbo.ORDER_MENU_ITEM
UNION ALL SELECT 'ORDER_STATUS_HISTORY', COUNT(*) FROM dbo.ORDER_STATUS_HISTORY
UNION ALL SELECT 'ORDER_REVIEW',         COUNT(*) FROM dbo.ORDER_REVIEW
UNION ALL SELECT 'ORDER_REQUEST',        COUNT(*) FROM dbo.ORDER_REQUEST
UNION ALL SELECT 'QUOTATION',            COUNT(*) FROM dbo.QUOTATION
UNION ALL SELECT 'QUOTATION_ITEM',       COUNT(*) FROM dbo.QUOTATION_ITEM
UNION ALL SELECT 'PAYMENT',              COUNT(*) FROM dbo.PAYMENT
UNION ALL SELECT 'DELIVERY',             COUNT(*) FROM dbo.DELIVERY;
GO
