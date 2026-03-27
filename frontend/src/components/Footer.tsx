import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, RotateCcw, ShoppingCart, Headphones } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './footer.css';

const Footer: React.FC = () => {
  const { cart } = useCart();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const location = useLocation();
  const [isAtBottom, setIsAtBottom] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      // Threshold to detect when we're close to the bottom (SiteFooter area)
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // If we're within 300px of the bottom (SiteFooter usually takes >400px)
      if (scrollTop + windowHeight >= documentHeight - 300) {
        setIsAtBottom(true);
      } else {
        setIsAtBottom(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <footer className={`landing-footer ${isAtBottom ? 'is-transparent' : ''}`}>
      <Link to="/" className={`footer-item ${isActive('/') ? 'active' : ''}`}>
        <Home size={24} />
        <span>Home</span>
      </Link>
      <Link to="/orders" className={`footer-item ${isActive('/orders') ? 'active' : ''}`}>
        <RotateCcw size={24} />
        <span>Repeat</span>
      </Link>
      <Link to="/cart" className={`footer-item ${isActive('/cart') ? 'active' : ''}`}>
        <div className="footer-cart-icon">
          <ShoppingCart size={24} />
          {cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
        </div>
        <span>Cart</span>
      </Link>
      <Link to="/support" className={`footer-item ${isActive('/support') ? 'active' : ''}`}>
        <Headphones size={24} />
        <span>Support</span>
      </Link>
    </footer>
  );
};

export default Footer;
