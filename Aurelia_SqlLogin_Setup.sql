/* ==============================================================================
   OPTIONAL - create a SQL Server login for the Aurelia backend
   Use this when Windows Authentication fails ("not configured for integrated
   authentication"), because a SQL login needs no extra DLL file.

   BEFORE YOU RUN
     1. Run Aurelia_Database.sql first (this script needs the database to exist).
     2. Change the password below.
     3. SQL Server must allow SQL logins: in SSMS right-click the server >
        Properties > Security > "SQL Server and Windows Authentication mode",
        then restart the SQL Server service.

   AFTER YOU RUN: put the same name and password in
     backend/src/main/resources/application.properties
        aurelia.db.user=aurelia_app
        aurelia.db.password=<the password you chose>
   ============================================================================== */
USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'aurelia_app')
    CREATE LOGIN aurelia_app WITH PASSWORD = N'ChangeMe#2026', CHECK_POLICY = OFF;
GO

USE AureliaCatering2;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'aurelia_app')
    CREATE USER aurelia_app FOR LOGIN aurelia_app;
GO

/* only what the app needs: read, write and run procedures/functions */
ALTER ROLE db_datareader ADD MEMBER aurelia_app;
ALTER ROLE db_datawriter ADD MEMBER aurelia_app;
GRANT EXECUTE ON SCHEMA::dbo TO aurelia_app;
GRANT SELECT  ON SCHEMA::dbo TO aurelia_app;   -- also lets it query the table function
GO
