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
