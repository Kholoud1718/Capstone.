package org.example;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.google.gson.Gson;

import static spark.Spark.delete;
import static spark.Spark.get;
import static spark.Spark.post;
import static spark.Spark.staticFiles;

public class App {

    private static final Logger logger = Logger.getLogger(App.class.getName());
    private final ZapService zapService = new ZapService(); // Initialize ZapService
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4); // Allow concurrent scans
    private List<Map<String, String>> scheduledScans = new ArrayList<>(); // List to store scheduled scan details

    public static void main(String[] args) {
        App app = new App();
        
        // Serve the frontend files
        staticFiles.externalLocation("frontend/build");

        // Set up routes for scans
        app.setupScheduledScans();
    }

    private void setupScheduledScans() {
        // Endpoint to trigger an instant scan
        post("/api/instant-scan", (req, res) -> {
            String body = req.body();
            logger.log(Level.INFO, "Instant scan request received: {0}", body);

            Map<String, String> data = new Gson().fromJson(req.body(), Map.class);
            String url = data.get("url");
            String scanType = data.get("scanType");

            try {
                String scanId = zapService.startInstantScan(url, scanType);
                logger.log(Level.INFO, "Instant scan started with ID: {0}", scanId);
                res.status(200);
                return new Gson().toJson(Map.of("scanId", scanId, "message", "Instant scan started for " + url));
            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error starting instant scan: {0}", e.getMessage());
                res.status(500);
                return "Error starting instant scan: " + e.getMessage();
            }
        });

        // Endpoint to schedule a scan
        post("/api/schedule-scan", (req, res) -> {
            try {
                // Parse request body
                Map<String, String> scanRequest = new Gson().fromJson(req.body(), Map.class);
                String url = scanRequest.get("url");
                String scanType = scanRequest.get("script"); // Fix: Get scan type from "script" instead of "scanType"
                String date = scanRequest.get("date");
                String time = scanRequest.get("time");
                ZoneId clientZoneId = ZoneId.of(scanRequest.get("clientTimeZone"));
                ZoneId serverZoneId = ZoneId.systemDefault();

                // Log the parsed data
                logger.log(Level.INFO, "Parsed data: URL: {0}, Scan Type: {1}, Date: {2}, Time: {3}", 
                           new Object[]{url, scanType, date, time});

                // Combine date and time into LocalDateTime
                LocalDateTime localDateTime = LocalDateTime.parse(date + "T" + time + ":00");
                ZonedDateTime clientZonedDateTime = ZonedDateTime.of(localDateTime, clientZoneId);
                ZonedDateTime serverZonedDateTime = clientZonedDateTime.withZoneSameInstant(serverZoneId);
                LocalDateTime serverDateTime = serverZonedDateTime.toLocalDateTime();

                // Calculate delay for scheduling
                long delayInSeconds = java.time.Duration.between(LocalDateTime.now(), serverDateTime).getSeconds();
                if (delayInSeconds < 0) {
                    logger.log(Level.WARNING, "Scheduled time is in the past");
                    res.status(400);
                    return "Scheduled time is in the past";
                }

                // Schedule the scan
                scheduledScans.add(scanRequest); // Add the scan to the list
                scheduleScan(url, scanType, serverDateTime);
                res.status(200);
                return "Scan successfully scheduled for " + serverDateTime.toString();
            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error scheduling the scan: {0}", e.getMessage());
                res.status(500);
                return "Internal server error: " + e.getMessage();
            }
        });

        // Endpoint to delete a scheduled scan using index
        delete("/api/schedule-scan/:index", (req, res) -> {
            int index = Integer.parseInt(req.params("index")); // Parse the index from the request URL

            // Check if the index is within the valid range of the scheduled scans list
            if (index >= 0 && index < scheduledScans.size()) {
                scheduledScans.remove(index);  // Remove the task from the list by index
                res.status(200);
                return "Task deleted successfully";
            } else {
                res.status(404);
                return "Task not found"; // If the index is out of range, return a 404 error
            }
        });

        // Endpoint to get all scheduled scans
        get("/api/scheduled-scans", (req, res) -> {
            res.type("application/json");
            return new Gson().toJson(scheduledScans);
        });

        // Serve React app for any unmatched routes (client-side routing)
        get("/*", (req, res) -> {
            res.redirect("/index.html");
            return null;
        });
    }

    // Method to schedule the scan execution
    public void scheduleScan(String url, String scanType, LocalDateTime scheduledTime) {
        long delayInSeconds = java.time.Duration.between(LocalDateTime.now(), scheduledTime).getSeconds();
        logger.log(Level.INFO, "Scheduling scan for {0} in {1} seconds", new Object[]{url, delayInSeconds});

        scheduler.schedule(() -> runInstantScan(url, scanType), delayInSeconds, TimeUnit.SECONDS);
    }

    // Method to trigger the ZAP instant scan
    private void runInstantScan(String url, String scanType) {
        try {
            logger.log(Level.INFO, "Executing scheduled scan for {0}, Scan Type: {1}", new Object[]{url, scanType});
            String scanId = zapService.startInstantScan(url, scanType);
            logger.log(Level.INFO, "Scheduled scan executed with ID: {0}", scanId);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error during scheduled scan: {0}", e.getMessage());
        }
    }
}
