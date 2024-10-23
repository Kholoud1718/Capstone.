// package org.example;

// import org.quartz.Job;
// import org.quartz.JobExecutionContext;
// import org.quartz.JobExecutionException;
// import org.zaproxy.clientapi.core.ClientApiException;

// public class SimpleJob implements Job {

//     @Override
//     public void execute(JobExecutionContext context) throws JobExecutionException {
//         // Retrieve job data (URL, scan type) from JobDataMap
//         String url = context.getJobDetail().getJobDataMap().getString("url");
//         String scanType = context.getJobDetail().getJobDataMap().getString("scanType");

//         // Log the job execution with job details
//         System.out.println("Scheduled job triggered at: " + new java.util.Date());
//         System.out.println("URL: " + url + ", Scan Type: " + scanType);

//         // Check if URL or scanType are null or empty
//         if (url == null || url.isEmpty()) {
//             System.err.println("Error: URL is missing or empty");
//             return;
//         }

//         if (scanType == null || scanType.isEmpty()) {
//             System.err.println("Error: Scan type is missing or empty");
//             return;
//         }

//         // Initialize the ZapService to interact with ZAP
//         ZapService zapService = new ZapService();
//         try {
//             // Trigger the ZAP scan (use the same method as instant scan)
//             String scanId = zapService.startInstantScan(url, scanType);  // Link with instant scan logic
//             System.out.println("Scheduled scan started with ID: " + scanId);
//         } catch (ClientApiException e) {
//             // Handle any exceptions that occur during the scan
//             System.err.println("Error during scheduled scan execution: " + e.getMessage());
//             e.printStackTrace();
//         } catch (Exception e) {
//             // Handle any other unexpected exceptions
//             System.err.println("Unexpected error during scheduled scan: " + e.getMessage());
//             e.printStackTrace();
//         }
//     }
// }
