import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Home, 
  ShoppingCart,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useCart } from '../contexts/CartContext';
import './product-list.css';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('default'); // 'price-low', 'price-high'
  const [showFilters, setShowFilters] = useState(false);
  
  const [similarProducts] = useState<any[]>([
    { name: 'Hinges', link: '/products?category=22&subCategory=Hinges' },
    { name: 'Channels', link: '/products?category=22&subCategory=Channels' },
    { name: 'Adhesives', link: '/products?category=22&subCategory=Adhesives' },
    { name: 'Tools', link: '/products?category=tools' }
  ]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const subCategoryName = params.get('subCategory');
  const initialBrand = params.get('brand');
  const { cart, totalAmount } = useCart();

  const cartTotal = totalAmount;
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    if (initialBrand) {
      setSelectedBrand(initialBrand);
    }
  }, [initialBrand]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch all products for the category to get all brands
        const searchUrl = `${import.meta.env.VITE_API_BASE_URL}/api/products${location.search}`;
        const { data } = await axios.get(searchUrl);
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [location.search]);

  const brands = useMemo(() => {
    const uniqueBrands = Array.from(new Set(products.map(p => p.brand))).filter(Boolean);
    return uniqueBrands;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedBrand) {
      result = result.filter(p => p.brand === selectedBrand);
    }
    
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }
    
    return result;
  }, [products, selectedBrand, sortBy]);

  return (
    <div className="blinkit-list-page">
      <header className="list-header-sticky">
        <div className="header-nav main-content-responsive">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-box">
            <h2 className="buy-online-text">Buy {subCategoryName || 'Products'} online</h2>
          </div>
          <Link to="/" className="home-btn-link">
            <Home size={24} />
          </Link>
        </div>

        <div className="quick-links-carousel">
          <div className="main-content-responsive ql-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: 0 }}>
            <span className="ql-label">Similar Products</span>
            <div className="ql-track">
              {similarProducts.map((item, idx) => (
                <Link key={idx} to={item.link} className="ql-item">{item.name}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="horizontal-filters-bar main-content-responsive">
          <div className="filter-group">
            <button 
              className={`filter-chip-pill ${sortBy !== 'default' ? 'active' : ''}`}
              onClick={() => setSortBy(sortBy === 'price-low' ? 'price-high' : 'price-low')}
            >
              <ArrowUpDown size={14} /> 
              Sort: {sortBy === 'price-low' ? 'Low to High' : sortBy === 'price-high' ? 'High to Low' : 'Price'}
            </button>
            <button className="filter-chip-pill" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>
      </header>

      <main className="list-layout-main main-content-responsive">
        {/* Column A: Brands Vertical Scroll */}
        <aside className="brand-sidebar-vertical">
          <div 
            className={`brand-sidebar-item ${selectedBrand === null ? 'active' : ''}`}
            onClick={() => setSelectedBrand(null)}
          >
            <div className="brand-sidebar-img">
              <div className="all-brands-icon">All</div>
            </div>
            <span>All Brands</span>
          </div>
          {brands.map((brand: any, idx) => (
            <div 
              key={idx} 
              className={`brand-sidebar-item ${selectedBrand === brand ? 'active' : ''}`}
              onClick={() => setSelectedBrand(brand)}
            >
              <div className="brand-sidebar-img">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(brand)}&background=f1f5f9&color=000&bold=true`} alt={brand} />
              </div>
              <span>{brand}</span>
            </div>
          ))}
        </aside>

        {/* Product Grid Area */}
        <section className="list-results-area">
          {loading ? (
            <div className="loading-box">Finding best deals...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="list-grid-3xN">
              {filteredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="no-products">No products found for this selection.</div>
          )}
        </section>
      </main>

      {cartCount > 0 && (
        <div className="view-cart-bar-sticky" onClick={() => navigate('/cart')}>
          <div className="cart-bar-info">
            <span className="item-count">{cartCount} Item{cartCount > 1 ? 's' : ''}</span>
            <span className="cart-total">₹{cartTotal}</span>
          </div>
          <div className="view-cart-btn">
            View Cart <ShoppingCart size={18} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
