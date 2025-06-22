require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');


const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Message schema
const Message = mongoose.model('Message', new mongoose.Schema({
  content: String,
  createdAt: { type: Date, default: Date.now }
}));

// Send message
app.post('/api/message', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] POST /api/message`, { body: req.body });
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    const msg = new Message({ content });
    await msg.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Login
app.post('/api/login', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] POST /api/login`, { body: req.body });
  try {
    const { password } = req.body;
    const match = password === process.env.ADMIN_PASSWORD;
    if (!match) return res.status(403).json({ error: 'Unauthorized' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Get messages (after login)
app.get('/api/messages', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] GET /api/messages`, { headers: req.headers });
  try {
    const { password } = req.headers;
    const match = password === process.env.ADMIN_PASSWORD;
    if (!match) return res.status(403).json({ error: 'Unauthorized' });
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// Debug handler
app.get('/api/debug', (req, res, next) => {
  console.log(`[${new Date().toISOString()}] GET /api/debug`, { headers: req.headers });
  try {
    res.json({
      uptime: process.uptime(),
      node_env: process.env.NODE_ENV || 'development',
      mongo_connected: mongoose.connection.readyState === 1,
      now: new Date().toISOString(),
      headers: req.headers
    });
  } catch (err) {
    next(err);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port', PORT));
