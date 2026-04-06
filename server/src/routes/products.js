const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /api/products — list all products (with optional ?category= filter)
router.get('/', (req, res) => {
  const { category } = req.query;
  const db = getDb();
  const products = category
    ? db.prepare('SELECT * FROM products WHERE category = ? ORDER BY id DESC').all(category)
    : db.prepare('SELECT * FROM products ORDER BY id DESC').all();
  res.json(products);
});

// GET /api/products/:id — get single product
router.get('/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /api/products — create product
router.post('/', (req, res) => {
  const { name, price, category = 'general', stock = 0 } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'name and price are required' });
  }
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO products (name, price, category, stock) VALUES (?, ?, ?, ?)'
  ).run(name, price, category, stock);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

// PUT /api/products/:id — update product
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  const { name, price, category, stock } = req.body;
  db.prepare(`
    UPDATE products
    SET name = ?, price = ?, category = ?, stock = ?, updatedAt = datetime('now')
    WHERE id = ?
  `).run(
    name      ?? existing.name,
    price     ?? existing.price,
    category  ?? existing.category,
    stock     ?? existing.stock,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/products/:id — delete product
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deleted', id: Number(req.params.id) });
});

module.exports = router;
