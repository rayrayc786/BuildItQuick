import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, MessageCircle } from 'lucide-react';
import './site-footer.css';

const SiteFooter: React.FC = () => {
  const usefulLinks = [
    ['Blog', 'Privacy', 'Terms', 'FAQs', 'Security', 'Contact'],
    ['Partner', 'Franchise', 'Seller', 'Warehouse', 'Deliver', 'Resources'],
    ['About Us', 'Support', 'Careers', 'Press', 'Mobile Apps']
  ];

  const categories = [
    'Plywood & Boards', 'Hardware & Fittings', 'Laminates & Veneers',
    'Electricals & Lighting', 'Power Tools', 'Hand Tools',
    'Paints & POP', 'Tiles & Flooring', 'Sanitaryware',
    'Pipes & Fittings', 'Safety Gear', 'Kitchen Hardware',
    'Adhesives & Sealants', 'Screws & Nails', 'Modular Fittings',
    'Garden & Outdoor', 'Home Automation', 'Solar Products',
    'Glass & Glazing', 'Wall Cladding', 'Door & Window',
    'Bath Fittings', 'Locks & Security', 'Wires & Cables'
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        {/* Useful Links Section */}
        <div className="footer-useful-links">
          <h3 className="footer-section-title">Useful Links</h3>
          <div className="useful-links-grid">
            {usefulLinks.map((column, idx) => (
              <ul key={idx} className="footer-links-list">
                {column.map(link => (
                  <li key={link}><a href="#">{link}</a></li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="footer-categories">
          <h3 className="footer-section-title">Categories <span>see all</span></h3>
          <div className="categories-grid">
            <ul className="footer-links-list">
              {categories.slice(0, 8).map(cat => <li key={cat}><a href="#">{cat}</a></li>)}
            </ul>
            <ul className="footer-links-list">
              {categories.slice(8, 16).map(cat => <li key={cat}><a href="#">{cat}</a></li>)}
            </ul>
            <ul className="footer-links-list">
              {categories.slice(16, 24).map(cat => <li key={cat}><a href="#">{cat}</a></li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom-bar">
        <div className="footer-copyright">
          © Blink Commerce Private Limited, 2016-2026
        </div>

        <div className="footer-download-apps">
          <span className="footer-download-label">Download App</span>
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="app-badge" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" className="app-badge" />
        </div>

        <div className="footer-social-icons">
          <a href="#" className="social-icon-circle"><Facebook size={18} /></a>
          <a href="#" className="social-icon-circle"><Twitter size={18} /></a>
          <a href="#" className="social-icon-circle"><Instagram size={18} /></a>
          <a href="#" className="social-icon-circle"><Linkedin size={18} /></a>
          <a href="#" className="social-icon-circle"><MessageCircle size={18} /></a>
        </div>
      </div>

      <div className="footer-legal-disclaimer">
        "Blinkit" is owned & managed by "Blink Commerce Private Limited" and is not related, linked or interconnected in whatsoever manner or nature, to "GROFFR.COM" which is a real estate services business operated by "Redstone Consultancy Services Private Limited".
      </div>
    </footer>
  );
};

export default SiteFooter;
