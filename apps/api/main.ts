/*
 * Main Entry Point - Content Automation Platform API
 * Minimal bootstrap that runs reliably without the incomplete Nest setup.
*/

const express = require('express');

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-fase2',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/ready', (_req, res) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    version: '1.0.0-fase2',
  });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Content Automation Platform API',
    version: '1.0.0-fase2',
    status: 'foundation',
    endpoints: {
      health: '/health',
      ready: '/ready',
      api: '/api',
    },
  });
});

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`🚀 API Gateway running on http://localhost:${port}`);
  console.log(`📊 Health: http://localhost:${port}/health`);
  console.log(`🏓 Ready: http://localhost:${port}/ready`);
});

module.exports = { app };