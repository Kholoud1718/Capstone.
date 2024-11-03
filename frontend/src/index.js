import React from 'react';
import ReactDOM from 'react-dom/client'; // Correct import from 'react-dom/client'
import App from './App'; // Your main App component
import './index.css'; // Your CSS

// Create the root using createRoot from 'react-dom/client'
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
