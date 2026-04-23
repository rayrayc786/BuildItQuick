import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Home, 
  MessageCircle, 
  ChevronRight
} from 'lucide-react';
import './support.css';
import SEO from '../../../components/SEO';

const Support: React.FC = () => {
  const navigate = useNavigate();

  const handleWhatsAppClick = () => {
    const phoneNumber = '919216921698';
    const message = encodeURIComponent('Hi I need help ');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="matall-support-page">
      <SEO title="Customer Support" description="Get help with your MatAll orders. Contact our support team via WhatsApp for quick assistance." />
      <header className="support-header-sticky">
        <div className="header-nav-support main-content-responsive">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-box">
            <h2 className="support-nav-title">Customer Support</h2>
            
          </div>
          <Link to="/" className="home-btn-link">
            <Home size={24} />
          </Link>
        </div>
      </header>

      <main className="support-content-prd single-button-layout">
        <div className="whatsapp-support-card" onClick={handleWhatsAppClick}>
           <div className="whatsapp-icon-wrapper">
              <MessageCircle size={40} strokeWidth={2.5} />
           </div>
           <div className="whatsapp-text-content">
              <h3>Contact us on WhatsApp</h3>
              <p>Our support team is available to assist you further.</p>
           </div>
           <ChevronRight size={24} className="whatsapp-chevron" />
        </div>
        
        <div className="support-footer-note">
          <p>Expect a response within a few minutes</p>
        </div>
      </main>
    </div>
  );
};

export default Support;
