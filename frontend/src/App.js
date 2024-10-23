import '@fortawesome/fontawesome-free/css/all.min.css'; // Import Font Awesome icons
import React, { useEffect, useState } from 'react';
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import logo from './assets/LOGO.jpg';
import Dashboard from './Dashboard';
import './styles.css';

// App Component with Scheduler logic
const App = () => {
    const [script, setScript] = useState('');
    const [interval, setInterval] = useState('Daily');
    const [day, setDay] = useState('Monday');
    const [time, setTime] = useState('01:00');
    const [date, setDate] = useState('');
    const [scheduledJobs, setScheduledJobs] = useState([]);
    const [instantUrl, setInstantUrl] = useState(''); // Separate state for Instant Scan URL
    const [scheduledUrl, setScheduledUrl] = useState(''); // Separate state for Scheduled Scan URL
    const [instantScanType, setInstantScanType] = useState(''); // New state for instant scan type

    // Retrieve the client's time zone
    const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Load scheduled tasks from backend when component mounts
    useEffect(() => {
        fetchScheduledJobs();
    }, []);

    const fetchScheduledJobs = async () => {
        try {
            const response = await fetch('/api/scheduled-scans');
            const jobs = await response.json();
            setScheduledJobs(jobs.map(job => ({
                ...job,
                startTime: new Date(`${job.date}T${job.time}`) // Combining date and time into a Date object
            })));
        } catch (error) {
            console.error('Error fetching scheduled jobs:', error);
        }
    };

    // Function to schedule the task
    const scheduleScript = async () => {
        if (!script || !scheduledUrl || (interval === 'Monthly' && !date)) {
            alert('Please fill in all fields before scheduling a task!');
            return;
        }

        try {
            const response = await fetch('/api/schedule-scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: scheduledUrl,
                    interval,
                    day,
                    time,
                    date,
                    script,
                    clientTimeZone
                }),
            });

            if (response.ok) {
                alert('Task successfully scheduled!');
                fetchScheduledJobs(); // Fetch updated jobs
            } else {
                const result = await response.text();
                alert('Error scheduling the task: ' + result);
            }
        } catch (error) {
            console.error('Error scheduling task:', error);
            alert(`An error occurred while scheduling the task: ${error.message}`);
        }

        setScheduledUrl('');
        setDate('');
        setScript('');
    };

    // Function to perform an instant scan with URL and scan type validation
    const performInstantScan = async () => {
        if (!instantUrl || !instantScanType) {
            alert('Please enter a URL and select a scan type for the instant scan!');
            return;
        }

        if (!/^https?:\/\/.+\..+$/.test(instantUrl)) {
            alert('Please enter a valid URL that starts with http:// or https:// and has a valid domain.');
            return;
        }

        try {
            const response = await fetch('/api/instant-scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: instantUrl, scanType: instantScanType }),
            });

            if (response.ok) {
                alert(`Instant scan started for: ${instantUrl} with scan type: ${instantScanType}. Please visit the Dashboard to view the scan results.`);
            } else {
                const result = await response.text();
                alert('Error starting instant scan: ' + result);
            }
        } catch (error) {
            console.error('Error performing instant scan:', error);
            alert(`An error occurred during the scan: ${error.message}`);
        }

        window.location.reload();
    };

    // Function to delete a scheduled task
    const deleteTask = async (index) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this task?');
        if (confirmDelete) {
            try {
                const response = await fetch(`/api/schedule-scan/${index}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    alert("Task deleted successfully!");
                    fetchScheduledJobs(); // Fetch updated jobs
                } else {
                    const result = await response.text();
                    alert(`Error deleting task: ${result}`);
                }
            } catch (error) {
                console.error('Error deleting task:', error);
                alert(`An error occurred while deleting the task: ${error.message}`);
            }
        }
    };

    // Handle interval change for scheduling tasks
    const handleIntervalChange = (selectedInterval) => {
        setInterval(selectedInterval);
        if (selectedInterval !== 'Monthly') {
            setDate('');
            setDay('Monday');
        }
    };

    return (
        <Router>
            <div className="app-container">
                <nav className="navbar">
                    <div className="logo-container">
                        <img src={logo} alt="App Logo" className="navbar-logo" />
                    </div>
                    <ul className="nav-links">
                        <li><Link to="/" className="nav-item"><i className="fas fa-calendar-alt"></i> Scheduler</Link></li>
                        <li><Link to="/dashboard" className="nav-item"><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
                    </ul>
                    <div className="login-search">
                        <button className="login-btn"><i className="fas fa-sign-in-alt"></i> Logout</button>
                        <input type="text" placeholder="Search..." className="search-bar" />
                    </div>
                </nav>

                <Routes>
                    <Route path="/" element={
                        <div className="scheduler-container">
                            <div className="title-wrapper">
                                <h1 className="main-title">Automated Scan Controller</h1>
                            </div>

                            <div className="scheduler-fields-table">
                                <div className="scheduler-form">
                                    <div className="form-group">
                                        <h2>Instant Scan</h2>
                                        <label><i className="fas fa-globe"></i> Enter Webpage URL for Instant Scan:</label>
                                        <input type="text" placeholder="https://example.com" value={instantUrl} onChange={(e) => setInstantUrl(e.target.value)} required />
                                        
                                        {/* Add dropdown for scan type */}
                                        <label><i className="fas fa-clipboard-list"></i> Select Scan Type for Instant Scan:</label>
                                        <select onChange={(e) => setInstantScanType(e.target.value)} value={instantScanType} required>
                                            <option value="" disabled>Select a scan type</option>
                                            <option value="Passive Scan">Passive Scan</option>
                                            <option value="Spider Scan">Spider Scan</option>
                                            <option value="Ajax Spider Scan">Ajax Spider Scan</option>
                                            <option value="Full Scan">Full Scan</option>
                                            <option value="Machine Scan">Machine Scan</option>
                                        </select>

                                        <button className="schedule-btn" onClick={performInstantScan}>
                                            <i className="fas fa-play-circle"></i> Start Instant Scan
                                        </button>
                                    </div>

                                    <hr />

                                    <div className="form-group">
                                        <label><i className="fas fa-clipboard-list"></i> Select Scan type (Script):</label>
                                        <select onChange={(e) => setScript(e.target.value)} value={script} required>
                                            <option value="" disabled>Select a scan type</option>
                                            <option value="Passive Scan">Passive Scan</option>
                                            <option value="Spider Scan">Spider Scan</option>
                                            <option value="Ajax Spider Scan">Ajax Spider Scan</option>
                                            <option value="Full Scan">Full Scan</option>
                                            <option value="Machine Scan">Machine Scan</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label><i className="fas fa-globe"></i> Enter Webpage URL for Scheduled Scan:</label>
                                        <input type="text" placeholder="https://example.com" value={scheduledUrl} onChange={(e) => setScheduledUrl(e.target.value)} required />
                                    </div>

                                    <div className="form-group">
                                        <label><i className="fas fa-sync-alt"></i> Select Interval:</label>
                                        <select onChange={(e) => handleIntervalChange(e.target.value)} value={interval}>
                                            <option value="Daily">Daily</option>
                                            <option value="Weekly">Weekly</option>
                                            <option value="Monthly">Monthly</option>
                                        </select>
                                    </div>

                                    {interval === 'Monthly' && (
                                        <div className="form-group">
                                            <label><i className="fas fa-calendar"></i> Select Date for Monthly Scan:</label>
                                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                                        </div>
                                    )}

                                    {(interval === 'Daily' || interval === 'Weekly') && (
                                        <div className="form-group">
                                            <label><i className="fas fa-calendar-day"></i> Select Day:</label>
                                            <select onChange={(e) => setDay(e.target.value)} value={day}>
                                                <option value="Monday">Monday</option>
                                                <option value="Tuesday">Tuesday</option>
                                                <option value="Wednesday">Wednesday</option>
                                                <option value="Thursday">Thursday</option>
                                                <option value="Friday">Friday</option>
                                                <option value="Saturday">Saturday</option>
                                                <option value="Sunday">Sunday</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label><i className="fas fa-clock"></i> Select Time:</label>
                                        <input type="time" onChange={(e) => setTime(e.target.value)} value={time} required />
                                    </div>

                                    <button className="schedule-btn" onClick={scheduleScript}>
                                        <i className="fas fa-plus-circle"></i> Schedule Task
                                    </button>
                                </div>

                                <div className="task-table-container">
                                    <h2 className="scheduled-tasks-heading">Scheduled Tasks</h2>
                                    <table className="unique-task-table">
                                        <thead>
                                            <tr>
                                                <th>Script</th>
                                                <th>Interval</th>
                                                <th>Day/Date</th>
                                                <th>Time</th>
                                                <th>Webpage URL</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {scheduledJobs.map((job, index) => (
                                                <tr key={index}>
                                                    <td>{job.script}</td>
                                                    <td>{job.interval}</td>
                                                    <td>{new Date(job.startTime).toLocaleDateString()}</td>
                                                    <td>{new Date(job.startTime).toLocaleTimeString()}</td>
                                                    <td>{job.url}</td>
                                                    <td>
                                                        <button className="delete-btn" onClick={() => deleteTask(index)}>
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    } />
                    <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
