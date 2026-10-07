-- ==========================================================================
-- 02_Menu_Management.sql
-- Module  : Menu management
-- Project : Aurelia Catering System          Database : AureliaCatering2 (SQL Server / T-SQL)
-- Course  : IT2140 Database Design and Development - DDD Assignment 02
-- Student : ______________________________   Student ID : ______________
-- ==========================================================================
-- The dishes and drinks that can be ordered, with prices and categories.
--
-- This module's tables : MenuItem
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
-- Entity      : MenuItem  (a dish or drink the caterer sells)
-- Attributes  : MenuItemID (PK), ItemName (unique), Description, Price, Category
--
-- ISA         : MenuItem is specialised by Category into Main, Salad, Beverage and Dessert.
-- ISA mapping : SINGLE-TABLE mapping with Category as the discriminator. The subclasses have no
--               attributes of their own, so one table is enough (no extra subclass tables).
--
-- Relational schema:
--     MenuItem (MenuItemID PK, ItemName UNIQUE, Description, Price CHECK >= 0, Category)
--
-- Primary key : MenuItemID
-- Foreign keys: none leave this table (MenuItem is a parent table). The PK/FK connections are the
--               foreign keys of other tables that point to MenuItem.MenuItemID:
--     MenuItem 1 --- 0..N PACKAGE_MENU_ITEM  (menu items inside a package)   -> Package module
--     MenuItem 1 --- 0..N ORDER_MENU_ITEM    (menu items chosen in an order) -> Order module
--     MenuItem 1 --- 0..1 RECIPE             (one recipe per dish)           -> Inventory module
--
--     +------------------------------+
--     | MenuItem                     |
--     |------------------------------|
--     | MenuItemID (PK)              |   Category = discriminator
--     | ItemName (UQ), Description   |   ( Main | Salad | Beverage | Dessert )
--     | Price (>= 0), Category       |
--     +------------------------------+

-- ==========================================================================
-- Part 2: Table Creation
-- Each table is created only if it does not exist yet.
-- ==========================================================================
-- Part 2B: this module's tables

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

-- ==========================================================================
-- Part 3: Sample Data
-- Each row is inserted only if its key is not there yet (WHERE NOT EXISTS), so the file can be run twice.
-- ==========================================================================
-- Part 3B: this module's rows

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

-- ==========================================================================
-- Part 4: SQL Queries
-- Five queries: SELECT, JOIN, Aggregation, GROUP BY / HAVING, Subquery
-- ==========================================================================
-- Query 1: SELECT - dishes that cost 800 or more, most expensive first
SELECT MenuItemID, ItemName, Category, Price
FROM dbo.MenuItem
WHERE Price >= 800
ORDER BY Price DESC;

-- Query 2: JOIN - for each category, a cheaper item paired with a dearer item (MenuItem joined to itself)
SELECT a.Category, a.ItemName AS CheaperItem, a.Price AS CheaperPrice,
       b.ItemName AS DearerItem, b.Price AS DearerPrice
FROM dbo.MenuItem a
INNER JOIN dbo.MenuItem b ON a.Category = b.Category AND a.Price < b.Price
ORDER BY a.Category, a.Price;

-- Query 3: Aggregation - price summary of the whole menu
SELECT COUNT(*)              AS TotalItems,
       MIN(Price)            AS Cheapest,
       MAX(Price)            AS MostExpensive,
       CAST(AVG(Price) AS DECIMAL(10,2)) AS AveragePrice
FROM dbo.MenuItem;

-- Query 4: GROUP BY / HAVING - categories with two or more items, and their average price
SELECT Category, COUNT(*) AS ItemCount, CAST(AVG(Price) AS DECIMAL(10,2)) AS AveragePrice
FROM dbo.MenuItem
GROUP BY Category
HAVING COUNT(*) >= 2;

-- Query 5: Subquery - items priced above the menu's average price
SELECT MenuItemID, ItemName, Category, Price
FROM dbo.MenuItem
WHERE Price > (SELECT AVG(Price) FROM dbo.MenuItem)
ORDER BY Price DESC;
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

-- Demo: 10% price rise for all Beverages, then undo it (ROLLBACK)
SELECT MenuItemID, ItemName, Price AS PriceBefore FROM dbo.MenuItem WHERE Category = 'Beverage';

BEGIN TRANSACTION;
    EXEC dbo.ApplyCategoryPriceChange @Category = 'Beverage', @Percent = 10;   -- shows PriceAfter
ROLLBACK TRANSACTION;

-- Error case (remove the comment marks to try it): unknown category
-- EXEC dbo.ApplyCategoryPriceChange @Category = 'Soup', @Percent = 5;
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

-- Demo: an 80% rise is blocked by the trigger
BEGIN TRANSACTION;
BEGIN TRY
    EXEC dbo.ApplyCategoryPriceChange @Category = 'Beverage', @Percent = 80;
END TRY
BEGIN CATCH
    SELECT ERROR_NUMBER() AS ErrorNo, ERROR_MESSAGE() AS TriggerMessage;
END CATCH;
IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

SELECT MenuItemID, ItemName, Price FROM dbo.MenuItem WHERE Category = 'Beverage';   -- prices unchanged
GO

-- End of file
