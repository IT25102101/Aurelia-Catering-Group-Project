@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-24"
set "PATH=%JAVA_HOME%\bin;%PATH%"
"C:\Program Files\JetBrains\IntelliJ IDEA 2025.3.1.1\plugins\maven\lib\maven3\bin\mvn.cmd" spring-boot:run
