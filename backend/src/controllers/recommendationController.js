// In backend/src/controllers/recommendationController.js

app.get('/api/advanced-recommendations/:userId', async (req, res) => {
    const { userId } = req.params;
  
    const query = `
      MATCH (u:User {id: $userId})-[:RATED]->(m:Movie)
      WITH u, collect(m) as ratedMovies
      MATCH (m)<-[:RATED]-(other:User)-[:RATED]->(rec:Movie)
      WHERE NOT (u)-[:RATED]->(rec)
      AND rec IN ratedMovies
      RETURN rec.title AS title, COUNT(*) AS score
      ORDER BY score DESC
      LIMIT 10
    `;
  
    try {
      const result = await session.run(query, { userId });
      const recommendations = result.records.map(record => ({
        title: record.get('title'),
        score: record.get('score').toInt(),
      }));
      res.json(recommendations);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching advanced recommendations');
    }
  });
  