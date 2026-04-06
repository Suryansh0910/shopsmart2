const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Use a temp in-memory-style DB for tests
const TEST_DB = path.join(__dirname, '../data/test.db');
process.env.DB_PATH = TEST_DB;

// Ensure data dir exists
fs.mkdirSync(path.dirname(TEST_DB), { recursive: true });

const app = require('../src/app');
const { getDb, closeDb } = require('../src/db/database');

beforeEach(() => {
  const db = getDb();
  db.exec('DELETE FROM cart_items; DELETE FROM products;');
});

afterAll(() => {
  closeDb();
  try { fs.unlinkSync(TEST_DB); } catch (_) { /* ignore cleanup errors */ }
});

// Health
describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});

// Products
describe('Products API', () => {
  it('GET /api/products returns empty array initially', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/products creates a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Apple', price: 1.5, category: 'fruit', stock: 100 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ name: 'Apple', price: 1.5, stock: 100 });
    expect(res.body.id).toBeDefined();
  });

  it('POST /api/products returns 400 if name is missing', async () => {
    const res = await request(app).post('/api/products').send({ price: 5 });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/products/:id returns the product', async () => {
    const create = await request(app).post('/api/products').send({ name: 'Banana', price: 0.5 });
    const res = await request(app).get(`/api/products/${create.body.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Banana');
  });

  it('GET /api/products/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/products/9999');
    expect(res.statusCode).toBe(404);
  });

  it('PUT /api/products/:id updates a product', async () => {
    const create = await request(app).post('/api/products').send({ name: 'Mango', price: 2 });
    const res = await request(app).put(`/api/products/${create.body.id}`).send({ price: 3 });
    expect(res.statusCode).toBe(200);
    expect(res.body.price).toBe(3);
    expect(res.body.name).toBe('Mango');
  });

  it('DELETE /api/products/:id removes the product', async () => {
    const create = await request(app).post('/api/products').send({ name: 'Grapes', price: 1 });
    const del = await request(app).delete(`/api/products/${create.body.id}`);
    expect(del.statusCode).toBe(200);
    const get = await request(app).get(`/api/products/${create.body.id}`);
    expect(get.statusCode).toBe(404);
  });
});

// Integration: Cart + Products
describe('Cart API (integration with Products)', () => {
  let productId;

  beforeEach(async () => {
    const res = await request(app).post('/api/products').send({ name: 'Test Item', price: 9.99, stock: 10 });
    productId = res.body.id;
  });

  it('GET /api/cart returns empty initially', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/cart adds a product to cart', async () => {
    const res = await request(app).post('/api/cart').send({ productId, quantity: 2 });
    expect(res.statusCode).toBe(201);
    expect(res.body.quantity).toBe(2);
    expect(res.body.name).toBe('Test Item');
  });

  it('POST /api/cart returns 404 for non-existent product', async () => {
    const res = await request(app).post('/api/cart').send({ productId: 9999 });
    expect(res.statusCode).toBe(404);
  });

  it('DELETE /api/cart/:id removes item from cart', async () => {
    const add = await request(app).post('/api/cart').send({ productId });
    const del = await request(app).delete(`/api/cart/${add.body.id}`);
    expect(del.statusCode).toBe(200);
    const cart = await request(app).get('/api/cart');
    expect(cart.body).toEqual([]);
  });
});
