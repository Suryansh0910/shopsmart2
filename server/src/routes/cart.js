const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /api/cart
router.get('/', (req, res) => {
  const db = getDb();
  const items = db.prepare(`
    SELECT ci.id, ci.quantity, ci.addedAt,
           p.id as productId, p.name, p.price, p.category
    FROM cart_items ci
    JOIN products p ON ci.productId = p.id
    ORDER BY ci.addedAt DESC
  `).all();
  res.json(items);
});

// POST /api/cart — add item
router.post('/', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required' });

  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const result = db.prepare(
    'INSERT INTO cart_items (productId, quantity) VALUES (?, ?)'
  ).run(productId, quantity);

  const item = db.prepare(`
    SELECT ci.id, ci.quantity, ci.addedAt,
           p.id as productId, p.name, p.price, p.category
    FROM cart_items ci JOIN products p ON ci.productId = p.id
    WHERE ci.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(item);
});

// DELETE /api/cart/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM cart_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found' });
  db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);
  res.json({ message: 'Item removed from cart', id: Number(req.params.id) });
});

module.exports = router;
