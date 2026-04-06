import { useState, useEffect } from 'react';
import ProductCard from './components/ProductCard';
import CartSidebar from './components/CartSidebar';

const API = import.meta.env.VITE_API_URL || '';

function App() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [toast, setToast] = useState('');

  // Load products
  useEffect(() => {
    fetch(`${API}/api/products`)
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => { setError('Failed to load products'); setLoading(false); });
  }, []);

  // Load cart
  useEffect(() => {
    fetch(`${API}/api/cart`)
      .then((r) => r.json())
      .then(setCartItems)
      .catch(() => {});
  }, []);

  const handleAddToCart = (product) => {
    fetch(`${API}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    })
      .then((r) => r.json())
      .then((item) => {
        setCartItems((prev) => [...prev, item]);
        setToast(`Added ${product.name} to cart!`);
        setTimeout(() => setToast(''), 3000);
      })
      .catch(() => {});
  };

  const handleRemoveFromCart = (cartItemId) => {
    fetch(`${API}/api/cart/${cartItemId}`, { method: 'DELETE' })
      .then(() => setCartItems((prev) => prev.filter((i) => i.id !== cartItemId)))
      .catch(() => {});
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-brand">🛒 ShopSmart</div>
        <input
          className="search-input"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-cart" onClick={() => setCartOpen(true)}>
          🛒 Cart <span className="cart-count">{cartItems.length}</span>
        </button>
      </header>

      <main className="main">
        {loading && <p className="status">Loading products...</p>}
        {error && <p className="status error">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="status">No products found.</p>
        )}
        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </main>

      {cartOpen && (
        <CartSidebar
          cartItems={cartItems}
          onRemove={handleRemoveFromCart}
          onClose={() => setCartOpen(false)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
