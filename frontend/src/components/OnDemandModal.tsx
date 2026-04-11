import React, { useState } from 'react';
import { X, Minus, Plus, Calendar, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import './onDemandModal.css';

interface OnDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  variant?: any;
}

const OnDemandModal: React.FC<OnDemandModalProps> = ({ isOpen, onClose, product, variant }) => {
  const [quantity, setQuantity] = useState(1);
  const [requiredBy, setRequiredBy] = useState<'Today' | 'Tomorrow' | 'Later'>('Today');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to place a request');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/on-demand`,
        {
          productId: product._id,
          productName: product.productName || product.name,
          variantId: variant?._id || variant?.sku,
          variantName: variant?.name || 'Standard',
          quantity,
          requiredBy,
          address: JSON.parse(localStorage.getItem('user') || '{}').currentAddress || ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="on-demand-overlay" onClick={onClose}>
      <div className="on-demand-content" onClick={e => e.stopPropagation()}>
        <div className="on-demand-header">
          <div className="header-info">
            <h3>Place Request</h3>
            <p>{product.brand} {product.productName || product.name}</p>
            {variant && variant.name !== 'Standard' && <span className="variant-tag">{variant.name}</span>}
          </div>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        {isSuccess ? (
          <div className="success-state">
            <div className="success-icon-wrapper">
              <CheckCircle2 size={64} color="#10b981" />
            </div>
            <h4>Request Submitted!</h4>
            <p>Our team will contact you shortly with the best quote and availability.</p>
          </div>
        ) : (
          <div className="on-demand-body">
            <div className="request-section">
              <label>Set Quantity</label>
              <div className="quantity-control-large">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={20} /></button>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="qty-input"
                />
                <button onClick={() => setQuantity(quantity + 1)}><Plus size={20} /></button>
              </div>
            </div>

            <div className="request-section">
              <label>Required by when?</label>
              <div className="urgency-options">
                {(['Today', 'Tomorrow', 'Later'] as const).map((opt) => (
                  <button 
                    key={opt}
                    className={`urgency-btn ${requiredBy === opt ? 'active' : ''}`}
                    onClick={() => setRequiredBy(opt)}
                  >
                    <div className="opt-icon">
                      {opt === 'Today' && <Clock size={16} />}
                      {opt === 'Tomorrow' && <Calendar size={16} />}
                      {opt === 'Later' && <Calendar size={16} />}
                    </div>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="info-notice">
              <p>Note: "On Demand" products require manual coordination for the best logistics efficiency. No payment is required right now.</p>
            </div>

            <button 
              className="submit-request-btn" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Submitting...</> : 'Send Request'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default OnDemandModal;
