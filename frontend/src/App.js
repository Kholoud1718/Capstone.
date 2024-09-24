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
    const [scheduledJobs, setScheduledJobs] = useState(JSON.parse(localStorage.getItem('scheduledJobs')) || []);
    const [instantUrl, setInstantUrl] = useState(''); // Separate state for Instant Scan URL
    const [scheduledUrl, setScheduledUrl] = useState(''); // Separate state for Scheduled Scan URL

    // To load the schedule data from local storage
    useEffect(() => {
        localStorage.removeItem('script'); 
    }, []);

    // Save the schedule to local storage
    useEffect(() => {
        localStorage.setItem('script', script);
        localStorage.setItem('interval', interval);
        localStorage.setItem('day', day);
        localStorage.setItem('time', time);
        localStorage.setItem('date', date);
        localStorage.setItem('scheduledUrl', scheduledUrl);
        localStorage.setItem('scheduledJobs', JSON.stringify(scheduledJobs));
    }, [script, interval, day, time, date, scheduledUrl, scheduledJobs]);

    // Function to schedule the task
    const scheduleScript = () => {
        if (!script || (interval === 'Monthly' && !date) || !scheduledUrl) {
            alert('Please fill in all fields before scheduling a task!');
            return;
        }

        const newJob = { script, interval, day, time, date: interval === 'Monthly' ? date : '', scheduledUrl };
        setScheduledJobs([...scheduledJobs, newJob]);
        setScheduledUrl('');
        setDate('');
        setScript('');

        // Pop-up message for successful scheduling
        alert('Task successfully scheduled!');
    };

// Function to perform an instant scan
const performInstantScan = () => {
    if (!instantUrl) {
        alert('Please enter a URL for the instant scan!');
        return;
    }

    // Logic to perform the instant scan (e.g., API call)

    // Pop-up message for the instant scan
    alert(`Instant scan started for: ${instantUrl}. Please visit the Dashboard to view the scan results.`);
    
    // Refresh the page after the pop-up message
    window.location.reload(); // This will refresh the page
};

    // Function to delete a scheduled task
    const deleteTask = (index) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this task?');
        if (confirmDelete) {
            const updatedJobs = scheduledJobs.filter((_, jobIndex) => jobIndex !== index);
            setScheduledJobs(updatedJobs);
            localStorage.setItem('scheduledJobs', JSON.stringify(updatedJobs));
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
                {/* Navigation Bar */}
                <nav className="navbar">
                    <div className="logo-container">
                        <img src={logo} alt="App Logo" className="navbar-logo" />
                    </div>
                    <ul className="nav-links">
                        <li><Link to="/" className="nav-item"><i className="fas fa-calendar-alt"></i> Scheduler</Link></li>
                        <li><Link to="/dashboard" className="nav-item"><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
                    </ul>
                    <div className="login-search">
                        <button className="login-btn"><i className="fas fa-sign-in-alt"></i> Login</button>
                        <input type="text" placeholder="Search..." className="search-bar" />
                    </div>
                </nav>

                {/* Routes for Scheduler and Dashboard */}
                <Routes>
                    <Route path="/" element={
                        <div className="scheduler-container">
                            {/* Wrapper for the Title */}
                            <div className="title-wrapper">
                                <h1 className="main-title">Automation Scheduler</h1>
                            </div>

                            <div className="scheduler-fields-table">
                                <div className="scheduler-form">
                                    {/* Instant Scan Section */}
                                    <div className="form-group">
                                        <h2>Instant Scan</h2>
                                        <label><i className="fas fa-globe"></i> Enter Webpage URL for Instant Scan:</label>
                                        <input type="text" placeholder="https://example.com" value={instantUrl} onChange={(e) => setInstantUrl(e.target.value)} required />
                                        <button className="schedule-btn" onClick={performInstantScan}>
                                            <i className="fas fa-play-circle"></i> Start Instant Scan
                                        </button>
                                    </div>

                                    <hr />

                                    {/* Select Scan Type */}
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

                                    {/* Input for Webpage URL for Scheduled Scan */}
                                    <div className="form-group">
                                        <label><i className="fas fa-globe"></i> Enter Webpage URL for Scheduled Scan:</label>
                                        <input type="text" placeholder="https://example.com" value={scheduledUrl} onChange={(e) => setScheduledUrl(e.target.value)} required />
                                    </div>

                                    {/* Select Interval */}
                                    <div className="form-group">
                                        <label><i className="fas fa-sync-alt"></i> Select Interval:</label>
                                        <select onChange={(e) => handleIntervalChange(e.target.value)} value={interval}>
                                            <option value="Daily">Daily</option>
                                            <option value="Weekly">Weekly</option>
                                            <option value="Monthly">Monthly</option>
                                        </select>
                                    </div>

                                    {/* Calendar for Monthly Scan */}
                                    {interval === 'Monthly' && (
                                        <div className="form-group">
                                            <label><i className="fas fa-calendar"></i> Select Date for Monthly Scan:</label>
                                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                                        </div>
                                    )}

                                    {/* Daily and Weekly Day Selection */}
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

                                    {/* Select Time */}
                                    <div className="form-group">
                                        <label><i className="fas fa-clock"></i> Select Time:</label>
                                        <input type="time" onChange={(e) => setTime(e.target.value)} value={time} required />
                                    </div>

                                    <button className="schedule-btn" onClick={scheduleScript}>
                                        <i className="fas fa-plus-circle"></i> Schedule Task
                                    </button>
                                </div>

                                {/* Scheduled Tasks Table */}
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
                                                    <td>{job.interval === 'Monthly' ? job.date : job.day}</td>
                                                    <td>{job.time}</td>
                                                    <td>{job.scheduledUrl}</td>
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
