// frontend/src/services/api.js

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Authentication
export const register = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
  return response.data;
};

// Recommendations
export const getCollaborativeRecommendations = async (userId, token) => {
  const response = await axios.get(`${API_BASE_URL}/recommendations/collaborative/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getContentRecommendations = async (userId, token) => {
  const response = await axios.get(`${API_BASE_URL}/recommendations/content/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Add Rating
export const addRating = async (ratingData, token) => {
  const response = await axios.post(`${API_BASE_URL}/ratings/rate`, ratingData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
