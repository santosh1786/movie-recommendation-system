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
