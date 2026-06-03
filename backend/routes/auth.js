const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, bio } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Username, email, and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const existing = db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing) return res.status(409).json({ error: 'Username or email already taken' });
    const hashed = bcrypt.hashSync(password, 10);
    db.run('INSERT INTO users (username, email, password, bio) VALUES (?, ?, ?, ?)', [username, email, hashed, bio || '']);
    const user = db.get('SELECT id, username, email, bio, avatar, created_at FROM users WHERE email = ?', [email]);
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    const { password: _, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: safeUser, token });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', authenticate, (req, res) => {
  const user = db.get('SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.put('/me', authenticate, (req, res) => {
  const { bio, avatar } = req.body;
  db.run('UPDATE users SET bio = ?, avatar = ? WHERE id = ?', [bio || '', avatar || null, req.user.id]);
  const user = db.get('SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
  res.json(user);
});

module.exports = router;
