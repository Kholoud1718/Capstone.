package org.example;

import static spark.Spark.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.quartz.Job;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.SchedulerFactory;
import org.quartz.SimpleScheduleBuilder;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.impl.StdSchedulerFactory;
import org.zaproxy.clientapi.core.ClientApiException;

import com.google.gson.Gson;

public class App {

    private static final Logger logger = Logger.getLogger(App.class.getName());
    private final Scheduler scheduler;
    private final ZapService zapService = new ZapService(); // Initialize ZapService

    // List to store scheduled scan requests
    private static final List<ScanRequest> scheduledScans = new ArrayList<>();

    public App() throws SchedulerException {
        // Initialize the scheduler using Quartz
        SchedulerFactory schedulerFactory = new StdSchedulerFactory();
        scheduler = schedulerFactory.getScheduler();
        scheduler.start();
    }

    public static void main(String[] args) throws SchedulerException {
        App app = new App();

        // Serve static files from React's build folder
        staticFiles.externalLocation("frontend/build");

        // Simple /hello route for testing
        get("/hello", (req, res) -> "Hello, world!");

        // Endpoint to trigger an instant scan
        post("/api/instant-scan", (req, res) -> {
            String body = req.body();
            logger.log(Level.INFO, "Request Body: {0}", body);

            // Parse URL and scanType from request body
            @SuppressWarnings("unchecked")
            Map<String, String> data = new Gson().fromJson(req.body(), Map.class);
            String url = data.get("url");
            String scanType = data.get("scanType");

            logger.log(Level.INFO, "Starting instant scan for URL: {0} with scan type: {1}", new Object[]{url, scanType});

            try {
                // Start the ZAP scan and return the scan ID
                String scanId = app.zapService.startInstantScan(url, scanType);
                logger.log(Level.INFO, "Scan started with ID: {0}", scanId);

                // Return the scan ID to the client immediately
                res.status(200);
                return new Gson().toJson(Map.of("scanId", scanId, "message", "Scan started for " + url + " with scan type " + scanType));
            } catch (ClientApiException e) {
                logger.log(Level.SEVERE, "Error during scan", e);
                res.status(500);
                return "Error during scan: " + e.getMessage();
            }
        });

        // Endpoint to get scan results by scan ID
        get("/api/instant-scan-results/:scanId", (req, res) -> {
            String scanId = req.params("scanId");
            try {
                String results = app.zapService.getScanResultsByScanId(scanId); // Correct method
                res.type("application/json");
                res.status(200);
                return results; // Return scan results as JSON
            } catch (ClientApiException e) {
                e.printStackTrace();
                res.status(500);
                return "Error fetching scan results: " + e.getMessage();
            }
        });

        // Endpoint to schedule a scan
        post("/api/schedule-scan", (req, res) -> {
            String body = req.body();
            logger.log(Level.INFO, "Received body: {0}", body);

            try {
                // Attempt to parse the JSON into the ScanRequest object
                ScanRequest scanRequest = new Gson().fromJson(req.body(), ScanRequest.class);

                // Combine date and time into a single Date object
                String dateTimeString = scanRequest.getDate() + "T" + scanRequest.getTime() + ":00";  
                java.time.LocalDateTime localDateTime = java.time.LocalDateTime.parse(dateTimeString);
                java.time.ZonedDateTime zonedDateTime = localDateTime.atZone(java.time.ZoneId.systemDefault());
                Date startTime = Date.from(zonedDateTime.toInstant());
                scanRequest.setStartTime(startTime);

                logger.log(Level.INFO, "Scheduled Start Time: {0}", scanRequest.getStartTime());

                // Schedule the scan
                app.scheduleScan(scanRequest);
                scheduledScans.add(scanRequest); // Add the scheduled scan to the list
                res.status(200);
                return "Scan Scheduled Successfully!";
            } catch (SchedulerException e) {
                logger.log(Level.SEVERE, "Failed to schedule scan", e);
                res.status(500);
                return "Failed to schedule scan: " + e.getMessage();
            } catch (Exception e) {
                logger.log(Level.SEVERE, "Error in scheduling scan", e);
                res.status(500);
                return "Error in scheduling scan: " + e.getMessage();
            }
        });

        // Endpoint to get all scheduled scans
        get("/api/scheduled-scans", (req, res) -> {
            res.type("application/json");
            return new Gson().toJson(scheduledScans);  // Return scheduled scans as JSON
        });

        // Endpoint to delete a scheduled scan
        delete("/api/schedule-scan/:index", (req, res) -> {
            int index = Integer.parseInt(req.params("index"));

            if (index >= 0 && index < scheduledScans.size()) {
                scheduledScans.remove(index);  // Remove the task from the list
                res.status(200);
                return "Task deleted successfully";
            } else {
                res.status(404);
                return "Task not found";
            }
        });

        // Serve React app for any unmatched routes (client-side routing)
        get("/*", (req, res) -> {
            res.redirect("/index.html");
            return null;
        });
    }

    public String scheduleScan(ScanRequest scanRequest) throws SchedulerException {
        int intervalInMinutes;

        // Convert string intervals to numeric values
        switch (scanRequest.getInterval().toLowerCase()) {
            case "daily":
                intervalInMinutes = 1440; // 24 hours * 60 minutes
                break;
            case "weekly":
                intervalInMinutes = 10080; // 7 days * 24 hours * 60 minutes
                break;
            case "monthly":
                intervalInMinutes = 43200; // 30 days * 24 hours * 60 minutes (approx)
                break;
            default:
                throw new IllegalArgumentException("Invalid interval: " + scanRequest.getInterval());
        }

        // Use consistent job name but unique trigger name
        String jobName = "networkScanJob_" + scanRequest.getUrl();
        String triggerName = "networkScanTrigger_" + System.currentTimeMillis() + "_" + scanRequest.getUrl();

        JobDetail jobDetail = JobBuilder.newJob(SimpleJob.class)
                .withIdentity(jobName, "group1")  // Same job name for the same scan
                .usingJobData("url", scanRequest.getUrl())
                .usingJobData("script", scanRequest.getScript())
                .usingJobData("scanType", scanRequest.getScanType())  // Pass scanType to the job
                .build();

        Trigger trigger = TriggerBuilder.newTrigger()
                .withIdentity(triggerName, "group1")  // Unique trigger for each schedule
                .startAt(scanRequest.getStartTime()) // Make sure startTime is not null
                .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInMinutes(intervalInMinutes)
                        .repeatForever())
                .build();

        scheduler.scheduleJob(jobDetail, trigger);
        return "Scan Scheduled Successfully!";
    }

    public static class SimpleJob implements Job {
        @Override
        public void execute(JobExecutionContext context) throws JobExecutionException {
            String url = context.getJobDetail().getJobDataMap().getString("url");
            String script = context.getJobDetail().getJobDataMap().getString("script");
            String scanType = context.getJobDetail().getJobDataMap().getString("scanType");

            System.out.println("Executing scheduled job...");
            System.out.println("URL: " + url + ", Script: " + script + ", Scan Type: " + scanType);

            // Placeholder for ZAP scan logic
        }
    }

    public static class ScanRequest {
        private String url;
        private String interval;
        private String script;
        private java.util.Date startTime;
        private String date; // Added date field
        private String time; // Added time field
        private String scanType;  // New scanType field

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getInterval() {
            return interval;
        }

        public void setInterval(String interval) {
            this.interval = interval;
        }

        public String getScript() {
            return script;
        }

        public void setScript(String script) {
            this.script = script;
        }

        public java.util.Date getStartTime() {
            return startTime;
        }

        public void setStartTime(java.util.Date startTime) {
            this.startTime = startTime;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public String getTime() {
            return time;
        }

        public void setTime(String time) {
            this.time = time;
        }

        public String getScanType() {
            return scanType;
        }

        public void setScanType(String scanType) {
            this.scanType = scanType;
        }
    }
}
