// frontend/src/components/Recommendations.js

import React, { useEffect, useState } from 'react';
import { getCollaborativeRecommendations, getContentRecommendations } from '../services/api';

const Recommendations = ({ userId, token }) => {
  const [collaborative, setCollaborative] = useState([]);
  const [content, setContent] = useState([]);

  useEffect(() => {
    const fetchCollaborative = async () => {
      try {
        const data = await getCollaborativeRecommendations(userId, token);
        setCollaborative(data);
      } catch (error) {
        console.error('Error fetching collaborative recommendations:', error);
      }
    };

    const fetchContent = async () => {
      try {
        const data = await getContentRecommendations(userId, token);
        setContent(data);
      } catch (error) {
        console.error('Error fetching content-based recommendations:', error);
      }
    };

    fetchCollaborative();
    fetchContent();
  }, [userId, token]);

  return (
    <div>
      <h2>Collaborative Filtering Recommendations</h2>
      <ul>
        {collaborative.map((rec, index) => (
          <li key={index}>
            {rec.title} (Score: {rec.score})
          </li>
        ))}
      </ul>

      <h2>Content-Based Recommendations</h2>
      <ul>
        {content.map((rec, index) => (
          <li key={index}>
            {rec.title} (Genre Matches: {rec.genreMatch})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Recommendations;
