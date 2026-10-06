-- ==========================================================================
-- 03_Package_Management.sql
-- Module  : Package management
-- Project : Aurelia Catering System          Database : AureliaCatering2 (SQL Server / T-SQL)
-- Course  : IT2140 Database Design and Development - DDD Assignment 02
-- Student : ______________________________   Student ID : ______________
-- ==========================================================================
-- Catering packages and the menu items each package contains.
--
-- This module's tables : CateringPackage, PACKAGE_MENU_ITEM
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
-- Entities    : CateringPackage (a ready-made offer, e.g. Wedding Package)
--               MenuItem         (supporting - owned by the Menu module)
-- Attributes  : CateringPackage (PackageID PK, PackageName UNIQUE, Description, Price)
--               PACKAGE_MENU_ITEM (PackageID, MenuItemID, Quantity)
--
-- Relationship: CateringPackage M --- N MenuItem  ("a package contains many menu items; a menu
--               item can be in many packages"). A many-to-many relationship becomes a table of its
--               own: PACKAGE_MENU_ITEM, with Quantity as the relationship attribute.
-- ISA         : CateringPackage is specialised by occasion into five subclasses:
--                 Wedding, Birthday, Corporate, Gala and General (any other offer).
--               Disjoint (a package is of exactly one type) and total (every package has a type;
--               General is the default).
-- ISA mapping : SINGLE-TABLE mapping. The subclasses share all attributes, so they stay in the one
--               CateringPackage table and the column PackageType is the discriminator (a CHECK
--               limits it to the five values). (EER note: draw CateringPackage with a disjoint,
--               total specialisation to the five types.)
--
-- Relational schema:
--     CateringPackage   (PackageID PK, PackageName UNIQUE, Description, Price CHECK >= 0,
--                        PackageType CHECK IN the five types, DEFAULT 'General')
--     PACKAGE_MENU_ITEM (PackageID PK/FK -> CateringPackage, MenuItemID PK/FK -> MenuItem,
--                        Quantity CHECK > 0)
--
-- Primary keys: CateringPackage.PackageID ; PACKAGE_MENU_ITEM (PackageID, MenuItemID) composite
-- Foreign keys: PACKAGE_MENU_ITEM.PackageID  -> CateringPackage.PackageID
--               PACKAGE_MENU_ITEM.MenuItemID -> MenuItem.MenuItemID
--               ORDER.PackageID -> CateringPackage.PackageID   (Order module points here)
--
--     CateringPackage 1 ----< PACKAGE_MENU_ITEM >---- 1 MenuItem

-- ==========================================================================
-- Part 2: Table Creation
-- Each table is created only if it does not exist yet.
-- ==========================================================================
-- Part 2A: supporting tables owned by other modules (needed for the foreign keys) - skip when presenting

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

-- Part 2B: this module's tables

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

IF OBJECT_ID(N'dbo.PACKAGE_MENU_ITEM', N'U') IS NULL
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

-- ==========================================================================
-- Part 3: Sample Data
-- Each row is inserted only if its key is not there yet (WHERE NOT EXISTS), so the file can be run twice.
-- ==========================================================================
-- Part 3A: supporting rows from other modules - skip when presenting

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

-- Part 3B: this module's rows

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

INSERT INTO dbo.PACKAGE_MENU_ITEM (PackageID, MenuItemID, Quantity)
SELECT v.PackageID, v.MenuItemID, v.Quantity
FROM (VALUES
    (1, 1, 100),
    (1, 2, 100),
    (1, 3, 100),
    (1, 6, 100),
    (2, 1, 30),
    (2, 3, 30),
    (2, 6, 30),
    (3, 1, 50),
    (3, 2, 50),
    (3, 8, 50),
    (4, 4, 100),
    (4, 5, 100),
    (4, 6, 100)
) AS v (PackageID, MenuItemID, Quantity)
WHERE NOT EXISTS (SELECT 1 FROM dbo.PACKAGE_MENU_ITEM t WHERE t.PackageID = v.PackageID AND t.MenuItemID = v.MenuItemID);
GO

-- ==========================================================================
-- Part 4: SQL Queries
-- Five queries: SELECT, JOIN, Aggregation, GROUP BY / HAVING, Subquery
-- ==========================================================================
-- Query 1: SELECT - all packages with their type, cheapest first
SELECT PackageID, PackageName, PackageType, Price
FROM dbo.CateringPackage
ORDER BY Price;

-- Query 2: JOIN - what each package contains (CateringPackage + PACKAGE_MENU_ITEM + MenuItem)
SELECT p.PackageName, m.ItemName, m.Category, pmi.Quantity
FROM dbo.CateringPackage p
INNER JOIN dbo.PACKAGE_MENU_ITEM pmi ON pmi.PackageID = p.PackageID
INNER JOIN dbo.MenuItem m            ON m.MenuItemID  = pmi.MenuItemID
ORDER BY p.PackageName, m.ItemName;

-- Query 3: Aggregation - price summary of the packages
SELECT COUNT(*)   AS TotalPackages,
       MIN(Price) AS Cheapest,
       MAX(Price) AS MostExpensive,
       AVG(Price) AS AveragePrice
FROM dbo.CateringPackage;

-- Query 4: GROUP BY / HAVING - packages with four or more different menu items, and the value of that food
SELECT p.PackageName,
       COUNT(*)                     AS DifferentItems,
       SUM(pmi.Quantity * m.Price)  AS FoodValue
FROM dbo.CateringPackage p
INNER JOIN dbo.PACKAGE_MENU_ITEM pmi ON pmi.PackageID = p.PackageID
INNER JOIN dbo.MenuItem m            ON m.MenuItemID  = pmi.MenuItemID
GROUP BY p.PackageName
HAVING COUNT(*) >= 4;

-- Query 5: Subquery - menu items that are not part of any package yet
SELECT MenuItemID, ItemName, Category, Price
FROM dbo.MenuItem
WHERE MenuItemID NOT IN (SELECT MenuItemID FROM dbo.PACKAGE_MENU_ITEM);
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

-- Demo: add Grilled Salmon (item 4) to the Wedding Package (package 1), then undo it (ROLLBACK)
BEGIN TRANSACTION;
    EXEC dbo.AddMenuItemToPackage @PackageID = 1, @MenuItemID = 4, @Quantity = 100;
    SELECT p.PackageName, m.ItemName, pmi.Quantity
    FROM dbo.PACKAGE_MENU_ITEM pmi
    INNER JOIN dbo.CateringPackage p ON p.PackageID = pmi.PackageID
    INNER JOIN dbo.MenuItem m        ON m.MenuItemID = pmi.MenuItemID
    WHERE pmi.PackageID = 1
    ORDER BY m.ItemName;
ROLLBACK TRANSACTION;

-- Error case (remove the comment marks to try it): unknown package
-- EXEC dbo.AddMenuItemToPackage @PackageID = 99, @MenuItemID = 1, @Quantity = 10;
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

-- Demo: the Wedding Package has 4 items. Adding two more is fine (6); a seventh is blocked.
BEGIN TRANSACTION;
BEGIN TRY
    EXEC dbo.AddMenuItemToPackage @PackageID = 1, @MenuItemID = 4, @Quantity = 100;   -- 5 items: allowed
    EXEC dbo.AddMenuItemToPackage @PackageID = 1, @MenuItemID = 5, @Quantity = 100;   -- 6 items: allowed
    EXEC dbo.AddMenuItemToPackage @PackageID = 1, @MenuItemID = 8, @Quantity = 100;   -- 7 items: blocked
END TRY
BEGIN CATCH
    SELECT ERROR_NUMBER() AS ErrorNo, ERROR_MESSAGE() AS TriggerMessage;
END CATCH;
IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

SELECT COUNT(*) AS ItemsInWeddingPackage FROM dbo.PACKAGE_MENU_ITEM WHERE PackageID = 1;   -- back to 4
GO

-- End of file
