const express = require('express');
const cors = require('cors');
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

// Root
app.get('/', (req, res) => {
  res.send('ShopSmart Backend Service');
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
