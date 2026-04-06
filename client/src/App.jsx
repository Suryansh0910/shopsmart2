import { useState, useEffect } from 'react';
import ProductCard from './components/ProductCard';
import CartSidebar from './components/CartSidebar';
import AuthModal from './components/AuthModal';

const API = import.meta.env.VITE_API_URL || '';

function App() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('shopsmart_token') || null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  // Auto-login with token
  useEffect(() => {
    if (token) {
      fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.user) setUser(data.user);
          else handleLogout();
        })
        .catch(() => handleLogout());
    }
  }, [token]);

  // Load products
  useEffect(() => {
    fetch(`${API}/api/products`)
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => { setError('Failed to load products'); setLoading(false); });
  }, []);

  // Load cart if logged in
  useEffect(() => {
    if (!token) {
      setCartItems([]);
      return;
    }
    fetch(`${API}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then(setCartItems)
      .catch(() => {});
  }, [token]);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('shopsmart_token', userToken);
    setAuthOpen(false);
    setToast(`Welcome back, ${userData.name}!`);
    setTimeout(() => setToast(''), 3000);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('shopsmart_token');
    setCartItems([]);
  };

  const handleAddToCart = (product) => {
    if (!token) {
      setAuthOpen(true);
      return;
    }

    fetch(`${API}/api/cart`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    })
      .then((r) => r.json())
      .then((item) => {
        setCartItems((prev) => {
          const exists = prev.find(i => i.productId === item.productId);
          if (exists) {
            return prev.map(i => i.productId === item.productId ? item : i);
          }
          return [...prev, item];
        });
        setToast(`Added ${product.name} to cart!`);
        setTimeout(() => setToast(''), 3000);
      })
      .catch(() => {});
  };

  const handleRemoveFromCart = (cartItemId) => {
    fetch(`${API}/api/cart/${cartItemId}`, { 
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
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
        <div style={{ display: 'flex', gap: '12px' }}>
          {user ? (
            <button className="btn" onClick={handleLogout} style={{ background: 'transparent', color: 'var(--text-muted)'}}>
              Logout
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setAuthOpen(true)}>
              Login
            </button>
          )}
          <button className="btn btn-cart" onClick={() => {
            if (!user) setAuthOpen(true);
            else setCartOpen(true);
          }}>
            🛒 Cart <span className="cart-count">{cartItems.length}</span>
          </button>
        </div>
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

      {authOpen && (
        <AuthModal 
          onClose={() => setAuthOpen(false)} 
          onLogin={handleLogin}
          api={API}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
