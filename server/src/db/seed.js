const { getDb, closeDb } = require('./database');

const seedProducts = [
  { name: 'Wireless Headphones', price: 2999, category: 'Electronics', stock: 50, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' },
  { name: 'Smartphone Case', price: 499, category: 'Accessories', stock: 150, imageUrl: 'https://images.unsplash.com/photo-1606041011872-596590ba91d5?w=500&q=80' },
  { name: 'Gaming Mouse', price: 1299, category: 'Electronics', stock: 75, imageUrl: 'https://images.unsplash.com/photo-1527814050087-379381547969?w=500&q=80' },
  { name: 'Mechanical Keyboard', price: 4500, category: 'Electronics', stock: 30, imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80' },
  { name: 'Desk Mat', price: 899, category: 'Accessories', stock: 100, imageUrl: 'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=500&q=80' },
  { name: 'HD Monitor', price: 12999, category: 'Electronics', stock: 20, imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80' }
];

function runSeed() {
  const db = getDb();
  
  console.log('Seeding products...');
  
  const insert = db.prepare(
    'INSERT INTO products (name, price, category, stock, imageUrl) VALUES (?, ?, ?, ?, ?)'
  );

  const check = db.prepare('SELECT id FROM products WHERE name = ?');
  
  let added = 0;
  for (const p of seedProducts) {
    const exists = check.get(p.name);
    if (!exists) {
      insert.run(p.name, p.price, p.category, p.stock, p.imageUrl);
      added++;
    }
  }

  console.log(`✅ Seed complete! Added ${added} new products.`);
  closeDb();
}

runSeed();
