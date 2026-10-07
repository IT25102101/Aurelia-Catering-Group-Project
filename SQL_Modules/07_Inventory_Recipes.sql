-- ==========================================================================
-- 07_Inventory_Recipes.sql
-- Module  : Inventory and recipes
-- Project : Aurelia Catering System          Database : AureliaCatering2 (SQL Server / T-SQL)
-- Course  : IT2140 Database Design and Development - DDD Assignment 02
-- Student : ______________________________   Student ID : ______________
-- ==========================================================================
-- Ingredient stock, the recipe of each dish and automatic low-stock warnings.
--
-- This module's tables : INVENTORY_ITEM, RECIPE, RECIPE_INGREDIENT, INVENTORY_ALERT
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
-- Entities    : INVENTORY_ITEM (an ingredient in stock), RECIPE (how one dish is made),
--               RECIPE_INGREDIENT (one ingredient line of a recipe), INVENTORY_ALERT (low-stock warnings)
--               Supporting (Menu module): MenuItem
--
-- Relationships:
--     MenuItem 1 --- 0..1 RECIPE                 (a dish has one recipe; RECIPE.MenuItemID is UNIQUE)
--     RECIPE   M --- N INVENTORY_ITEM            -> RECIPE_INGREDIENT (QuantityRequired per serving)
--     INVENTORY_ITEM 1 --- 0..N INVENTORY_ALERT (one warning each time stock drops to the reorder level)
-- ISA         : INVENTORY_ITEM is specialised by ingredient category into eight subclasses:
--                 Meat, Seafood, Vegetable, Dairy, Grain, Oil, Confectionery and Other.
--               Disjoint (an ingredient has exactly one category) and total (Other is the default).
-- ISA mapping : SINGLE-TABLE mapping. The subclasses share all attributes, so they stay in the one
--               INVENTORY_ITEM table and the column Category is the discriminator (a CHECK limits it
--               to the eight values). (EER note: draw INVENTORY_ITEM with a disjoint, total
--               specialisation to the categories.)
--
-- Relational schema:
--     INVENTORY_ITEM (InventoryItemID PK, ItemName UNIQUE, Quantity >= 0, Unit, ReorderLevel >= 0,
--                     Category CHECK IN the eight categories, DEFAULT 'Other')
--     RECIPE (RecipeID PK, MenuItemID FK UNIQUE, RecipeName, Description)
--     RECIPE_INGREDIENT (RecipeIngredientID PK, RecipeID FK, InventoryItemID FK,
--                        QuantityRequired > 0, UNIQUE (RecipeID, InventoryItemID))
--     INVENTORY_ALERT (AlertID PK, InventoryItemID FK, AlertDate, QuantityLeft, ReorderLevel, Message)
--
-- Primary keys: InventoryItemID, RecipeID, RecipeIngredientID, AlertID
-- Foreign keys: RECIPE.MenuItemID -> MenuItem ; RECIPE_INGREDIENT.RecipeID -> RECIPE ;
--               RECIPE_INGREDIENT.InventoryItemID -> INVENTORY_ITEM ; INVENTORY_ALERT.InventoryItemID -> INVENTORY_ITEM
--
--     MenuItem 1---0..1 RECIPE 1---< RECIPE_INGREDIENT >---1 INVENTORY_ITEM 1---< INVENTORY_ALERT

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

IF OBJECT_ID(N'dbo.INVENTORY_ITEM', N'U') IS NULL
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

IF OBJECT_ID(N'dbo.RECIPE', N'U') IS NULL
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

IF OBJECT_ID(N'dbo.RECIPE_INGREDIENT', N'U') IS NULL
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

IF OBJECT_ID(N'dbo.INVENTORY_ALERT', N'U') IS NULL
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

INSERT INTO dbo.INVENTORY_ITEM (InventoryItemID, ItemName, Quantity, Unit, ReorderLevel, Category)
SELECT v.InventoryItemID, v.ItemName, v.Quantity, v.Unit, v.ReorderLevel, v.Category
FROM (VALUES
    (1, 'Rice', 500.000, 'kg', 100.000, 'Grain'),
    (2, 'Chicken', 200.000, 'kg', 50.000, 'Meat'),
    (3, 'Carrot', 100.000, 'kg', 20.000, 'Vegetable'),
    (4, 'Cooking Oil', 80.000, 'litre', 15.000, 'Oil'),
    (5, 'Salmon', 60.000, 'kg', 20.000, 'Seafood'),
    (6, 'Lamb', 80.000, 'kg', 25.000, 'Meat'),
    (7, 'Dark Chocolate', 8.000, 'kg', 10.000, 'Confectionery'),
    (8, 'Cream', 12.000, 'litre', 10.000, 'Dairy')
) AS v (InventoryItemID, ItemName, Quantity, Unit, ReorderLevel, Category)
WHERE NOT EXISTS (SELECT 1 FROM dbo.INVENTORY_ITEM t WHERE t.InventoryItemID = v.InventoryItemID);
GO

INSERT INTO dbo.RECIPE (RecipeID, MenuItemID, RecipeName, Description)
SELECT v.RecipeID, v.MenuItemID, v.RecipeName, v.Description
FROM (VALUES
    (1, 1, 'Chicken Rice Recipe', 'Recipe for chicken rice'),
    (2, 2, 'Vegetable Salad Recipe', 'Recipe for vegetable salad'),
    (3, 4, 'Grilled Salmon Recipe', 'Recipe for grilled salmon'),
    (4, 5, 'Roast Lamb Recipe', 'Recipe for roast lamb'),
    (5, 6, 'Chocolate Fondant Recipe', 'Recipe for chocolate fondant')
) AS v (RecipeID, MenuItemID, RecipeName, Description)
WHERE NOT EXISTS (SELECT 1 FROM dbo.RECIPE t WHERE t.RecipeID = v.RecipeID);
GO

INSERT INTO dbo.RECIPE_INGREDIENT (RecipeIngredientID, RecipeID, InventoryItemID, QuantityRequired)
SELECT v.RecipeIngredientID, v.RecipeID, v.InventoryItemID, v.QuantityRequired
FROM (VALUES
    (1, 1, 1, 0.150),
    (2, 1, 2, 0.200),
    (3, 1, 4, 0.020),
    (4, 1, 3, 0.030),
    (5, 2, 3, 0.100),
    (6, 2, 4, 0.010),
    (7, 3, 5, 0.200),
    (8, 3, 4, 0.020),
    (9, 3, 3, 0.050),
    (10, 4, 6, 0.250),
    (11, 4, 4, 0.020),
    (12, 5, 7, 0.080),
    (13, 5, 8, 0.050)
) AS v (RecipeIngredientID, RecipeID, InventoryItemID, QuantityRequired)
WHERE NOT EXISTS (SELECT 1 FROM dbo.RECIPE_INGREDIENT t WHERE t.RecipeIngredientID = v.RecipeIngredientID);
GO

INSERT INTO dbo.INVENTORY_ALERT (AlertID, InventoryItemID, AlertDate, QuantityLeft, ReorderLevel, Message)
SELECT v.AlertID, v.InventoryItemID, v.AlertDate, v.QuantityLeft, v.ReorderLevel, v.Message
FROM (VALUES
    (1, 7, '2026-09-30T10:15:00', 8.000, 10.000, 'Dark Chocolate is at or below its reorder level.')
) AS v (AlertID, InventoryItemID, AlertDate, QuantityLeft, ReorderLevel, Message)
WHERE NOT EXISTS (SELECT 1 FROM dbo.INVENTORY_ALERT t WHERE t.AlertID = v.AlertID);
GO

-- ==========================================================================
-- Part 4: SQL Queries
-- Five queries: SELECT, JOIN, Aggregation, GROUP BY / HAVING, Subquery
-- ==========================================================================
-- Query 1: SELECT - ingredients at or below their reorder level
SELECT InventoryItemID, ItemName, Category, Quantity, Unit, ReorderLevel
FROM dbo.INVENTORY_ITEM
WHERE Quantity <= ReorderLevel;

-- Query 2: JOIN - what each dish needs per serving (RECIPE + MenuItem + RECIPE_INGREDIENT + INVENTORY_ITEM)
SELECT m.ItemName AS Dish, i.ItemName AS Ingredient, ri.QuantityRequired AS PerServing, i.Unit
FROM dbo.RECIPE r
INNER JOIN dbo.MenuItem m           ON m.MenuItemID      = r.MenuItemID
INNER JOIN dbo.RECIPE_INGREDIENT ri ON ri.RecipeID       = r.RecipeID
INNER JOIN dbo.INVENTORY_ITEM i     ON i.InventoryItemID = ri.InventoryItemID
ORDER BY m.ItemName, i.ItemName;

-- Query 3: Aggregation - stock summary
SELECT COUNT(*)      AS TotalItems,
       SUM(CASE WHEN Quantity <= ReorderLevel THEN 1 ELSE 0 END) AS ItemsToReorder,
       MIN(Quantity) AS LowestStock,
       MAX(Quantity) AS HighestStock
FROM dbo.INVENTORY_ITEM;

-- Query 4: GROUP BY / HAVING - recipes that use three or more ingredients
SELECT r.RecipeName, COUNT(*) AS IngredientCount
FROM dbo.RECIPE r
INNER JOIN dbo.RECIPE_INGREDIENT ri ON ri.RecipeID = r.RecipeID
GROUP BY r.RecipeName
HAVING COUNT(*) >= 3;

-- Query 5: Subquery - ingredients that are shared by more than one recipe
SELECT InventoryItemID, ItemName, Quantity, Unit
FROM dbo.INVENTORY_ITEM
WHERE InventoryItemID IN (SELECT InventoryItemID
                          FROM dbo.RECIPE_INGREDIENT
                          GROUP BY InventoryItemID
                          HAVING COUNT(*) > 1);
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

-- Demo: Dark Chocolate (item 7) is low (8 kg, reorder level 10). Restock 20 kg, then undo it.
BEGIN TRANSACTION;
    EXEC dbo.RestockInventoryItem @InventoryItemID = 7, @AddedQuantity = 20;   -- 28 kg, StockStatus OK
ROLLBACK TRANSACTION;

-- Error case (remove the comment marks to try it): zero quantity
-- EXEC dbo.RestockInventoryItem @InventoryItemID = 7, @AddedQuantity = 0;
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

-- Demo: the kitchen uses 450 kg of Rice (500 -> 50, reorder level 100) -> an alert row appears
BEGIN TRANSACTION;
    UPDATE dbo.INVENTORY_ITEM SET Quantity = Quantity - 450 WHERE InventoryItemID = 1;   -- fires the trigger

    SELECT AlertID, InventoryItemID, QuantityLeft, ReorderLevel, Message
    FROM dbo.INVENTORY_ALERT
    ORDER BY AlertID;
ROLLBACK TRANSACTION;
GO

-- End of file
