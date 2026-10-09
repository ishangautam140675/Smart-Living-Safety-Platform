package com.smartliving;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SmartLivingApplication {

    public static void main(String[] args) {
        String profile = System.getenv("SPRING_PROFILES_ACTIVE");
        if (profile == null) {
            profile = System.getProperty("spring.profiles.active", "h2");
        }

        if (profile.contains("mysql")) {
            sanitizeDatabaseEnvironment();
        }

        SpringApplication.run(SmartLivingApplication.class, args);
    }

    private static void sanitizeDatabaseEnvironment() {
        String dbUrl = System.getenv("DB_URL");
        if (dbUrl == null || dbUrl.trim().isEmpty()) {
            dbUrl = System.getProperty("DB_URL");
        }

        if (dbUrl != null && !dbUrl.trim().isEmpty()) {
            String s = dbUrl.trim();

            if (s.startsWith("\"") && s.endsWith("\"") && s.length() > 1) {
                s = s.substring(1, s.length() - 1).trim();
            }
            if (s.startsWith("'") && s.endsWith("'") && s.length() > 1) {
                s = s.substring(1, s.length() - 1).trim();
            }

            if (!s.startsWith("jdbc:mysql://") && !s.startsWith("mysql://")) {
                s = "jdbc:mysql://" + s;
            }
            if (s.startsWith("mysql://")) {
                s = "jdbc:" + s;
            }

            int protocolEnd = s.indexOf("://") + 3;
            if (protocolEnd > 2 && protocolEnd < s.length()) {
                String proto = s.substring(0, protocolEnd);
                String rest = s.substring(protocolEnd);
                rest = rest.replaceAll("/+", "/");
                s = proto + rest;
            }

            s = s.replaceAll("\\?+", "?");
            s = s.replaceAll("&+", "&");

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

            if (!s.contains("serverTimezone")) {
                s += (s.contains("?") ? "&" : "?") + "serverTimezone=UTC";
            }
            if (!s.contains("sslMode")) {
                s += (s.contains("?") ? "&" : "?") + "sslMode=VERIFY_IDENTITY";
            }

            System.setProperty("spring.datasource.url", s);

            // Always explicitly set username and password from env vars
            String dbUser = System.getenv("DB_USERNAME");
            if (dbUser != null && !dbUser.trim().isEmpty()) {
                System.setProperty("spring.datasource.username", dbUser.trim());
            }
            String dbPass = System.getenv("DB_PASSWORD");
            if (dbPass != null) {
                System.setProperty("spring.datasource.password", dbPass.trim());
            }

            System.out.println("[SmartLiving] MySQL configured. User: " + (dbUser != null ? dbUser.trim() : "root(default)"));
        }
    }
}
