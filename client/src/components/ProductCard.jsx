import PropTypes from 'prop-types';

function ProductCard({ product, onAddToCart }) {
  return (
    <div className="product-card">
      <div className="product-badge">{product.category}</div>
      <h3 className="product-name">{product.name}</h3>
      <p className="product-price">₹{product.price.toFixed(2)}</p>
      <p className="product-stock">
        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
      </p>
      <button
        className="btn btn-primary"
        onClick={() => onAddToCart(product)}
        disabled={product.stock === 0}
      >
        Add to Cart
      </button>
    </div>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    category: PropTypes.string,
    stock: PropTypes.number,
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
};

export default ProductCard;
