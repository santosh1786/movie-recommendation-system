// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import Recommendations from './components/Recommendations';
import GraphVisualization from './components/GraphVisualization';
import Login from './components/Login';
import RealTimeUpdates from './components/RealTimeUpdates';
import axios from 'axios';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    if (token) {
      // Decode token to get userId if needed
      // For simplicity, assuming userId is stored separately
      // Alternatively, store userId in token payload
      // Here, we'll set a default userId
      setUserId('user1'); // Replace with dynamic userId as needed
    }
  }, [token]);

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <div className="App">
      <header>
        <h1>Movie Recommendation System</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <Recommendations userId={userId} token={token} />
      <GraphVisualization />
      <RealTimeUpdates />
    </div>
  );
}

export default App;
