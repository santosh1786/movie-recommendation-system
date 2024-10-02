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
