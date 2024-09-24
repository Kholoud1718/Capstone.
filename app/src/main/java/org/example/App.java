package org.example;

import java.util.Map;

import org.example.App.ScanRequest;
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

public class App {

    private final Scheduler scheduler;

    public App() throws SchedulerException {
        // Initialize the scheduler using Quartz
        SchedulerFactory schedulerFactory = new StdSchedulerFactory();
        scheduler = schedulerFactory.getScheduler();
        scheduler.start();
    }

    public static void main(String[] args) throws SchedulerException {
        App app = new App();

        // Endpoint to trigger an instant scan
        post("/api/instant-scan", (req, res) -> {
            String url = new Gson().fromJson(req.body(), Map.class).get("url").toString();

            // Placeholder for ZAP API logic
            System.out.println("Starting instant scan for URL: " + url);

            res.status(200);
            return "Scan started for " + url;
        });

        // Endpoint to schedule a scan using Quartz
        post("/api/schedule-scan", (req, res) -> {
            ScanRequest scanRequest = new Gson().fromJson(req.body(), ScanRequest.class);

            try {
                app.scheduleScan(scanRequest);
            } catch (SchedulerException e) {
                e.printStackTrace();
                res.status(500);
                return "Failed to schedule scan";
            }

            res.status(200);
            return "Scan Scheduled Successfully!";
        });
    }

    // Method to schedule a job
    public String scheduleScan(ScanRequest scanRequest) throws SchedulerException {
        // Define the job and tie it to SimpleJob class
        JobDetail jobDetail = JobBuilder.newJob(SimpleJob.class)
                .withIdentity("networkScanJob", "group1")
                .usingJobData("url", scanRequest.getUrl())  // Pass URL to the job
                .usingJobData("script", scanRequest.getScript()) // Pass script type to the job
                .build();

        // Configure the trigger for the job
        Trigger trigger = TriggerBuilder.newTrigger()
                .withIdentity("networkScanTrigger", "group1")
                .startAt(scanRequest.getStartTime())  // Use the start time from the request
                .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInMinutes(scanRequest.getInterval())
                        .repeatForever())
                .build();

        // Schedule the job with the trigger
        scheduler.scheduleJob(jobDetail, trigger);
        return "Scan Scheduled Successfully!";
    }

    // SimpleJob class that executes the scheduled job
    public static class SimpleJob implements Job {
        @Override
        public void execute(JobExecutionContext context) throws JobExecutionException {
            String url = context.getJobDetail().getJobDataMap().getString("url");
            String script = context.getJobDetail().getJobDataMap().getString("script");

            System.out.println("Executing scheduled job...");
            System.out.println("URL: " + url + ", Script: " + script);

            // Placeholder for ZAP scan logic (e.g., start ZAP scan)
            // You can trigger ZAP's API based on the script and URL provided
        }
    }

    // Inner class ScanRequest to handle scheduling data
    public static class ScanRequest {
        private String url;
        private int interval;
        private String script;
        private java.util.Date startTime;

        // Getters and Setters
        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public int getInterval() {
            return interval;
        }

        public void setInterval(int interval) {
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
    }
}
