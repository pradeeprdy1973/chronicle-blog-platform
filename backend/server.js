const express = require('express');
const cors = require('cors');
const { initDB } = require('./models/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

async function start() {
  await initDB();
  
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/posts', require('./routes/posts'));
  app.use('/api/posts/:slug/comments', require('./routes/comments'));
  app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ error: 'Internal server error' }); });

  app.listen(PORT, () => {
    console.log(`🚀 Blog API running on http://localhost:${PORT}`);
    console.log(`📖 Health check: http://localhost:${PORT}/api/health`);
  });
}

start().catch(console.error);
