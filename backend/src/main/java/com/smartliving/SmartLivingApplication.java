package com.smartliving;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SmartLivingApplication {

    public static void main(String[] args) {
        sanitizeDatabaseEnvironment();
        SpringApplication.run(SmartLivingApplication.class, args);
    }

    private static void sanitizeDatabaseEnvironment() {
        String dbUrl = System.getenv("DB_URL");
        if (dbUrl == null || dbUrl.trim().isEmpty()) {
            dbUrl = System.getProperty("DB_URL");
        }

        if (dbUrl != null && !dbUrl.trim().isEmpty()) {
            String s = dbUrl.trim();

            // Strip wrapping quotes
            if (s.startsWith("\"") && s.endsWith("\"") && s.length() > 1) {
                s = s.substring(1, s.length() - 1).trim();
            }
            if (s.startsWith("'") && s.endsWith("'") && s.length() > 1) {
                s = s.substring(1, s.length() - 1).trim();
            }

            // Ensure protocol starts with jdbc:mysql://
            if (!s.startsWith("jdbc:mysql://") && !s.startsWith("mysql://")) {
                s = "jdbc:mysql://" + s;
            }
            if (s.startsWith("mysql://")) {
                s = "jdbc:" + s;
            }

            // Clean multiple slashes after jdbc:mysql://
            int protocolEnd = s.indexOf("://") + 3;
            if (protocolEnd > 2 && protocolEnd < s.length()) {
                String proto = s.substring(0, protocolEnd);
                String rest = s.substring(protocolEnd);
                rest = rest.replaceAll("/+", "/");
                s = proto + rest;
            }

            // Clean duplicate question marks & ampersands
            s = s.replaceAll("\\?+", "?");
            s = s.replaceAll("&+", "&");

            // Extract credentials if embedded in URL (e.g. jdbc:mysql://user:pass@host:4000/db)
            if (s.contains("@")) {
                int atIdx = s.indexOf("@");
                int schemeEnd = s.indexOf("://") + 3;
                if (schemeEnd < atIdx) {
                    String userPass = s.substring(schemeEnd, atIdx);
                    String hostAndRest = s.substring(atIdx + 1);
                    if (userPass.contains(":")) {
                        String[] parts = userPass.split(":", 2);
                        if (System.getenv("DB_USERNAME") == null) {
                            System.setProperty("spring.datasource.username", parts[0]);
                        }
                        if (System.getenv("DB_PASSWORD") == null) {
                            System.setProperty("spring.datasource.password", parts[1]);
                        }
                    } else {
                        if (System.getenv("DB_USERNAME") == null) {
                            System.setProperty("spring.datasource.username", userPass);
                        }
                    }
                    s = s.substring(0, schemeEnd) + hostAndRest;
                }
            }

            // Ensure SSL and timezone parameters if not specified
            if (!s.contains("serverTimezone")) {
                s += (s.contains("?") ? "&" : "?") + "serverTimezone=UTC";
            }
            if (!s.contains("sslMode")) {
                s += (s.contains("?") ? "&" : "?") + "sslMode=VERIFY_IDENTITY";
            }

            System.out.println("[SmartLiving] Sanitized MySQL JDBC URL configured successfully.");
            System.setProperty("spring.datasource.url", s);
        }
    }
}
