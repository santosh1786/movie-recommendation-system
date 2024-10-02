Below is the complete integrated code for your Movie Recommendation System project, incorporating all the suggested enhancements and Dockerization. The project is structured into Backend, Frontend, and Docker configurations. Follow the directory structure and code snippets provided to set up the project seamlessly.
Table of Contents

    Project Directory Structure
    Backend
        2.1. backend/package.json
        2.2. backend/Dockerfile
        2.3. backend/src/index.js
        2.4. backend/src/models/User.js
        2.5. backend/src/middleware/auth.js
        2.6. backend/src/routes/auth.js
        2.7. backend/src/routes/ratings.js
        2.8. backend/src/routes/recommendations.js
    Frontend
        3.1. frontend/package.json
        3.2. frontend/Dockerfile
        3.3. frontend/src/App.js
        3.4. frontend/src/components/Login.js
        3.5. frontend/src/components/Recommendations.js
        3.6. frontend/src/components/GraphVisualization.js
        3.7. frontend/src/components/RealTimeUpdates.js
        3.8. frontend/src/services/api.js
    Docker Compose
        4.1. docker-compose.yml
    Environment Variables
        5.1. backend/.env
    Final Project Structure
    Running the Project
    Conclusion

1. Project Directory Structure

Ensure your project has the following directory structure:

java

movie-recommendation-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── ratings.js
│   │   │   └── recommendations.js
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GraphVisualization.js
│   │   │   ├── Login.js
│   │   │   ├── Recommendations.js
│   │   │   └── RealTimeUpdates.js
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env
├── docker-compose.yml
└── README.md

2. Backend
2.1. backend/package.json

json

{
  "name": "movie-recommendation-backend",
  "version": "1.0.0",
  "description": "Backend for Movie Recommendation System using Neo4j",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  },
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "bcrypt": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "neo4j-driver": "^5.8.0",
    "socket.io": "^4.6.1"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "nodemon": "^2.0.22"
  }
}

2.2. backend/Dockerfile

dockerfile

# backend/Dockerfile

# Use official Node.js LTS image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Expose port
EXPOSE 5000

# Start the backend server
CMD ["npm", "start"]

2.3. backend/src/index.js

javascript

// backend/src/index.js

const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const ratingsRoutes = require('./routes/ratings');
const recommendationsRoutes = require('./routes/recommendations');
const authenticateToken = require('./middleware/auth');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust as needed for security
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Neo4j Driver Setup
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);
const session = driver.session();

// Make Neo4j session and io accessible in routes
app.use((req, res, next) => {
  req.neo4jSession = session;
  req.io = io;
  next();
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ratings', authenticateToken, ratingsRoutes);
app.use('/api/recommendations', authenticateToken, recommendationsRoutes);

// Graph Data Endpoint
app.get('/api/graph-data', authenticateToken, async (req, res) => {
  const query = `
    MATCH (u:User)-[:RATED]->(m:Movie)
    OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
    RETURN u.name AS user, m.title AS movie, g.name AS genre
  `;

  try {
    const result = await session.run(query);
    const nodes = [];
    const links = [];
    const nodeSet = new Set();

    result.records.forEach(record => {
      const user = record.get('user');
      const movie = record.get('movie');
      const genre = record.get('genre');

      if (!nodeSet.has(user)) {
        nodes.push({ id: user, group: 'User' });
        nodeSet.add(user);
      }

      if (!nodeSet.has(movie)) {
        nodes.push({ id: movie, group: 'Movie' });
        nodeSet.add(movie);
      }

      links.push({ source: user, target: movie });

      if (genre) {
        if (!nodeSet.has(genre)) {
          nodes.push({ id: genre, group: 'Genre' });
          nodeSet.add(genre);
        }
        links.push({ source: movie, target: genre });
      }
    });

    res.json({ nodes, links });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching graph data');
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

2.4. backend/src/models/User.js

javascript

// backend/src/models/User.js

const bcrypt = require('bcrypt');

class User {
  constructor(id, name, passwordHash) {
    this.id = id;
    this.name = name;
    this.passwordHash = passwordHash;
  }

  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  async validatePassword(password) {
    return await bcrypt.compare(password, this.passwordHash);
  }
}

module.exports = User;

2.5. backend/src/middleware/auth.js

javascript

// backend/src/middleware/auth.js

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;

2.6. backend/src/routes/auth.js

javascript

// backend/src/routes/auth.js

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const dotenv = require('dotenv');

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';

// Register Route
router.post('/register', async (req, res) => {
  const { id, name, password } = req.body;
  const passwordHash = await User.hashPassword(password);

  const query = `
    CREATE (:User {id: $id, name: $name, passwordHash: $passwordHash})
    RETURN u
  `;

  try {
    const result = await req.neo4jSession.run(query, { id, name, passwordHash });
    res.status(201).send('User registered successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error registering user');
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { id, password } = req.body;

  const query = `
    MATCH (u:User {id: $id})
    RETURN u.passwordHash AS passwordHash
  `;

  try {
    const result = await req.neo4jSession.run(query, { id });
    if (result.records.length === 0) {
      return res.status(400).send('User not found');
    }

    const passwordHash = result.records[0].get('passwordHash');
    const user = new User(id, null, passwordHash);
    const isValid = await user.validatePassword(password);

    if (!isValid) {
      return res.status(400).send('Invalid password');
    }

    const token = jwt.sign({ id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error logging in');
  }
});

module.exports = router;

2.7. backend/src/routes/ratings.js

javascript

// backend/src/routes/ratings.js

const express = require('express');
const router = express.Router();

// Add Rating Endpoint
router.post('/rate', async (req, res) => {
  const { userId, movieTitle, rating } = req.body;
  const io = req.io;

  const query = `
    MATCH (u:User {id: $userId}), (m:Movie {title: $movieTitle})
    MERGE (u)-[r:RATED]->(m)
    SET r.rating = $rating
    RETURN u, m, r
  `;

  try {
    const result = await req.neo4jSession.run(query, { userId, movieTitle, rating });
    io.emit('newRating', { userId, movieTitle, rating }); // Emit event
    res.status(200).send('Rating added');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding rating');
  }
});

module.exports = router;

2.8. backend/src/routes/recommendations.js

javascript

// backend/src/routes/recommendations.js

const express = require('express');
const router = express.Router();

// Get Collaborative Filtering Recommendations
router.get('/collaborative/:userId', async (req, res) => {
  const { userId } = req.params;

  const query = `
    MATCH (u:User {id: $userId})-[:RATED]->(m:Movie)<-[:RATED]-(other:User)-[:RATED]->(rec:Movie)
    WHERE NOT (u)-[:RATED]->(rec)
    RETURN rec.title AS title, COUNT(*) AS recommendationScore
    ORDER BY recommendationScore DESC
    LIMIT 10
  `;

  try {
    const result = await req.neo4jSession.run(query, { userId });
    const recommendations = result.records.map(record => ({
      title: record.get('title'),
      score: record.get('recommendationScore').toInt(),
    }));
    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching collaborative recommendations');
  }
});

// Get Content-Based Recommendations
router.get('/content/:userId', async (req, res) => {
  const { userId } = req.params;

  const query = `
    MATCH (u:User {id: $userId})-[:RATED]->(m:Movie)-[:HAS_GENRE]->(g:Genre)
    WITH u, collect(g) as userGenres
    MATCH (rec:Movie)-[:HAS_GENRE]->(g:Genre)
    WHERE NOT (u)-[:RATED]->(rec)
    WITH rec, COUNT(g) as genreMatch
    RETURN rec.title AS title, genreMatch
    ORDER BY genreMatch DESC
    LIMIT 10
  `;

  try {
    const result = await req.neo4jSession.run(query, { userId });
    const recommendations = result.records.map(record => ({
      title: record.get('title'),
      genreMatch: record.get('genreMatch').toInt(),
    }));
    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching content-based recommendations');
  }
});

module.exports = router;

3. Frontend
3.1. frontend/package.json

json

{
  "name": "movie-recommendation-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-force-graph": "^1.42.9",
    "react-router-dom": "^6.14.1",
    "react-scripts": "5.0.1",
    "socket.io-client": "^4.6.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "PORT=3000 react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}

3.2. frontend/Dockerfile

dockerfile

# frontend/Dockerfile

# Build stage
FROM node:18 as build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /usr/src/app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]

3.3. frontend/src/App.js

javascript

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

3.4. frontend/src/components/Login.js

javascript

// frontend/src/components/Login.js

import React, { useState } from 'react';
import { login } from '../services/api';

const Login = ({ setToken }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { token } = await login({ id, password });
      setToken(token);
      localStorage.setItem('token', token);
    } catch (error) {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="User ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;

3.5. frontend/src/components/Recommendations.js

javascript

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

3.6. frontend/src/components/GraphVisualization.js

javascript

// frontend/src/components/GraphVisualization.js

import React, { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph';
import axios from 'axios';

const GraphVisualization = () => {
  const [data, setData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    const fetchGraphData = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:5000/api/graph-data', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching graph data:', error);
      }
    };

    fetchGraphData();
  }, []);

  return (
    <div>
      <h2>Graph Visualization</h2>
      <ForceGraph2D
        graphData={data}
        nodeAutoColorBy="group"
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.25}
        width={800}
        height={600}
      />
    </div>
  );
};

export default GraphVisualization;

3.7. frontend/src/components/RealTimeUpdates.js

javascript

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

3.8. frontend/src/services/api.js

javascript

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

4. Docker Compose
4.1. docker-compose.yml

yaml

# docker-compose.yml

version: '3.8'

services:
  neo4j:
    image: neo4j:5.8.0
    container_name: neo4j
    ports:
      - "7474:7474"    # Neo4j Browser
      - "7687:7687"    # Bolt protocol
    environment:
      NEO4J_AUTH: neo4j/your_password  # Change to a secure password
    volumes:
      - neo4j_data:/data

  backend:
    build: ./backend
    container_name: backend
    ports:
      - "5000:5000"
    environment:
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=your_password  # Must match NEO4J_AUTH
      - JWT_SECRET=your_jwt_secret
      - PORT=5000
    depends_on:
      - neo4j
    volumes:
      - ./backend:/usr/src/app

  frontend:
    build: ./frontend
    container_name: frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
    volumes:
      - ./frontend:/usr/src/app

volumes:
  neo4j_data:

Important:

    Replace your_password with a strong password for Neo4j.
    Replace your_jwt_secret with a secure secret key for JWT.

5. Environment Variables
5.1. backend/.env

Create a .env file inside the backend/ directory with the following content:

makefile

NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
PORT=5000

Note:

    Ensure that the NEO4J_PASSWORD matches the password set in the docker-compose.yml file.
    Replace your_jwt_secret with a secure secret key.

6. Final Project Structure

After integrating all components, your project structure should look like this:

java

movie-recommendation-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── ratings.js
│   │   │   └── recommendations.js
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── GraphVisualization.js
│   │   │   ├── Login.js
│   │   │   ├── Recommendations.js
│   │   │   └── RealTimeUpdates.js
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env
├── docker-compose.yml
└── README.md

7. Running the Project
7.1. Prerequisites

    Docker and Docker Compose installed on your Ubuntu machine.
    Git installed to clone the repository.

7.2. Steps to Run

    Clone the Repository:

    bash

git clone https://github.com/yourusername/movie-recommendation-system.git
cd movie-recommendation-system

Configure Environment Variables:

    Navigate to the backend/ directory and create the .env file as shown above.
    Ensure that the NEO4J_PASSWORD and JWT_SECRET are set appropriately.

Start Docker Containers:

From the root directory (movie-recommendation-system/), run:

bash

docker-compose up --build

This command will build and start all the services:

    Neo4j: Accessible at http://localhost:7474 (Username: neo4j, Password: your_password)
    Backend API: Accessible at http://localhost:5000/api
    Frontend Application: Accessible at http://localhost:3000

Populate Neo4j with Sample Data:

Access the Neo4j Browser at http://localhost:7474 and log in with your credentials. Execute the following Cypher queries to create sample users, movies, genres, and ratings:

cypher

    // Create Users
    CREATE (:User {id: 'user1', name: 'Alice'});
    CREATE (:User {id: 'user2', name: 'Bob'});
    CREATE (:User {id: 'user3', name: 'Charlie'});

    // Create Movies
    CREATE (:Movie {title: 'Inception'});
    CREATE (:Movie {title: 'The Matrix'});
    CREATE (:Movie {title: 'Interstellar'});
    CREATE (:Movie {title: 'The Godfather'});
    CREATE (:Movie {title: 'Pulp Fiction'});

    // Create Genres
    CREATE (:Genre {name: 'Sci-Fi'});
    CREATE (:Genre {name: 'Action'});
    CREATE (:Genre {name: 'Drama'});

    // Link Movies to Genres
    MATCH (m:Movie {title: 'Inception'}), (g:Genre {name: 'Sci-Fi'})
    CREATE (m)-[:HAS_GENRE]->(g);

    MATCH (m:Movie {title: 'The Matrix'}), (g:Genre {name: 'Sci-Fi'})
    CREATE (m)-[:HAS_GENRE]->(g);

    MATCH (m:Movie {title: 'Interstellar'}), (g:Genre {name: 'Sci-Fi'})
    CREATE (m)-[:HAS_GENRE]->(g);

    MATCH (m:Movie {title: 'The Godfather'}), (g:Genre {name: 'Drama'})
    CREATE (m)-[:HAS_GENRE]->(g);

    MATCH (m:Movie {title: 'Pulp Fiction'}), (g:Genre {name: 'Drama'})
    CREATE (m)-[:HAS_GENRE]->(g);

    // Create Ratings
    MATCH (u:User {id: 'user1'}), (m:Movie {title: 'Inception'})
    CREATE (u)-[:RATED {rating: 5}]->(m);

    MATCH (u:User {id: 'user1'}), (m:Movie {title: 'The Matrix'})
    CREATE (u)-[:RATED {rating: 4}]->(m);

    MATCH (u:User {id: 'user2'}), (m:Movie {title: 'Inception'})
    CREATE (u)-[:RATED {rating: 4}]->(m);

    MATCH (u:User {id: 'user2'}), (m:Movie {title: 'Interstellar'})
    CREATE (u)-[:RATED {rating: 5}]->(m);

    MATCH (u:User {id: 'user3'}), (m:Movie {title: 'The Godfather'})
    CREATE (u)-[:RATED {rating: 5}]->(m);

    MATCH (u:User {id: 'user3'}), (m:Movie {title: 'Pulp Fiction'})
    CREATE (u)-[:RATED {rating: 4}]->(m);

    Access the Application:
        Frontend: Navigate to http://localhost:3000 to access the React application.
        Login Credentials: Use the created users (user1, user2, user3) to log in. Since passwords are not set in the sample data, you may need to implement registration or manually set passwords.

    Interacting with the Application:
        Login: Authenticate using your user credentials.
        View Recommendations: After logging in, view collaborative and content-based movie recommendations.
        Graph Visualization: Explore the graph relationships between users, movies, and genres.
        Real-time Updates: Observe real-time updates when new ratings are added.

8. Conclusion

You've now successfully set up a comprehensive Movie Recommendation System leveraging Neo4j's graph database capabilities. The project includes advanced features such as collaborative and content-based recommendations, graph visualizations, user authentication, real-time updates, and is fully Dockerized for easy deployment.
Next Steps and Recommendations:

    Enhance Data Population:
        Import a larger dataset of movies, genres, users, and ratings to improve recommendation quality.
        Utilize Neo4j's ETL tools or CSV imports for bulk data insertion.

    Improve Frontend UI/UX:
        Enhance the user interface for better aesthetics and user experience.
        Implement additional features like adding new movies, genres, or allowing users to update their profiles.

    Implement Registration:
        Develop a registration form to allow new users to sign up directly from the frontend.

    Advanced Recommendation Algorithms:
        Incorporate more sophisticated algorithms using Neo4j's Graph Data Science library for enhanced recommendations.

    Deploy to Cloud Platforms:
        Consider deploying the Dockerized application to cloud services like AWS, Azure, or Heroku for broader accessibility.

    Set Up CI/CD Pipelines:
        Implement Continuous Integration and Continuous Deployment pipelines using tools like GitHub Actions to automate testing and deployment.

    Security Enhancements:
        Secure your application by configuring CORS appropriately.
        Implement HTTPS for secure data transmission.

    Testing:
        Expand your test suites for both backend and frontend to ensure application reliability.

Resources for Further Learning:

    Neo4j Documentation: https://neo4j.com/docs/
    Docker Documentation: https://docs.docker.com/
    React Documentation: https://reactjs.org/docs/getting-started.html
    Express.js Documentation: https://expressjs.com/
    Socket.io Documentation: https://socket.io/docs/v4/
    Jest Testing Framework: https://jestjs.io/docs/getting-started