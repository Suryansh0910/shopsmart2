const express = require('express');
const { getDb } = require('../db/database');
const { verifyAuth } = require('./auth');
const router = express.Router();

router.use(verifyAuth);

// GET /api/cart
router.get('/', (req, res) => {
  const db = getDb();
  const items = db.prepare(`
    SELECT ci.id, ci.quantity, ci.addedAt,
           p.id as productId, p.name, p.price, p.category, p.imageUrl
    FROM cart_items ci
    JOIN products p ON ci.productId = p.id
    WHERE ci.userId = ?
    ORDER BY ci.addedAt DESC
  `).all(req.user.id);
  res.json(items);
});

// POST /api/cart — add item
router.post('/', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required' });

  const db = getDb();
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  // check if item is already in cart for user
  const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE productId = ? AND userId = ?').get(productId, req.user.id);
  
  let newId;
  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
    newId = existing.id;
  } else {
    const result = db.prepare(
      'INSERT INTO cart_items (userId, productId, quantity) VALUES (?, ?, ?)'
    ).run(req.user.id, productId, quantity);
    newId = result.lastInsertRowid;
  }

  const item = db.prepare(`
    SELECT ci.id, ci.quantity, ci.addedAt,
           p.id as productId, p.name, p.price, p.category, p.imageUrl
    FROM cart_items ci JOIN products p ON ci.productId = p.id
    WHERE ci.id = ?
  `).get(newId);
  res.status(201).json(item);
});

// DELETE /api/cart/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND userId = ?').get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found or unauthorized' });
  
  db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);
  res.json({ message: 'Item removed from cart', id: Number(req.params.id) });
});

module.exports = router;
