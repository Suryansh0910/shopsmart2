const express = require('express');
const cors = require('cors');
const path = require('path');
const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ShopSmart Backend is running',
    timestamp: new Date().toISOString(),
  });
});

const authRouter = require('./routes/auth').router;

// Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);

// Root (now replaced by static frontend, but kept for /api prefix if needed)
app.get('/api', (req, res) => {
  res.send('ShopSmart Backend Service');
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Catch-all to serve index.html for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
