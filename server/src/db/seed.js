const { getDb, closeDb } = require('./database');

const seedProducts = [
  { name: 'Wireless Headphones', price: 2999, category: 'Electronics', stock: 50 },
  { name: 'Smartphone Case', price: 499, category: 'Accessories', stock: 150 },
  { name: 'Gaming Mouse', price: 1299, category: 'Electronics', stock: 75 },
  { name: 'Mechanical Keyboard', price: 4500, category: 'Electronics', stock: 30 },
  { name: 'Desk Mat', price: 899, category: 'Accessories', stock: 100 },
  { name: 'USB-C Cable', price: 299, category: 'Accessories', stock: 200 }
];

function runSeed() {
  const db = getDb();
  
  console.log('Seeding products...');
  
  const insert = db.prepare(
    'INSERT INTO products (name, price, category, stock) VALUES (?, ?, ?, ?)'
  );

  const check = db.prepare('SELECT id FROM products WHERE name = ?');
  
  let added = 0;
  for (const p of seedProducts) {
    const exists = check.get(p.name);
    if (!exists) {
      insert.run(p.name, p.price, p.category, p.stock);
      added++;
    }
  }

  console.log(`✅ Seed complete! Added ${added} new products.`);
  closeDb();
}

runSeed();
