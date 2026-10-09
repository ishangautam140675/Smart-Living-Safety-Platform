package com.smartliving;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Properties;

@SpringBootApplication
public class SmartLivingApplication {

    public static void main(String[] args) {
        String profile = System.getenv("SPRING_PROFILES_ACTIVE");
        if (profile == null) {
            profile = System.getProperty("spring.profiles.active", "h2");
        }

        if (profile.contains("mysql")) {
            boolean mysqlOk = setupAndTestMySQL();
            if (!mysqlOk) {
                System.out.println("[SmartLiving] MySQL unavailable — switching to H2 (site stays live!)");
                System.setProperty("spring.profiles.active", "h2");
                System.clearProperty("spring.datasource.url");
                System.clearProperty("spring.datasource.username");
                System.clearProperty("spring.datasource.password");
            }
        }

        SpringApplication.run(SmartLivingApplication.class, args);
    }

    private static boolean setupAndTestMySQL() {
        try {
            String dbUrl = System.getenv("DB_URL");
            if (dbUrl == null || dbUrl.trim().isEmpty()) {
                System.out.println("[SmartLiving] DB_URL not set.");
                return false;
            }

            String s = dbUrl.trim();
            // Strip surrounding quotes
            if (s.startsWith("\"") && s.endsWith("\"")) s = s.substring(1, s.length() - 1).trim();
            if (s.startsWith("'") && s.endsWith("'")) s = s.substring(1, s.length() - 1).trim();

            // Ensure jdbc:mysql:// prefix
            if (s.startsWith("mysql://")) s = "jdbc:" + s;
            if (!s.startsWith("jdbc:mysql://")) s = "jdbc:mysql://" + s;

            // Fix double slashes
            int pe = s.indexOf("://") + 3;
            if (pe > 2) {
                String proto = s.substring(0, pe);
                String rest = s.substring(pe).replaceAll("/+", "/");
                s = proto + rest;
            }
            s = s.replaceAll("\\?+", "?").replaceAll("&+", "&");

            // Strip embedded credentials from URL
            if (s.contains("@")) {
                int at = s.indexOf("@");
                int se = s.indexOf("://") + 3;
                if (se < at) s = s.substring(0, se) + s.substring(at + 1);
            }

            // Add serverTimezone if missing (but don't touch SSL — let user control it)
            if (!s.contains("serverTimezone")) {
                s += (s.contains("?") ? "&" : "?") + "serverTimezone=UTC";
            }

            // Get credentials
            String user = System.getenv("DB_USERNAME");
            String pass = System.getenv("DB_PASSWORD");
            if (user == null || user.trim().isEmpty()) {
                System.out.println("[SmartLiving] DB_USERNAME not set.");
                return false;
            }
            user = user.trim();
            pass = (pass != null) ? pass.trim() : "";

            System.out.println("[SmartLiving] Testing MySQL connection to: " + s.replaceAll("password=[^&]*", "password=***"));
            System.out.println("[SmartLiving] User: " + user);

            // Test actual connection
            Class.forName("com.mysql.cj.jdbc.Driver");
            Properties props = new Properties();
            props.setProperty("user", user);
            props.setProperty("password", pass);
            props.setProperty("connectTimeout", "10000");
            props.setProperty("socketTimeout", "10000");

            try (Connection conn = DriverManager.getConnection(s, props)) {
                if (conn.isValid(5)) {
                    System.setProperty("spring.datasource.url", s);
                    System.setProperty("spring.datasource.username", user);
                    System.setProperty("spring.datasource.password", pass);
                    System.out.println("[SmartLiving] ✅ MySQL connected! Running in CLOUD mode.");
                    return true;
                }
            }
        } catch (Exception e) {
            System.out.println("[SmartLiving] MySQL test failed: " + e.getMessage());
        }
        return false;
    }
}
