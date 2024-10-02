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
