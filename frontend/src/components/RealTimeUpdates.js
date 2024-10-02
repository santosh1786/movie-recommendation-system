// frontend/src/components/RealTimeUpdates.js

import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const RealTimeUpdates = () => {
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    socket.on('newRating', (data) => {
      setUpdates(prev => [...prev, data]);
    });

    return () => {
      socket.off('newRating');
    };
  }, []);

  return (
    <div>
      <h2>Real-time Updates</h2>
      <ul>
        {updates.map((update, index) => (
          <li key={index}>
            User {update.userId} rated "{update.movieTitle}" with a score of {update.rating}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RealTimeUpdates;
