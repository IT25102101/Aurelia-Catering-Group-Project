@echo off
setlocal
if not defined JAVA_HOME (
    if exist "C:\Program Files\Java\jdk-25.0.4" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-25.0.4"
    )
)
if exist "D:\IntelliJ IDEA 2026.2.3\plugins\maven-plugin\lib\maven3\bin\mvn.cmd" (
    "D:\IntelliJ IDEA 2026.2.3\plugins\maven-plugin\lib\maven3\bin\mvn.cmd" %*
) else (
    mvn %*
)
endlocal
