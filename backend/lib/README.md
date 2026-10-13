# Native library for Windows Authentication

SQL Server Windows Authentication needs `mssql-jdbc_auth-12.6.2.x64.dll` (matches the mssql-jdbc 12.6.2 driver).
The DLL is not committed (see `.gitignore`). Download it from Maven Central:

    https://repo1.maven.org/maven2/com/microsoft/sqlserver/mssql-jdbc_auth/12.6.2.x64/mssql-jdbc_auth-12.6.2.x64.dll

Then make it visible to Java, either way:

1. Copy it into the project root folder (the app's working directory; Java searches `.` on Windows), or
2. Keep it here and add the JVM option `-Djava.library.path=<project folder>\backend\lib`.

Leave `aurelia.db.user` / `aurelia.db.password` blank in `application.properties`.
