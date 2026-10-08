package com.smartliving.common.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
@Profile("mysql")
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${DB_URL:${spring.datasource.url:}}")
    private String rawUrl;

    @Value("${DB_USERNAME:${spring.datasource.username:}}")
    private String username;

    @Value("${DB_PASSWORD:${spring.datasource.password:}}")
    private String password;

    @Bean
    public DataSource dataSource() {
        String cleanUrl = rawUrl != null ? rawUrl.trim() : "";
        // Strip wrapping quotes if any
        if (cleanUrl.startsWith("\"") && cleanUrl.endsWith("\"") && cleanUrl.length() > 1) {
            cleanUrl = cleanUrl.substring(1, cleanUrl.length() - 1).trim();
        }
        if (cleanUrl.startsWith("'") && cleanUrl.endsWith("'") && cleanUrl.length() > 1) {
            cleanUrl = cleanUrl.substring(1, cleanUrl.length() - 1).trim();
        }

        String finalUser = username != null ? username.trim() : "";
        String finalPass = password != null ? password.trim() : "";

        // Check if user entered a standard URI format: mysql://user:pass@host:port/dbname or jdbc:mysql://user:pass@host...
        try {
            String uriStringToParse = cleanUrl;
            if (uriStringToParse.startsWith("jdbc:")) {
                uriStringToParse = uriStringToParse.substring(5);
            }

            if (uriStringToParse.startsWith("mysql://")) {
                URI uri = new URI(uriStringToParse);
                String userInfo = uri.getUserInfo();
                if (userInfo != null && !userInfo.isEmpty()) {
                    String[] userParts = userInfo.split(":", 2);
                    if (finalUser.isEmpty()) {
                        finalUser = java.net.URLDecoder.decode(userParts[0], java.nio.charset.StandardCharsets.UTF_8);
                    }
                    if (userParts.length > 1 && finalPass.isEmpty()) {
                        finalPass = java.net.URLDecoder.decode(userParts[1], java.nio.charset.StandardCharsets.UTF_8);
                    }
                }

                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 4000;
                String path = uri.getPath();
                if (path == null || path.isEmpty() || path.equals("/")) {
                    path = "/test";
                }
                String query = uri.getQuery();

                StringBuilder jdbcUrl = new StringBuilder("jdbc:mysql://");
                jdbcUrl.append(host).append(":").append(port).append(path);
                if (query != null && !query.isEmpty()) {
                    jdbcUrl.append("?").append(query);
                    if (!query.contains("serverTimezone")) {
                        jdbcUrl.append("&serverTimezone=UTC");
                    }
                } else {
                    jdbcUrl.append("?sslMode=VERIFY_IDENTITY&serverTimezone=UTC");
                }
                cleanUrl = jdbcUrl.toString();
            } else if (cleanUrl.contains("@") && cleanUrl.startsWith("jdbc:mysql://")) {
                // Handle case where user put credentials directly inside jdbc:mysql://user:pass@host:4000/db
                String withoutJdbc = cleanUrl.substring("jdbc:".length());
                URI uri = new URI(withoutJdbc);
                String userInfo = uri.getUserInfo();
                if (userInfo != null && !userInfo.isEmpty()) {
                    String[] userParts = userInfo.split(":", 2);
                    if (finalUser.isEmpty()) {
                        finalUser = java.net.URLDecoder.decode(userParts[0], java.nio.charset.StandardCharsets.UTF_8);
                    }
                    if (userParts.length > 1 && finalPass.isEmpty()) {
                        finalPass = java.net.URLDecoder.decode(userParts[1], java.nio.charset.StandardCharsets.UTF_8);
                    }
                }
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 4000;
                String path = (uri.getPath() == null || uri.getPath().isEmpty() || uri.getPath().equals("/")) ? "/test" : uri.getPath();
                String query = uri.getQuery();

                StringBuilder jdbcUrl = new StringBuilder("jdbc:mysql://");
                jdbcUrl.append(host).append(":").append(port).append(path);
                if (query != null && !query.isEmpty()) {
                    jdbcUrl.append("?").append(query);
                } else {
                    jdbcUrl.append("?sslMode=VERIFY_IDENTITY&serverTimezone=UTC");
                }
                cleanUrl = jdbcUrl.toString();
            } else if (!cleanUrl.startsWith("jdbc:mysql://") && cleanUrl.contains("tidbcloud.com")) {
                cleanUrl = "jdbc:mysql://" + cleanUrl;
                if (!cleanUrl.contains("?")) {
                    cleanUrl += "?sslMode=VERIFY_IDENTITY&serverTimezone=UTC";
                }
            }
        } catch (Exception e) {
            log.warn("Could not auto-parse URI structure from URL, using cleaned raw URL. Reason: {}", e.getMessage());
        }

        // Mask password in logs
        String maskedUrl = cleanUrl.replaceAll(":[^/@:]+@", ":****@");
        log.info("Configuring MySQL HikariDataSource with URL: {} and Username: {}", maskedUrl, finalUser);

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(cleanUrl);
        config.setUsername(finalUser);
        config.setPassword(finalPass);
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);

        return new HikariDataSource(config);
    }
}
