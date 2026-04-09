import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './site-footer.css';

const SiteFooter: React.FC = () => {
  const [categories, setCategories] = React.useState<any[]>([]);
  const [subCategories, setSubCategories] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, subsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories`)
        ]);
        setCategories(catsRes.data.filter((c: any) => c.isActive));
        setSubCategories(subsRes.data.filter((s: any) => s.isActive));
      } catch (err) {
        console.error('Failed to fetch footer data', err);
      }
    };
    fetchData();
  }, []);

  const usefulLinks = [
    { label: 'Shop', path: '/products' },
    { label: 'Support', path: '/support' },
    { label: 'Wishlist', path: '/wishlist' },
    { label: 'Orders', path: '/orders' },
    { label: 'Profile', path: '/profile' },
    // Pages to be enabled later
    { label: 'About', path: '/about', hidden: true },
    { label: 'Team', path: '/team', hidden: true },
    { label: 'Careers', path: '/careers', hidden: true },
    { label: 'Privacy Policy', path: '/privacy-policy', hidden: true },
    { label: 'Terms of Service', path: '/terms-of-service', hidden: true },
    { label: 'Refund Policy', path: '/refund-policy', hidden: true }
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        {/* Column 1: Useful Links */}
        <div className="footer-links-column">
          <h3 className="footer-sub-title">Useful Links</h3>
          <ul className="footer-links-list">
            {usefulLinks.filter(link => !link.hidden).map((link, idx) => (
              <li key={idx}>
                <Link to={link.path}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Dynamic Category Columns */}
        {categories.slice(0, 4).map(cat => {
          const catSubs = subCategories.filter(s => s.categoryId?._id === cat._id || s.categoryId === cat._id).slice(0, 5);
          return (
            <div key={cat._id} className="footer-links-column">
              <h3 className="footer-sub-title">{cat.name}</h3>
              <ul className="footer-links-list">
                {catSubs.map(sub => (
                  <li key={sub._id}>
                    <Link to={`/products?category=${encodeURIComponent(cat.name)}&subCategory=${encodeURIComponent(sub.name)}`}>
                      {sub.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to={`/products?category=${encodeURIComponent(cat.name)}`} className="see-more-link">See all {cat.name}</Link>
                </li>
              </ul>
            </div>
          );
        })}
      </div>

      
      <div className="footer-copyright-bar">
        <div className="footer-copyright-content">
          © 2026 MatAll | Adventitous Solutions Private Limited
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
