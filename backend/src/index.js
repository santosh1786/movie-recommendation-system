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
