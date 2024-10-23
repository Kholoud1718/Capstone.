// mockData.js
export const getMockVulnerabilities = () => {
    return {
      critical: 15,
      high: 5,
      medium: 8,
      low: 2,
      identified: [15, 5, 8, 2],
      remediated: [10, 4, 6, 1],
    };
  };
  
  export const getMockScanActivity = () => {
    return [
      {
        id: 101,
        severity: "Critical",
        description: "DVWADomain Controller",
        status: "Exploited",
        rate: "90%",
        time: "09:00 AM",
        date: "2024-10-19",
        action: "Spider Scan",
        scanStatus: "Completed",
      },
      {
        id: 102,
        severity: "High",
        description: "Linux Metasploitable 2",
        status: "Exploited",
        rate: "75%",
        time: "01:00 AM",
        date: "2024-05-09",
        action: "Machine Scan",
        scanStatus: "Completed",
      },
      {
        id: 103,
        severity: "Medium",
        description: "Mutillidae Full Scan",
        status: "Exploited",
        rate: "65%",
        time: "03:00 PM",
        date: "2024-10-09",
        action: "Full Scan",
        scanStatus: "In Progress",
      },
    ];
  };
  