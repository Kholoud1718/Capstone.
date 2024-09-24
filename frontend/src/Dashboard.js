import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import React, { useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import './Dashboard.css';

// Register the necessary Chart.js elements
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Dashboard = () => {
  const [severityFilter, setSeverityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('Newest');

  // Data for the charts
  const doughnutData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Vulnerabilities',
        data: [15, 5, 8, 2], // Adjust these values as needed
        backgroundColor: ['#ff0000', '#ffcc00', '#ffa500', '#00ff00'],
      },
    ],
  };

  const barData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Identified Vulnerabilities',
        data: [15, 5, 8, 2], // Adjust your data as needed
        backgroundColor: '#ff0000',
      },
      {
        label: 'Remediated Vulnerabilities',
        data: [10, 4, 6, 1], // Adjust your data as needed
        backgroundColor: '#00ff00',
      },
    ],
  };

  // Function to export table as PDF
  const exportPDF = (tableId) => {
    const doc = new jsPDF();
    doc.text('Table Data', 20, 20);
    doc.autoTable({ html: `#${tableId}` });
    doc.save('table-data.pdf');
  };

  // Function to export table as CSV
  const exportCSV = (tableId) => {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll('tr');
    const csvData = [];

    rows.forEach((row) => {
      const cols = row.querySelectorAll('td, th');
      const csvRow = [];
      cols.forEach((col) => {
        csvRow.push(col.innerText);
      });
      csvData.push(csvRow.join(','));
    });

    const csvString = csvData.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'table-data.csv';
    link.click();
  };

  return (
    <div className="dashboard-container">
      <h1>Pentest Dashboard</h1>

      <div className="filters-container">
        <div>
          <label htmlFor="severity-filter" style={{ color: 'white' }}>Filter by Severity:</label>
          <select id="severity-filter" onChange={(e) => setSeverityFilter(e.target.value)} value={severityFilter}>
            <option value="All">All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label htmlFor="date-filter" style={{ color: 'white' }}>Sort by Date:</label>
          <select id="date-filter" onChange={(e) => setDateFilter(e.target.value)} value={dateFilter}>
            <option value="Newest">Newest to Oldest</option>
            <option value="Oldest">Oldest to Newest</option>
          </select>
        </div>
      </div>

      {/* Vulnerability Cards and Circular Chart */}
      <div className="cards-and-chart">
        <div className="vulnerability-cards-container">
          <div className="vulnerability-card critical">
            <h2>Critical</h2>
            <p>15 Vulnerabilities Found</p>
          </div>
          <div className="vulnerability-card high">
            <h2>High</h2>
            <p>5 Vulnerabilities Found</p>
          </div>
          <div className="vulnerability-card medium">
            <h2>Medium</h2>
            <p>8 Vulnerabilities Found</p>
          </div>
          <div className="vulnerability-card low">
            <h2>Low</h2>
            <p>2 Vulnerabilities Found</p>
          </div>
        </div>

        <div className="charts-and-tables-container">
          {/* Circular Chart */}
          <div className="circular-chart-container">
            <h3>Total Vulnerabilities</h3>
            <Doughnut data={doughnutData} />
          </div>

          {/* Bar Chart and Progress Bars */}
          <div className="bar-chart-container">
            <h3>Vulnerability Distribution</h3>
            <Bar data={barData} />

            {/* Progress Overview */}
            <h3>Progress Overview</h3>
            <p style={{ color: '#949695', fontWeight: 'bold' }}>Assigned Vulnerabilities Progress</p>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: '60%', backgroundColor: '#007bff' }}>
                60%
              </div>
            </div>
            <p style={{ color: '#949695', fontWeight: 'bold' }}>Resolved Vulnerabilities Progress</p>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: '80%', backgroundColor: '#007bff' }}>
                80%
              </div>
            </div>
          </div>

          {/* Combined Table for Exploitation and Recent Activity */}
          <div className="activity-feed">
            <h3 className="table-title">Vulnerability and Exploitation Data</h3>
            <table id="combined-table" className="custom-dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Severity</th>
                  <th>Description</th>
                  <th> Status</th>
                  <th>Rate</th>
                  <th>Time</th>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>101</td>
                  <td>Critical</td>
                  <td>Domain Controller </td>
                  <td>Exploited</td>
                  <td>90%</td>
                  <td>07:00AM</td>
                  <td>10/09</td>
                  <td>Full Scan</td>
                  <td>Completed</td>
                </tr>
                <tr>
                  <td>102</td>
                  <td>High</td>
                  <td>Linux Metasploitable 2</td>
                  <td>Exploited</td>
                  <td>75%</td>
                  <td>01:00AM</td>
                  <td>05/09</td>
                  <td> Machine Scan</td>
                  <td>Completed</td>
                </tr>
                <tr>
                  <td>103</td>
                  <td>Medium</td>
                  <td>Mutillidae Full Scan</td>
                  <td>Exploited</td>
                  <td>65%</td>
                  <td>03:00PM</td>
                  <td>10/09</td>
                  <td>Full Scan</td>
                  <td>In Progress</td>
                </tr>
                <tr>
                  <td>104</td>
                  <td>Low</td>
                  <td>Mutillidae </td>
                  <td>Not Exploited</td>
                  <td>50%</td>
                  <td>00:00AM</td>
                  <td>24/10</td>
                  <td>Ajax Spider Scan</td>
                  <td>Pending</td>
                </tr>
                <tr>
                  <td>105</td>
                  <td>Critical</td>
                  <td>Mutillidae </td>
                  <td>Exploited</td>
                  <td>85%</td>
                  <td>6:00AM</td>
                  <td>20/09</td>
                  <td>Passive Scan</td>
                  <td>Success</td>
                </tr>
                <tr>
                  <td>106</td>
                  <td>High</td>
                  <td>Mutillidae Spider Scan</td>
                  <td>Exploited</td>
                  <td>70%</td>
                  <td>01:00PM</td>
                  <td>05/10</td>
                  <td>Spider Scan</td>
                  <td>In Progress</td>
                </tr>
              </tbody>
            </table>
            <div className="export-buttons">
              <button onClick={() => exportPDF('combined-table')}>Export as PDF</button>
              <button onClick={() => exportCSV('combined-table')}>Export as CSV</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
