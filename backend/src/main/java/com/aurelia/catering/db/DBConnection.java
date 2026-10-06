package com.aurelia.catering.db;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Opens a plain JDBC connection to SQL Server.
 *
 * Default (nothing configured): Windows Authentication to localhost\SQLEXPRESS, database AureliaCatering2.
 * Windows Authentication needs the native file mssql-jdbc_auth-*.dll on the PATH.
 *
 * To avoid that DLL, use a SQL Server login instead (see Aurelia_SqlLogin_Setup.sql). Set these in
 * application.properties, as Java -D options, or as environment variables (checked in this order):
 *
 *   aurelia.db.url       / AURELIA_DB_URL       full JDBC URL (optional)
 *   aurelia.db.user      / AURELIA_DB_USER      SQL login name  (turns Windows Authentication off)
 *   aurelia.db.password  / AURELIA_DB_PASSWORD  SQL login password
 */
public class DBConnection {

    private static final String DEFAULT_URL =
            "jdbc:sqlserver://localhost;instanceName=SQLEXPRESS;" +
                    "databaseName=AureliaCatering2;" +
                    "encrypt=true;trustServerCertificate=true;";

    private static final Properties FILE_SETTINGS = loadFileSettings();

    private DBConnection() {
    }

    public static Connection getConnection() throws SQLException {
        String url = setting("aurelia.db.url", "AURELIA_DB_URL");
        String user = setting("aurelia.db.user", "AURELIA_DB_USER");
        String password = setting("aurelia.db.password", "AURELIA_DB_PASSWORD");

        if (url == null) {
            url = DEFAULT_URL;
        }

        try {
            if (user != null) {
                return DriverManager.getConnection(url, user, password == null ? "" : password);
            }
            // no SQL login configured -> Windows Authentication
            if (!url.toLowerCase().contains("integratedsecurity")) {
                url = url + (url.endsWith(";") ? "" : ";") + "integratedSecurity=true;";
            }
            return DriverManager.getConnection(url);
        } catch (SQLException e) {
            throw new SQLException(addHint(e.getMessage()), e.getSQLState(), e.getErrorCode(), e);
        }
    }

    /** Short plain-language advice for the most common connection failures. */
    private static String addHint(String message) {
        String m = message == null ? "" : message.toLowerCase();
        String hint = null;
        if (m.contains("integrated authentication")) {
            hint = "Windows Authentication needs mssql-jdbc_auth-*.dll on the PATH. Easier: use a SQL login " +
                   "(run Aurelia_SqlLogin_Setup.sql, then set aurelia.db.user and aurelia.db.password).";
        } else if (m.contains("login failed")) {
            hint = "Check aurelia.db.user / aurelia.db.password, and that SQL Server allows SQL logins (Mixed Mode).";
        } else if (m.contains("cannot open database")) {
            hint = "The database AureliaCatering2 does not exist yet. Run Aurelia_Database.sql in SSMS first.";
        } else if (m.contains("tcp/ip") || m.contains("connection refused") || m.contains("named instance")
                || m.contains("connect timed out")) {
            hint = "Is SQL Server running? Enable TCP/IP in SQL Server Configuration Manager and start the " +
                   "SQL Server Browser service, or set aurelia.db.url to use the port (jdbc:sqlserver://localhost:1433;...).";
        }
        return hint == null ? message : message + "  >> HINT: " + hint;
    }

    private static String setting(String propertyName, String envName) {
        String value = System.getProperty(propertyName);
        if (isBlank(value)) {
            value = System.getenv(envName);
        }
        if (isBlank(value)) {
            value = FILE_SETTINGS.getProperty(propertyName);
        }
        return isBlank(value) ? null : value.trim();
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static Properties loadFileSettings() {
        Properties props = new Properties();
        try (InputStream in = DBConnection.class.getResourceAsStream("/application.properties")) {
            if (in != null) {
                props.load(in);
            }
        } catch (IOException ignored) {
            // no file settings; defaults and environment variables still apply
        }
        return props;
    }
}
