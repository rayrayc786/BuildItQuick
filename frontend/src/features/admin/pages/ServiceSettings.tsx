import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Power, Save, AlertTriangle, Clock, CheckCircle, XCircle, Calendar, Truck, CreditCard, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../../../contexts/SettingsContext';

interface LogisticsRate {
  rate: number;
  mode: string;
}

interface Settings {
  isServiceEnabled: boolean;
  offlineMessage: string;
  useOperatingHours: boolean;
  serviceStartTime: string;
  serviceEndTime: string;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  platformFee: number;
  isCodEnabled: boolean;
  isPartPaymentEnabled: boolean;
  isFullPaymentEnabled: boolean;
  partPaymentPercentage: number;
  logisticsRates: {
    light: LogisticsRate;
    medium: LogisticsRate;
    heavy: LogisticsRate;
  };
  deliveryWaiverRules: {
    firstOrder: {
      enabled: boolean;
      minOrderValue: number;
      maxWeightCategory: string;
    };
    lightOnly: {
      enabled: boolean;
      minOrderValue: number;
    };
    mediumLight: {
      enabled: boolean;
      minOrderValue: number;
    };
    smallOrderCap: {
      enabled: boolean;
      maxValue: number;
      cappedCharge: number;
    };
  };
}

const ServiceSettings: React.FC = () => {
  const { refreshSettings, isCurrentlyEnabled } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    isServiceEnabled: true,
    offlineMessage: "",
    useOperatingHours: false,
    serviceStartTime: "09:00",
    serviceEndTime: "21:00",
    deliveryCharge: 150,
    freeDeliveryThreshold: 5000,
    platformFee: 15,
    isCodEnabled: true,
    isPartPaymentEnabled: true,
    isFullPaymentEnabled: true,
    partPaymentPercentage: 50,
    logisticsRates: {
      light: { rate: 50, mode: "Bike" },
      medium: { rate: 150, mode: "Three Wheeler" },
      heavy: { rate: 500, mode: "Truck" }
    },
    deliveryWaiverRules: {
      firstOrder: { enabled: false, minOrderValue: 500, maxWeightCategory: 'light' },
      lightOnly: { enabled: false, minOrderValue: 1000 },
      mediumLight: { enabled: false, minOrderValue: 5000 },
      smallOrderCap: { enabled: false, maxValue: 150, cappedCharge: 29 }
    }
  });

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/admin/settings`);
        setSettings({
          isServiceEnabled: data.isServiceEnabled,
          offlineMessage: data.offlineMessage ?? "",
          useOperatingHours: data.useOperatingHours ?? false,
          serviceStartTime: data.serviceStartTime ?? "09:00",
          serviceEndTime: data.serviceEndTime ?? "21:00",
          deliveryCharge: data.deliveryCharge ?? 150,
          freeDeliveryThreshold: data.freeDeliveryThreshold ?? 5000,
          platformFee: data.platformFee ?? 15,
          isCodEnabled: data.isCodEnabled ?? true,
          isPartPaymentEnabled: data.isPartPaymentEnabled ?? true,
          isFullPaymentEnabled: data.isFullPaymentEnabled ?? true,
          partPaymentPercentage: data.partPaymentPercentage ?? 50,
          logisticsRates: data.logisticsRates ?? {
            light: { rate: 50, mode: "Bike" },
            medium: { rate: 150, mode: "Three Wheeler" },
            heavy: { rate: 500, mode: "Truck" }
          },
          deliveryWaiverRules: data.deliveryWaiverRules ?? {
            firstOrder: { enabled: false, minOrderValue: 500, maxWeightCategory: 'light' },
            lightOnly: { enabled: false, minOrderValue: 1000 },
            mediumLight: { enabled: false, minOrderValue: 5000 },
            smallOrderCap: { enabled: false, maxValue: 150, cappedCharge: 29 }
          }
        });
      } catch (err) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [API_BASE]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/admin/settings`, settings);
      await refreshSettings(true);
      toast.success('Settings updated successfully');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const currentMode = !settings.isServiceEnabled 
    ? 'closed' 
    : (settings.useOperatingHours ? 'automated' : 'open');

  const setMode = (mode: 'open' | 'closed' | 'automated') => {
    if (mode === 'closed') {
      setSettings({ ...settings, isServiceEnabled: false, useOperatingHours: false });
    } else if (mode === 'open') {
      setSettings({ ...settings, isServiceEnabled: true, useOperatingHours: false });
    } else {
      setSettings({ ...settings, isServiceEnabled: true, useOperatingHours: true });
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="service-settings-outer" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Status Header */}
      <div style={{ 
        background: isCurrentlyEnabled ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        padding: '2rem',
        borderRadius: '1.5rem',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '2px', opacity: 0.9, marginBottom: '0.5rem' }}>
            Current System Status
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isCurrentlyEnabled ? <CheckCircle size={32} /> : <XCircle size={32} />}
            <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>
              {isCurrentlyEnabled ? 'LIVE & ACCEPTING ORDERS' : 'OFFLINE / STORE CLOSED'}
            </h2>
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '1rem', fontStyle: 'italic', opacity: 0.9 }}>
            {currentMode === 'automated' 
              ? `Following schedule (${settings.serviceStartTime} - ${settings.serviceEndTime})` 
              : `Manual override: Force ${currentMode === 'open' ? 'Open' : 'Closed'}`}
          </p>
        </div>
        <Power size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1, transform: 'rotate(-15deg)' }} />
      </div>

      <div className="card" style={{ padding: '2rem', borderRadius: '1.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={24} color="#000" /> Select Availability Mode
        </h3>

        {/* Mode Selector Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          {/* Always Open */}
          <div 
            onClick={() => setMode('open')}
            style={{ 
              cursor: 'pointer',
              padding: '1.5rem 1rem',
              borderRadius: '1rem',
              border: `2px solid ${currentMode === 'open' ? '#000' : '#f1f5f9'}`,
              background: currentMode === 'open' ? '#fff' : '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              boxShadow: currentMode === 'open' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
              transform: currentMode === 'open' ? 'translateY(-4px)' : 'none'
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: currentMode === 'open' ? '#22c55e' : '#e2e8f0',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <CheckCircle size={24} />
            </div>
            <h4 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Force Open</h4>
            <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Always active regardless of time</p>
          </div>

          {/* Automated */}
          <div 
            onClick={() => setMode('automated')}
            style={{ 
              cursor: 'pointer',
              padding: '1.5rem 1rem',
              borderRadius: '1rem',
              border: `2px solid ${currentMode === 'automated' ? '#3b82f6' : '#f1f5f9'}`,
              background: currentMode === 'automated' ? '#fff' : '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              boxShadow: currentMode === 'automated' ? '0 10px 15px -3px rgba(59, 130, 246, 0.1)' : 'none',
              transform: currentMode === 'automated' ? 'translateY(-4px)' : 'none'
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: currentMode === 'automated' ? '#3b82f6' : '#e2e8f0',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Calendar size={24} />
            </div>
            <h4 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Scheduled</h4>
            <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Follows set operating hours</p>
          </div>

          {/* Always Closed */}
          <div 
            onClick={() => setMode('closed')}
            style={{ 
              cursor: 'pointer',
              padding: '1.5rem 1rem',
              borderRadius: '1rem',
              border: `2px solid ${currentMode === 'closed' ? '#ef4444' : '#f1f5f9'}`,
              background: currentMode === 'closed' ? '#fff' : '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              boxShadow: currentMode === 'closed' ? '0 10px 15px -3px rgba(239, 68, 68, 0.1)' : 'none',
              transform: currentMode === 'closed' ? 'translateY(-4px)' : 'none'
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: currentMode === 'closed' ? '#ef4444' : '#e2e8f0',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <XCircle size={24} />
            </div>
            <h4 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Force Closed</h4>
            <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Immediately stop all orders</p>
          </div>
        </div>

        {/* Schedule Controls */}
        {currentMode === 'automated' && (
          <div style={{ 
            background: '#eff6ff', 
            padding: '2rem', 
            borderRadius: '1rem',
            marginBottom: '2rem',
            border: '1px solid #bfdbfe',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="input-group-admin">
                <label style={{ color: '#1e40af' }}>Opening Time (Daily)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="time" 
                    value={settings.serviceStartTime} 
                    onChange={(e) => setSettings({ ...settings, serviceStartTime: e.target.value })}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Clock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1e40af' }} />
                </div>
              </div>
              <div className="input-group-admin">
                <label style={{ color: '#1e40af' }}>Closing Time (Daily)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="time" 
                    value={settings.serviceEndTime} 
                    onChange={(e) => setSettings({ ...settings, serviceEndTime: e.target.value })}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Clock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1e40af' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', margin: '2rem 0' }} />

        {/* Delivery & Platform Charges Section */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Truck size={24} color="#000" /> Order & Delivery Charges
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
           <div className="input-group-admin">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard size={14} /> Platform Fee (Handling)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b' }}>₹</span>
                <input 
                  type="number" 
                  value={settings.platformFee} 
                  onChange={(e) => setSettings({ ...settings, platformFee: Number(e.target.value) })}
                  style={{ paddingLeft: '2rem' }}
                />
              </div>
              <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>Charged on every order</p>
           </div>

           <div className="input-group-admin">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Truck size={14} /> Standard Delivery Charge
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b' }}>₹</span>
                <input 
                  type="number" 
                  value={settings.deliveryCharge} 
                  onChange={(e) => setSettings({ ...settings, deliveryCharge: Number(e.target.value) })}
                  style={{ paddingLeft: '2rem' }}
                />
              </div>
              <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>Base charge if below threshold</p>
           </div>
        </div>

        <div className="input-group-admin" style={{ marginBottom: '2rem' }}>
           <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
             <ShoppingBag size={14} /> Free Delivery Threshold
           </label>
           <div style={{ position: 'relative' }}>
             <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b' }}>₹</span>
             <input 
               type="number" 
               value={settings.freeDeliveryThreshold} 
               onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })}
               style={{ paddingLeft: '2rem' }}
             />
           </div>
           <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>Orders above this amount get free delivery (Set large value to disable free delivery)</p>
        </div>

        <div className="input-group-admin">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#f59e0b" /> Custom Offline Message
          </label>
          <textarea 
            rows={3}
            placeholder="E.g. We are closed for maintenance. Back at 9 AM!"
            value={settings.offlineMessage}
            onChange={(e) => setSettings({ ...settings, offlineMessage: e.target.value })}
            style={{ width: '100%', minHeight: '100px' }}
          />
        </div>

        <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', margin: '2rem 0' }} />

        {/* Payment Methods Section */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={24} color="#000" /> Payment Visibility (Checkout)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
          <label style={{ 
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', 
            background: '#f8fafc', borderRadius: '0.75rem', cursor: 'pointer', border: '1px solid #e2e8f0' 
          }}>
            <input 
              type="checkbox" 
              checked={settings.isCodEnabled}
              onChange={(e) => setSettings({ ...settings, isCodEnabled: e.target.checked })}
              style={{ width: '20px', height: '20px' }}
            />
            <div>
              <span style={{ fontWeight: 800, display: 'block' }}>Enable Cash on Delivery (COD)</span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Allow users to pay upon arrival</span>
            </div>
          </label>

          <label style={{ 
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', 
            background: '#f8fafc', borderRadius: '0.75rem', cursor: 'pointer', border: '1px solid #e2e8f0' 
          }}>
            <input 
              type="checkbox" 
              checked={settings.isFullPaymentEnabled}
              onChange={(e) => setSettings({ ...settings, isFullPaymentEnabled: e.target.checked })}
              style={{ width: '20px', height: '20px' }}
            />
            <div>
              <span style={{ fontWeight: 800, display: 'block' }}>Enable Full Payment</span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Allow 100% upfront online payment</span>
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <label style={{ 
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', 
            background: settings.isPartPaymentEnabled ? '#eff6ff' : '#f8fafc', 
            borderRadius: '1rem', cursor: 'pointer', border: settings.isPartPaymentEnabled ? '1px solid #3b82f6' : '1px solid #e2e8f0' 
          }}>
            <input 
              type="checkbox" 
              checked={settings.isPartPaymentEnabled}
              onChange={(e) => setSettings({ ...settings, isPartPaymentEnabled: e.target.checked })}
              style={{ width: '24px', height: '24px' }}
            />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 800, display: 'block', fontSize: '1rem' }}>Enable Split/Part Payment</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Allow users to pay a percentage now and rest on delivery</span>
            </div>
            
            {settings.isPartPaymentEnabled && (
              <div style={{ minWidth: '140px' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    value={settings.partPaymentPercentage} 
                    min="1"
                    max="99"
                    onChange={(e) => setSettings({ ...settings, partPaymentPercentage: Number(e.target.value) })}
                    style={{ 
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 1rem', 
                      textAlign: 'center', 
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      borderRadius: '0.75rem',
                      border: '2px solid #3b82f6',
                      background: 'white',
                      outline: 'none',
                      color: '#1e40af'
                    }}
                  />
                  <span style={{ 
                    position: 'absolute', 
                    right: '15px', 
                    fontWeight: 900, 
                    color: '#3b82f6',
                    fontSize: '1.1rem'
                  }}>%</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: '6px', textAlign: 'center', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Advance Amount
                </p>
              </div>
            )}
          </label>
        </div>

        <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', margin: '2rem 0' }} />

        {/* Logistics Rules Section */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Truck size={24} color="#000" /> Logistics Categories & Rates
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1rem' }}>
          {['light', 'medium', 'heavy'].map((cat) => (
            <div key={cat} style={{ 
              background: '#f8fafc', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem'
            }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 900, textTransform: 'uppercase', color: '#1e293b', fontSize: '1rem', display: 'block' }}>
                  {cat} CATEGORY
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Applied when cart has {cat} items</span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flex: 2 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block' }}>RATE (₹)</label>
                  <input 
                    type="number"
                    value={(settings.logisticsRates as any)[cat].rate}
                    onChange={(e) => {
                      const newRates = { ...settings.logisticsRates };
                      (newRates as any)[cat].rate = Number(e.target.value);
                      setSettings({ ...settings, logisticsRates: newRates as any });
                    }}
                    style={{ fontWeight: 800, width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '4px', display: 'block' }}>DELIVERY MODE</label>
                  <input 
                    type="text"
                    placeholder="e.g. Bike, Truck"
                    value={(settings.logisticsRates as any)[cat].mode}
                    onChange={(e) => {
                      const newRates = { ...settings.logisticsRates };
                      (newRates as any)[cat].mode = e.target.value;
                      setSettings({ ...settings, logisticsRates: newRates as any });
                    }}
                    style={{ fontWeight: 800, width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', margin: '2rem 0' }} />

        {/* Delivery Waiver Rules Section */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CheckCircle size={24} color="#22c55e" /> Delivery Waiver Rules
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {/* Rule 1: First Order */}
          <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 900, color: '#166534' }}>FIRST ORDER WAIVER</span>
              <label className="switch-admin">
                <input 
                  type="checkbox" 
                  checked={settings.deliveryWaiverRules.firstOrder.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    deliveryWaiverRules: {
                      ...settings.deliveryWaiverRules,
                      firstOrder: { ...settings.deliveryWaiverRules.firstOrder, enabled: e.target.checked }
                    }
                  })}
                />
                <span className="slider-admin"></span>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group-admin">
                <label>Min Order Value (₹)</label>
                <input 
                  type="number"
                  value={settings.deliveryWaiverRules.firstOrder.minOrderValue}
                  onChange={(e) => setSettings({
                    ...settings,
                    deliveryWaiverRules: {
                      ...settings.deliveryWaiverRules,
                      firstOrder: { ...settings.deliveryWaiverRules.firstOrder, minOrderValue: Number(e.target.value) }
                    }
                  })}
                />
              </div>
              <div className="input-group-admin">
                <label>Max Item Weight allowed</label>
                <select 
                  value={settings.deliveryWaiverRules.firstOrder.maxWeightCategory}
                  onChange={(e) => setSettings({
                    ...settings,
                    deliveryWaiverRules: {
                      ...settings.deliveryWaiverRules,
                      firstOrder: { ...settings.deliveryWaiverRules.firstOrder, maxWeightCategory: e.target.value }
                    }
                  })}
                >
                  <option value="light">Light Only</option>
                  <option value="medium">Up to Medium</option>
                  <option value="heavy">Any Weight</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rule 2: Light Weight Threshold */}
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 900, color: '#1e293b' }}>LIGHT WEIGHT THRESHOLD</span>
              <label className="switch-admin">
                <input 
                  type="checkbox" 
                  checked={settings.deliveryWaiverRules.lightOnly.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    deliveryWaiverRules: {
                      ...settings.deliveryWaiverRules,
                      lightOnly: { ...settings.deliveryWaiverRules.lightOnly, enabled: e.target.checked }
                    }
                  })}
                />
                <span className="slider-admin"></span>
              </label>
            </div>
            <div className="input-group-admin">
              <label>Min Order Value for free delivery (Light items only)</label>
              <input 
                type="number"
                value={settings.deliveryWaiverRules.lightOnly.minOrderValue}
                onChange={(e) => setSettings({
                  ...settings,
                  deliveryWaiverRules: {
                    ...settings.deliveryWaiverRules,
                    lightOnly: { ...settings.deliveryWaiverRules.lightOnly, minOrderValue: Number(e.target.value) }
                  }
                })}
              />
            </div>
          </div>

          {/* Rule 3: Medium & Light Threshold */}
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 900, color: '#1e293b' }}>MEDIUM & LIGHT THRESHOLD</span>
              <label className="switch-admin">
                <input 
                  type="checkbox" 
                  checked={settings.deliveryWaiverRules.mediumLight.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    deliveryWaiverRules: {
                      ...settings.deliveryWaiverRules,
                      mediumLight: { ...settings.deliveryWaiverRules.mediumLight, enabled: e.target.checked }
                    }
                  })}
                />
                <span className="slider-admin"></span>
              </label>
            </div>
            <div className="input-group-admin">
              <label>Min Order Value for free delivery (Medium/Light items)</label>
              <input 
                type="number"
                value={settings.deliveryWaiverRules.mediumLight.minOrderValue}
                onChange={(e) => setSettings({
                  ...settings,
                  deliveryWaiverRules: {
                    ...settings.deliveryWaiverRules,
                    mediumLight: { ...settings.deliveryWaiverRules.mediumLight, minOrderValue: Number(e.target.value) }
                  }
                })}
              />
            </div>
          </div>

          {/* Rule 4: Small Order Cap */}
          <div style={{ background: '#fff7ed', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #ffedd5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 900, color: '#9a3412' }}>SMALL ORDER DELIVERY CAP</span>
              <label className="switch-admin">
                <input 
                  type="checkbox" 
                  checked={settings.deliveryWaiverRules.smallOrderCap.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    deliveryWaiverRules: {
                      ...settings.deliveryWaiverRules,
                      smallOrderCap: { ...settings.deliveryWaiverRules.smallOrderCap, enabled: e.target.checked }
                    }
                  })}
                />
                <span className="slider-admin"></span>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group-admin">
                <label>Order Value below (₹)</label>
                <input 
                  type="number"
                  value={settings.deliveryWaiverRules.smallOrderCap.maxValue}
                  onChange={(e) => setSettings({
                    ...settings,
                    deliveryWaiverRules: {
                      ...settings.deliveryWaiverRules,
                      smallOrderCap: { ...settings.deliveryWaiverRules.smallOrderCap, maxValue: Number(e.target.value) }
                    }
                  })}
                />
              </div>
              <div className="input-group-admin">
                <label>Cap Delivery Charge at (₹)</label>
                <input 
                  type="number"
                  value={settings.deliveryWaiverRules.smallOrderCap.cappedCharge}
                  onChange={(e) => setSettings({
                    ...settings,
                    deliveryWaiverRules: {
                      ...settings.deliveryWaiverRules,
                      smallOrderCap: { ...settings.deliveryWaiverRules.smallOrderCap, cappedCharge: Number(e.target.value) }
                    }
                  })}
                />
              </div>
            </div>
          </div>
        </div>

        <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', margin: '2rem 0' }} />

        {/* Save Button */}
        <div style={{ marginTop: '2.5rem' }}>
          <button 
            onClick={handleSave}
            disabled={saving}
            style={{ 
              width: '100%', 
              padding: '1.25rem', 
              background: '#000', 
              color: '#FFEA00', 
              borderRadius: '1rem', 
              fontSize: '1.1rem',
              fontWeight: 900,
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            {saving ? (
              <>
                <div className="spinner-small" style={{ borderTopColor: '#FFEA00' }}></div>
                SAVING CHANGES...
              </>
            ) : (
              <>
                <Save size={24} />
                UPDATE SERVICE STATUS
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spinner-small {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .switch-admin {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
        }
        .switch-admin input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider-admin {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: .4s;
          border-radius: 34px;
        }
        .slider-admin:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider-admin {
          background-color: #22c55e;
        }
        input:focus + .slider-admin {
          box-shadow: 0 0 1px #22c55e;
        }
        input:checked + .slider-admin:before {
          transform: translateX(24px);
        }
        .input-group-admin select {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          font-weight: 700;
          background: white;
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default ServiceSettings;

