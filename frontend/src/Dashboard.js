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
import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import './Dashboard.css';
import { getMockScanActivity, getMockVulnerabilities } from './mockData'; // Mock data functions (still included)

// Register Chart.js elements
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Dashboard = () => {
  const [severityFilter, setSeverityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('Newest');
  const [doughnutData, setDoughnutData] = useState({});
  const [barData, setBarData] = useState({});
  const [tableData, setTableData] = useState([]);
  const [identifiedTotal, setIdentifiedTotal] = useState(0); // Total identified vulnerabilities
  const [remediatedTotal, setRemediatedTotal] = useState(0); // Total remediated vulnerabilities
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  const useMockData = process.env.REACT_APP_USE_MOCK_DATA === 'true';  // Check if using mock data

  // Function to fetch real data from the backend
  const fetchRealData = () => {
    // Fetch vulnerabilities from your backend API
    fetch('http://localhost:4567/api/vulnerabilities')
      .then(response => response.json())
      .then(data => {
        // Update Doughnut Chart Data
        setDoughnutData({
          labels: ['Critical', 'High', 'Medium', 'Low'],
          datasets: [
            {
              label: 'Vulnerabilities',
              data: data ? [data.critical || 0, data.high || 0, data.medium || 0, data.low || 0] : [0, 0, 0, 0],
              backgroundColor: ['#ff0000', '#ffcc00', '#ffa500', '#00ff00'],
            },
          ],
        });

        // Update Bar Chart Data
        setBarData({
          labels: ['Critical', 'High', 'Medium', 'Low'],
          datasets: [
            {
              label: 'Identified Vulnerabilities',
              data: data.identified || [],
              backgroundColor: '#ff0000',
            },
            {
              label: 'Remediated Vulnerabilities',
              data: data.remediated || [],
              backgroundColor: '#00ff00',
            },
          ],
        });

        // Calculate totals for identified and remediated vulnerabilities
        const totalIdentified = data.identified.reduce((a, b) => a + b, 0);
        const totalRemediated = data.remediated.reduce((a, b) => a + b, 0);

        setIdentifiedTotal(totalIdentified);
        setRemediatedTotal(totalRemediated);
        setLoading(false); // Stop loading
      })
      .catch(err => {
        console.error('Error fetching vulnerabilities:', err);
        setError('Error fetching vulnerabilities');
        setLoading(false);
      });

    // Fetch scan activity data
    fetch('http://localhost:4567/api/alerts')
      .then(response => response.json())
      .then(data => {
        setTableData(data || []);  // Update table data
      })
      .catch(err => {
        console.error('Error fetching scan activity data:', err);
      });
  };

  // useEffect hook to fetch data
  useEffect(() => {
    if (useMockData) {
      // Use mock data
      const mockVulnerabilities = getMockVulnerabilities();
      const mockScanActivity = getMockScanActivity();

      // Set data for Doughnut Chart
      setDoughnutData({
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [
          {
            label: 'Vulnerabilities',
            data: [mockVulnerabilities.critical, mockVulnerabilities.high, mockVulnerabilities.medium, mockVulnerabilities.low],
            backgroundColor: ['#ff0000', '#ffcc00', '#ffa500', '#00ff00'],
          },
        ],
      });

      // Set data for Bar Chart
      setBarData({
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [
          {
            label: 'Identified Vulnerabilities',
            data: mockVulnerabilities.identified,
            backgroundColor: '#ff0000',
          },
          {
            label: 'Remediated Vulnerabilities',
            data: mockVulnerabilities.remediated,
            backgroundColor: '#00ff00',
          },
        ],
      });

      // Set mock table data
      setTableData(mockScanActivity);

      // Set totals
      const totalIdentified = mockVulnerabilities.identified.reduce((a, b) => a + b, 0);
      const totalRemediated = mockVulnerabilities.remediated.reduce((a, b) => a + b, 0);
      setIdentifiedTotal(totalIdentified);
      setRemediatedTotal(totalRemediated);

      setLoading(false);
    } else {
      // Fetch real data
      fetchRealData();
    }
  }, [useMockData]);

  // Function to calculate progress percentages
  const calculateProgress = (remediated, total) => {
    return total === 0 ? 0 : Math.round((remediated / total) * 100);
  };

  const assignedProgress = calculateProgress(identifiedTotal, identifiedTotal);
  const resolvedProgress = calculateProgress(remediatedTotal, identifiedTotal);

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

  // Handle loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Pentest Dashboard</h1>

      <div className="filters-container">
        {/* Filters for Severity and Date */}
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

      {/* Vulnerability Cards */}
      <div className="cards-and-chart">
        <div className="vulnerability-cards-container">
          <div className="vulnerability-card critical">
            <h2>Critical</h2>
            <p>{doughnutData.datasets ? doughnutData.datasets[0].data[0] : 0} Vulnerabilities Found</p>
          </div>
          <div className="vulnerability-card high">
            <h2>High</h2>
            <p>{doughnutData.datasets ? doughnutData.datasets[0].data[1] : 0} Vulnerabilities Found</p>
          </div>
          <div className="vulnerability-card medium">
            <h2>Medium</h2>
            <p>{doughnutData.datasets ? doughnutData.datasets[0].data[2] : 0} Vulnerabilities Found</p>
          </div>
          <div className="vulnerability-card low">
            <h2>Low</h2>
            <p>{doughnutData.datasets ? doughnutData.datasets[0].data[3] : 0} Vulnerabilities Found</p>
          </div>
        </div>

        {/* Charts and Table */}
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
              <div className="progress-bar" style={{ width: `${assignedProgress}%`, backgroundColor: '#007bff' }}>
                {assignedProgress}%
              </div>
            </div>
            <p style={{ color: '#949695', fontWeight: 'bold' }}>Resolved Vulnerabilities Progress</p>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${resolvedProgress}%`, backgroundColor: '#007bff' }}>
                {resolvedProgress}%
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
                  <th>Status</th>
                  <th>Rate</th>
                  <th>Time</th>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tableData && Array.isArray(tableData) && tableData.length > 0 ? (
                  tableData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.id}</td>
                      <td>{row.severity}</td>
                      <td>{row.description}</td>
                      <td>{row.status}</td>
                      <td>{row.rate}</td>
                      <td>{row.time}</td>
                      <td>{row.date}</td>
                      <td>{row.action}</td>
                      <td>{row.scanStatus}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9">No data available</td>
                  </tr>
                )}
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
