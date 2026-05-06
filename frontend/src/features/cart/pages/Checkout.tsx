import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MapPin,
  Clock,
  ArrowLeft,
  ChevronDown,
  Receipt,
  ShoppingBasket,
  Home
} from 'lucide-react';
import { useCart } from '../../../contexts/CartContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useLocationContext } from '../../../contexts/LocationContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import LocationModal from '../../../components/LocationModal';
import './checkout.css';
import SEO from '../../../components/SEO';
// import { getFullImageUrl } from '../../../utils/imageUrl';

interface Address {
  _id?: string;
  name: string;
  addressText: string;
  recipientName?: string;
  recipientPhone?: string;
  type: 'Home' | 'Work' | 'Site' | 'Other';
}

const Checkout: React.FC = () => {
  
  const { 
    cart, grandTotal, vehicleClass, totalBaseAmount, totalTaxAmount, totalSavings,
    platformFee, totalWeight, totalVolume, enrichedItems,
    appliedDiscount, appliedOffers, rewardItems, deliveryCharge,
    deliveryChargeBreakup,
    splitPaymentAmount, partPaymentPercentage, clearCart
  } = useCart();
  const { settings } = useSettings();
  const { location: globalLocation, setLocation: setGlobalLocation } = useLocationContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [initialData, setInitialData] = useState<any>(null);

  const [showPolicy, setShowPolicy] = useState(false);
  const [showSplitPopup, setShowSplitPopup] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // const logisticsInfo = settings.logisticsRates[maxLogisticsCategory as keyof typeof settings.logisticsRates] || settings.logisticsRates.light;

  // const appliedGstRates = Array.from(new Set(cart.map(item => {
  //   let rate = (item.product as any).gst || 18;
  //   if (item.selectedVariant && item.product.variants) {
  //     const variant: any = item.product.variants.find(v => v.name === item.selectedVariant);
  //     if (variant) {
  //       rate = variant.pricing?.gst || (item.product as any).gst || 18;
  //     }
  //   }
  //   return rate;
  // }))).sort((a, b) => b - a);

  useEffect(() => {
    let timer: any;
    if (showSplitPopup && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (showSplitPopup && countdown === 0) {
      setShowSplitPopup(false);
      startPaymentProcess('partial');
    }
    return () => clearInterval(timer);
  }, [showSplitPopup, countdown]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
       toast.error('Please login to proceed to checkout');
       navigate('/login', { state: { from: '/cart' }, replace: true });
       return;
    }

    const freshUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (freshUser.jobsites && freshUser.jobsites.length > 0) {
      setAddresses(freshUser.jobsites);
      
      const matched = freshUser.jobsites.find((s: Address) => 
        globalLocation?.matchingJobsite?._id && String(s._id) === String(globalLocation.matchingJobsite._id)
      );

      if (matched) {
        if (!selectedAddress || String(selectedAddress._id) !== String(matched._id)) {
          setSelectedAddress(matched);
        }
      } else if (!selectedAddress) {
        // If no GPS match and nothing selected yet, default to first saved address
        setSelectedAddress(freshUser.jobsites[0]);
      }
    }
  }, [globalLocation, selectedAddress, navigate]);


  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = (mode: 'full' | 'partial') => {
    if (!settings.isServiceEnabled || (globalLocation && !globalLocation.isServiceable)) {
      toast.error(settings.offlineMessage || "Service is currently unavailable in this location.");
      return;
    }

    if (!selectedAddress) {
      toast.error('Please add or select a delivery address to proceed.');
      setIsLocationModalOpen(true);
      return;
    }

    const hasOnDemand = cart.some(item => item.product.deliveryTime === 'On Demand');
    if (hasOnDemand) {
      toast.error('Some items in your cart are only available on demand. Please remove them to proceed with online buying.');
      return;
    }

    if (mode === 'partial') {
      setCountdown(5);
      setShowSplitPopup(true);
    } else {
      startPaymentProcess('full');
    }
  };

  const startPaymentProcess = async (mode: 'full' | 'partial') => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    const res = await loadRazorpayScript();
    if (!res) {
      toast.error('Razorpay SDK failed to load. Check connection.');
      setLoading(false);
      return;
    }

    const payAmount = mode === 'partial' ? splitPaymentAmount : grandTotal;

    try {
      const { data: orderData } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/orders/razorpay/create-order`, {
        amount: payAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock12345',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MatAll',
        description: mode === 'partial' ? `Advance Payment (${partPaymentPercentage}%)` : 'Full Payment',
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
             await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/orders/razorpay/verify`, {
               razorpay_order_id: response.razorpay_order_id,
               razorpay_payment_id: response.razorpay_payment_id,
               razorpay_signature: response.razorpay_signature
             }, { headers: { Authorization: `Bearer ${token}` } });
             
              toast.success('Payment Verified!');
              const finalPaymentMethod = mode === 'partial' ? `Partial Payment (${partPaymentPercentage}%)` : 'Online Payment';
             
             await finalizeOrder(
               finalPaymentMethod, 
               response.razorpay_payment_id,
               payAmount
             );
          } catch (err) {
             toast.error('Payment verification failed.');
          }
        },
        prefill: {
          name: user.fullName || 'Guest',
          email: user.email || 'customer@example.com',
          contact: user.phoneNumber || ''
        },
        theme: {
          color: '#FFEA00'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
           toast.error(response.error.description);
      });
      paymentObject.open();

    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login', { state: { from: '/cart' }, replace: true });
      } else if (err.response && err.response.status === 403) {
        toast.error(err.response.data.message || "We're offline to make sure you experience is 10/10 tomorrow.See you at 9:00 AM!");
      } else {
        toast.error('Could not create payment session.');
      }
    } finally {
      setLoading(false);
    }
  };

  const finalizeOrder = async (paymentMethod: string, paymentRef: string | null, paidAmount: number) => {
    if (!settings.isServiceEnabled || (globalLocation && !globalLocation.isServiceable)) {
      toast.error(settings.offlineMessage || "Service is currently unavailable in this location.");
      return;
    }

    const hasOnDemand = cart.some(item => item.product.deliveryTime === 'On Demand');
    if (hasOnDemand) {
      toast.error('Some items in your cart are only available on demand. Please remove them to proceed.');
      return;
    }

    if (!selectedAddress) {
      toast.error('Please select a delivery address first');
      setIsLocationModalOpen(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const orderData = {
        items: enrichedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.unitPrice,
          taxRate: item.taxRate,
          selectedVariant: item.selectedVariant,
          totalWeight: item.totalWeight,
          totalVolume: item.totalVolume
        })),
        totalAmount: grandTotal,
        totalTaxAmount: totalTaxAmount,
        totalBaseAmount: totalBaseAmount,
        totalWeight: totalWeight,
        totalVolume: totalVolume,
        paidAmount: paidAmount,
        paymentMethod: paymentMethod,
        paymentReference: paymentRef,
        appliedDiscount,
        appliedOffers,
        rewardItems,
        deliveryAddress: {
          name: selectedAddress.name || 'Site',
          fullAddress: selectedAddress.addressText || 'N/A',
          contactPhone: (selectedAddress as any).contactPhone || '',
          pincode: (selectedAddress as any).pincode || '',
          city: (selectedAddress as any).city || '',
          state: (selectedAddress as any).state || '',
          country: (selectedAddress as any).country || 'India',
          location: (selectedAddress as any).location || { type: 'Point', coordinates: [0, 0] }
        }
      };

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/orders');
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
          toast.error('Session expired. Please login again.');
          navigate('/login', { state: { from: '/cart' }, replace: true });
      } else if (err.response && (err.response.status === 403)) {
          toast.error(err.response.data.message || "We're offline to make sure you experience is 10/10 tomorrow.See you at 9:00 AM!");
      } else {
          toast.error('Failed to place order');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderSplitPopup = () => (
    <div className="split-policy-popup-overlay">
       <div className="split-policy-popup-content">
          <div className="popup-timer-circle">{countdown}</div>
          <h3 className="popup-title">Split Payment Terms</h3>
          <p className="popup-text">
            if the item is not received at delivery for any reason apart from defective/ broken product, the refund will be made after adjusting for delivery charges shown at time of placing order.
          </p>
          <div className="popup-footer-text">Redirecting to payment gateway...</div>
       </div>
    </div>
  );

  const handleAddressSelect = (addressText: string) => {
    // Refresh user data to get the latest addresses
    const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (updatedUser.jobsites) {
      setAddresses(updatedUser.jobsites);
      
      // Find the site that matches this addressText or coordinate
      const match = updatedUser.jobsites.find((s: Address) => s.addressText === addressText);
      if (match) {
        setSelectedAddress(match);
        setGlobalLocation({
          address: match.addressText,
          coords: { lat: match.location.coordinates[1], lng: match.location.coordinates[0] },
          isServiceable: true,
          matchingJobsite: match
        }, true);
      }
    }
  };


  return (
    <div className="matall-checkout-page">
      <SEO title="Secure Checkout" description="Finalize your order on MatAll. Secure payment and fast delivery for all your building material needs." />
      <header className="checkout-header-sticky">
        <div className="header-nav-checkout main-content-responsive">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-box">
            <h2 className="checkout-nav-title">Checkout</h2>
            <span>Secure Order</span>
          </div>
          <Link to="/" className="home-btn-link">
            <Home size={24} />
          </Link>
        </div>
      </header>

      <main className="checkout-content main-content-responsive">
        <div className="checkout-grid-responsive">
          <section className="checkout-section">

          <div className="checkout-left-col">
            <div className="section-title-row">
                <ShoppingBasket size={18} />
                <h3>Checkout Summary</h3>
            </div>
            <div className="delivery-slot-card">
               <div className="slot-header">
                  <Clock size={18} />
                  <span>Delivery in 60 Mins</span>
               </div>
               <p className="slot-sub">Shipment of {cart.length} Item{cart.length > 1 ? 's' : ''}</p>
            </div>

            <div className="checkout-user-pod" onClick={() => setIsLocationModalOpen(true)}>
              <div className="pod-icon-circle"><Receipt size={20} /></div>
              <div className="pod-info-stack">
                <p className="pod-label-top">Order for</p>
                <div className="pod-main-text">
                  <strong>{user.fullName || 'Guest'}</strong>
                  <span>{user.phoneNumber || ''}</span>
                </div>
              </div>
              <button className="pod-change-btn">Change</button>
            </div>
            <div className="checkout-user-pod" onClick={() => setIsLocationModalOpen(true)}>
               <div className="pod-icon-circle pin-yellow"><MapPin size={20} /></div>
               <div className="pod-info-stack">
                  <p className="pod-label-top">Delivering to <strong>{selectedAddress?.name || 'Home'}</strong></p>
                  <p className="pod-subtext-main">{selectedAddress?.addressText || 'Select Delivery Location'}</p>
               </div>
               <button className="pod-change-btn">Change</button>
            </div>

          

            <div className={`policy-expandable ${showPolicy ? 'open' : ''}`}>
              <div className="policy-row" onClick={() => setShowPolicy(!showPolicy)}>
                 <span>Cancellation policy</span>
                 <ChevronDown size={18} className={showPolicy ? 'rotate-180' : ''} />
              </div>
              {showPolicy && (
                <div className="policy-content-details">
                  <p>Orders cannot be cancelled once dispatched. For manufacturing defects, items must be inspected at the time of delivery.</p>
                </div>
              )}
            </div>
          </div>
          </section>

          <div className="checkout-right-col">
            <section className="checkout-section">
              <div className="section-title-row">
                <Receipt size={18} />
                <h3>Bill Summary</h3>
              </div>
              <div className="bill-card">
                <div className="bill-row-checkout">
                  <span>Item Total (Excl. GST)</span>
                  <span className="bill-val">₹{(totalBaseAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="bill-row-checkout bill-row-secondary">
                  <span>GST Amount </span>
                  <span className="bill-val">₹{(totalTaxAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="bill-row-checkout">
                  <div className="bill-label-group">
                    <span>Delivery Charge (incl GST)</span>
                    <span className="delivery-mode-tag">(Mode: {vehicleClass})</span>
                  </div>
                  <span className="bill-val">
                    {deliveryCharge > 0 ? (
                      <div style={{ textAlign: 'right' }}>
                        <span>₹{(deliveryCharge ?? 0).toFixed(2)}</span>
                        {deliveryChargeBreakup && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal' }}>
                            (₹{(deliveryChargeBreakup.base ?? 0).toFixed(2)} + ₹{(deliveryChargeBreakup.gst ?? (deliveryChargeBreakup as any).tax ?? 0).toFixed(2)} GST)
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="free">FREE</span>
                    )}
                  </span>
                </div>
                <div className="bill-row-checkout">
                  <span>Handling Charge (incl GST)</span>
                  <span className="bill-val">₹{(platformFee ?? 0).toFixed(2)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="bill-row-checkout" style={{ color: '#16a34a', fontWeight: 600 }}>
                    <span>Offer Discount</span>
                    <span className="bill-val">-₹{(appliedDiscount ?? 0).toFixed(2)}</span>
                  </div>
                )}
                {rewardItems.length > 0 && (
                  <div className="reward-summary-box-checkout">
                    <p className="reward-head">Free Rewards Unlocked:</p>
                    <ul className="reward-list">
                      {rewardItems.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}

                <div className="bill-row-checkout grand-total-row">
                  <span className="total-label">Grand Total</span>
                  <span className="total-val">₹{(grandTotal ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </section>

            {totalSavings > 0 && (
              <div className="savings-tile">
                <span className="savings-text">Your total savings</span>
                <span className="savings-amount">₹{(totalSavings ?? 0).toFixed(2)}</span>
              </div>
            )}

             <div className="desktop-order-actions mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {!settings.isServiceEnabled && (
                  <div className="offline-warning-card" style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '15px', borderRadius: '12px', marginBottom: '15px', color: '#991b1b', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center' }}>
                    ⚠️ {settings.offlineMessage}
                  </div>
                )}
                
                {settings.isFullPaymentEnabled && (
                  <button className={`final-place-btn-desktop ${!settings.isServiceEnabled ? 'disabled' : ''}`} onClick={() => handlePlaceOrder('full')} disabled={loading || !settings.isServiceEnabled}>
                      {loading ? 'Processing...' : !settings.isServiceEnabled ? 'Service Offline' : `Pay online - Full 100% now • ₹${(grandTotal ?? 0).toFixed(2)}`}
                  </button>
                )}

                {settings.isPartPaymentEnabled && (
                  <button className={`final-place-btn-desktop ${!settings.isServiceEnabled ? 'disabled' : ''}`} onClick={() => handlePlaceOrder('partial')} disabled={loading || !settings.isServiceEnabled} style={{ background: !settings.isServiceEnabled ? '#f1f5f9' : '#DEDEDE', color: '#000' }}>
                      {loading ? 'Processing...' : !settings.isServiceEnabled ? 'Service Offline' : `Split Payment – ${partPaymentPercentage}% now and ${100 - partPaymentPercentage}% on delivery • ₹${(splitPaymentAmount ?? 0).toFixed(2)}`}
                  </button>
                )}

                {settings.isCodEnabled && (
                  <button className={`final-place-btn-desktop ${!settings.isServiceEnabled ? 'disabled' : ''}`} onClick={() => finalizeOrder('COD', null, 0)} disabled={loading || !settings.isServiceEnabled} style={{ background: '#000', color: '#FFEA00' }}>
                      {loading ? 'Processing...' : !settings.isServiceEnabled ? 'Service Offline' : `Cash on Delivery (COD) – Pay ₹${(grandTotal ?? 0).toFixed(2)} at home`}
                  </button>
                )}
             </div>
          </div>
        </div>
      </main>

      <footer className="checkout-footer-sticky-final">
        <div className="footer-action-buttons-mobile">
          {settings.isFullPaymentEnabled && (
            <button className={`checkout-place-btn full-pay ${!settings.isServiceEnabled ? 'disabled' : ''}`} onClick={() => handlePlaceOrder('full')} disabled={loading || !settings.isServiceEnabled}>
              <div className="btn-p-info">
                  <span className="p-val">₹{(grandTotal ?? 0).toFixed(2)}</span>
                  <span className="p-lbl">100% NOW</span>
              </div>
              <div className="btn-p-main">
                  {loading ? 'Processing...' : !settings.isServiceEnabled ? 'Offline' : 'Pay Online'}
              </div>
            </button>
          )}
          
          {settings.isPartPaymentEnabled && (
            <button className={`checkout-place-btn partial-pay ${!settings.isServiceEnabled ? 'disabled' : ''}`} onClick={() => handlePlaceOrder('partial')} disabled={loading || !settings.isServiceEnabled}>
              <div className="btn-p-info">
                  <span className="p-val">₹{(splitPaymentAmount ?? 0).toFixed(2)}</span>
                  <span className="p-lbl">{partPaymentPercentage}% SPLIT</span>
              </div>
              <div className="btn-p-main">
                  {loading ? 'Processing...' : !settings.isServiceEnabled ? 'Offline' : 'Split Payment'}
              </div>
            </button>
          )}

          {settings.isCodEnabled && (
            <button className={`checkout-place-btn cod-pay ${!settings.isServiceEnabled ? 'disabled' : ''}`} onClick={() => finalizeOrder('COD', null, 0)} disabled={loading || !settings.isServiceEnabled} style={{ background: '#000', color: '#fff' }}>
              <div className="btn-p-info">
                  <span className="p-val">₹{(grandTotal ?? 0).toFixed(2)}</span>
                  <span className="p-lbl">ON DELIVERY</span>
              </div>
              <div className="btn-p-main">
                  {loading ? 'Processing...' : !settings.isServiceEnabled ? 'Offline' : 'COD'}
              </div>
            </button>
          )}
        </div>
      </footer>

      <LocationModal 
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          setInitialData(null);
          setEditIndex(null);
        }}
        onSelectAddress={handleAddressSelect}
        currentAddress={selectedAddress?.addressText}
        initialData={initialData}
        editIndex={editIndex}
      />
      {showSplitPopup && renderSplitPopup()}
    </div>
  );
};


export default Checkout;
