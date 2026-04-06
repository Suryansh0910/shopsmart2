import PropTypes from 'prop-types';

function CartSidebar({ cartItems, onRemove, onClose }) {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="cart-overlay">
      <div className="cart-sidebar">
        <div className="cart-header">
          <h2>Cart ({cartItems.length})</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {cartItems.length === 0 ? (
          <p className="cart-empty">Your cart is empty</p>
        ) : (
          <>
            <ul className="cart-list">
              {cartItems.map((item) => (
                <li key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-qty">× {item.quantity}</span>
                  </div>
                  <div className="cart-item-right">
                    <span className="cart-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                    <button className="btn-remove" onClick={() => onRemove(item.id)}>✕</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="cart-total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <button className="btn btn-primary btn-checkout">Checkout</button>
          </>
        )}
      </div>
    </div>
  );
}

CartSidebar.propTypes = {
  cartItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      price: PropTypes.number,
      quantity: PropTypes.number,
    })
  ).isRequired,
  onRemove: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CartSidebar;
