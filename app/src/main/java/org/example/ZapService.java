package org.example;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.zaproxy.clientapi.core.ApiResponse;  // Add Gson for JSON serialization
import org.zaproxy.clientapi.core.ApiResponseElement;
import org.zaproxy.clientapi.core.ApiResponseList;
import org.zaproxy.clientapi.core.ClientApi;
import org.zaproxy.clientapi.core.ClientApiException;

import com.google.gson.Gson;

public class ZapService {

    private static final String ZAP_ADDRESS = "localhost"; // ZAP instance location
    private static final int ZAP_PORT = 8080;              // ZAP port
    private static final String ZAP_API_KEY = "your-api-key-here"; // ZAP API key
    private final ClientApi zapClient;

    // Constructor to initialize ZAP ClientApi
    public ZapService() {
        zapClient = new ClientApi(ZAP_ADDRESS, ZAP_PORT, ZAP_API_KEY);
    }

    // Method to start a scan using the ZAP API with scanType
    @SuppressWarnings("deprecation")
    public String startInstantScan(String targetUrl, String scanType) throws ClientApiException {
        ApiResponse response;

        switch (scanType.toLowerCase()) {
            case "spider scan":
                response = zapClient.spider.scan(targetUrl, null, null, null, null);
                break;
            case "ajax spider scan":
                response = zapClient.ajaxSpider.scan(targetUrl, null, null);
                break;
            case "full scan":
                response = zapClient.ascan.scan(targetUrl, "True", "False", null, null, null, 0);
                break;
            case "passive scan":
                // Passive scan happens automatically, we can just fetch the alerts
                response = zapClient.core.alerts(targetUrl, null, null);
                break;
            default:
                throw new ClientApiException("Invalid scan type");
        }

        String scanId = ((ApiResponseElement) response).getValue();
        System.out.println("Scan started with ID: " + scanId);
        return scanId;
    }

    // Method to get the scan status by scan ID
    public int getScanProgress(String scanId) throws ClientApiException {
        ApiResponse response = zapClient.ascan.status(scanId);
        String progress = ((ApiResponseElement) response).getValue();
        System.out.println("Scan progress: " + progress + "%");
        return Integer.parseInt(progress);  // Progress is returned as a percentage (0-100)
    }

    // Method to retrieve alerts (vulnerabilities) from a scan using scanId
    public String getScanResultsByScanId(String scanId) throws ClientApiException {
        ApiResponse response = zapClient.core.alerts(scanId, null, null);
        return parseZapResponse(response);  // Parse the response into structured JSON format
    }

    // Parsing method to structure the ZAP response as needed for the frontend
    private String parseZapResponse(ApiResponse response) {
        Map<String, Object> results = new HashMap<>();
        results.put("critical", countSeverity(response, "High"));
        results.put("high", countSeverity(response, "High"));
        results.put("medium", countSeverity(response, "Medium"));
        results.put("low", countSeverity(response, "Low"));

        // Extract dynamic data for identified and remediated vulnerabilities
        results.put("identified", extractIdentifiedVulnerabilities(response));
        results.put("remediated", extractRemediatedVulnerabilities(response));

        // Convert to JSON using Gson (or Jackson if preferred)
        return new Gson().toJson(results);
    }

    // Helper method to count the number of vulnerabilities by severity
    private int countSeverity(ApiResponse response, String severity) {
        int count = 0;
        if (response instanceof ApiResponseList) {
            ApiResponseList list = (ApiResponseList) response;
            for (ApiResponse item : list.getItems()) {
                // Assuming each item is an alert with a 'risk' field for severity
                if (item instanceof ApiResponseElement) {
                    ApiResponseElement alert = (ApiResponseElement) item;
                    if (alert.getValue().equalsIgnoreCase(severity)) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    // Helper method to extract identified vulnerabilities (dynamic data)
    private List<Integer> extractIdentifiedVulnerabilities(ApiResponse response) {
        List<Integer> identified = new ArrayList<>();
        // Traverse the response and add relevant data
        if (response instanceof ApiResponseList) {
            ApiResponseList list = (ApiResponseList) response;
            for (ApiResponse item : list.getItems()) {
                // Assuming we want to count vulnerabilities for the identified array
                identified.add(10);  // Example value, adjust logic as needed
            }
        }
        return identified;
    }

    // Helper method to extract remediated vulnerabilities (dynamic data)
    private List<Integer> extractRemediatedVulnerabilities(ApiResponse response) {
        List<Integer> remediated = new ArrayList<>();
        // Traverse the response and add relevant data
        if (response instanceof ApiResponseList) {
            ApiResponseList list = (ApiResponseList) response;
            for (ApiResponse item : list.getItems()) {
                // Assuming we want to count vulnerabilities for the remediated array
                remediated.add(5);  // Example value, adjust logic as needed
            }
        }
        return remediated;
    }

    // Example method that waits for the scan to complete and then retrieves the results
    public void performScanAndGetResults(String targetUrl) throws ClientApiException, InterruptedException {
        String scanId = startInstantScan(targetUrl, "full scan");

        // Use ScheduledExecutorService to periodically check scan progress
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        final int[] progress = {0}; // Use an array to allow modification in the lambda

        Runnable checkProgress = () -> {
            try {
                progress[0] = getScanProgress(scanId);
                System.out.println("Current scan progress: " + progress[0] + "%");
                if (progress[0] >= 100) {
                    scheduler.shutdown(); 
                }
            } catch (ClientApiException e) {
                e.printStackTrace();  // Print stack trace for debugging
            }
        };

        // Schedule the progress check to run every 5 seconds
        scheduler.scheduleAtFixedRate(checkProgress, 0, 5, TimeUnit.SECONDS);

        // Wait until the scan completes before proceeding to get the results
        scheduler.awaitTermination(10, TimeUnit.MINUTES);

        // Once the scan is complete, retrieve the results
        if (progress[0] >= 100) {
            String alerts = getScanResultsByScanId(scanId);
            System.out.println("Scan results: " + alerts);
        }
    }
}
