package com.aurelia.catering.db;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * High-performance JDBC connection provider with connection pooling for SQL Server.
 *
 * Default: Windows Authentication to 127.0.0.1:1433 (database AureliaCatering2).
 * Direct TCP connection avoids the 15-30 second SQL Server Browser UDP resolution delay on Windows.
 * If 127.0.0.1:1433 is not reachable, gracefully falls back to localhost\SQLEXPRESS named instance.
 *
 * Employs a thread-safe connection pool with automatic validation and recycling to avoid
 * the 500-2000ms overhead of establishing fresh physical connections on every request.
 */
public class DBConnection {

    private static final String FAST_DEFAULT_URL =
            "jdbc:sqlserver://localhost:1433;databaseName=AureliaCatering2;" +
                    "encrypt=true;trustServerCertificate=true;";

    private static final String FALLBACK_URL =
            "jdbc:sqlserver://localhost;instanceName=SQLEXPRESS;" +
                    "databaseName=AureliaCatering2;" +
                    "encrypt=true;trustServerCertificate=true;";

    private static final int MAX_POOL_SIZE = 15;
    private static final BlockingQueue<Connection> POOL = new LinkedBlockingQueue<>(MAX_POOL_SIZE);

    private static final Properties FILE_SETTINGS = loadFileSettings();

    private DBConnection() {
    }

    public static Connection getConnection() throws SQLException {
        // 1. Try to acquire a healthy connection from the pool
        Connection raw;
        while ((raw = POOL.poll()) != null) {
            try {
                if (!raw.isClosed()) {
                    if (!raw.getAutoCommit()) {
                        raw.setAutoCommit(true);
                    }
                    return wrapConnection(raw);
                }
            } catch (SQLException ignored) {
                try { raw.close(); } catch (Exception ex) {}
            }
        }

        // 2. Pool was empty or had closed connections -> create a new physical connection
        raw = openPhysicalConnection();
        return wrapConnection(raw);
    }

    /**
     * Wraps a physical JDBC connection in a dynamic proxy that intercepts close()
     * and returns the connection to the pool rather than terminating the socket.
     */
    private static Connection wrapConnection(final Connection physical) {
        return (Connection) Proxy.newProxyInstance(
                DBConnection.class.getClassLoader(),
                new Class<?>[]{Connection.class},
                new InvocationHandler() {
                    private boolean isClosed = false;

                    @Override
                    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                        String name = method.getName();
                        if ("close".equals(name)) {
                            if (!isClosed) {
                                isClosed = true;
                                recycle(physical);
                            }
                            return null;
                        }
                        if ("isClosed".equals(name)) {
                            return isClosed || physical.isClosed();
                        }
                        if (isClosed) {
                            throw new SQLException("Connection is closed.");
                        }
                        return method.invoke(physical, args);
                    }
                }
        );
    }

    private static void recycle(Connection physical) {
        try {
            if (!physical.isClosed()) {
                if (!physical.getAutoCommit()) {
                    physical.setAutoCommit(true);
                }
                if (!POOL.offer(physical)) {
                    // Pool is full, safely close physical connection
                    physical.close();
                }
                return;
            }
        } catch (Exception ignored) {
        }
        try {
            physical.close();
        } catch (Exception ignored) {
        }
    }

    private static Connection openPhysicalConnection() throws SQLException {
        String configuredUrl = setting("aurelia.db.url", "AURELIA_DB_URL");
        String user = setting("aurelia.db.user", "AURELIA_DB_USER");
        String password = setting("aurelia.db.password", "AURELIA_DB_PASSWORD");

        String url = configuredUrl != null ? configuredUrl : FAST_DEFAULT_URL;

        try {
            return doConnect(url, user, password);
        } catch (SQLException primaryEx) {
            // If the default fast 127.0.0.1:1433 connection failed and no explicit URL was given,
            // fall back to the named instance URL
            if (configuredUrl == null) {
                try {
                    return doConnect(FALLBACK_URL, user, password);
                } catch (SQLException fallbackEx) {
                    throw new SQLException(addHint(primaryEx.getMessage()), primaryEx.getSQLState(), primaryEx.getErrorCode(), primaryEx);
                }
            }
            throw new SQLException(addHint(primaryEx.getMessage()), primaryEx.getSQLState(), primaryEx.getErrorCode(), primaryEx);
        }
    }

    private static Connection doConnect(String url, String user, String password) throws SQLException {
        if (user != null) {
            return DriverManager.getConnection(url, user, password == null ? "" : password);
        }
        // Windows Authentication
        if (!url.toLowerCase().contains("integratedsecurity")) {
            url = url + (url.endsWith(";") ? "" : ";") + "integratedSecurity=true;";
        }
        return DriverManager.getConnection(url);
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
