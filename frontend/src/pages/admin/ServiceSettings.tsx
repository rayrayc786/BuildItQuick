import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Power, Save, AlertTriangle, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../../contexts/SettingsContext';

const ServiceSettings: React.FC = () => {
  const { refreshSettings, isCurrentlyEnabled } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    isServiceEnabled: true,
    offlineMessage: "",
    useOperatingHours: false,
    serviceStartTime: "09:00",
    serviceEndTime: "21:00"
  });

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/admin/settings`);
        setSettings({
          isServiceEnabled: data.isServiceEnabled,
          offlineMessage: data.offlineMessage || "",
          useOperatingHours: data.useOperatingHours || false,
          serviceStartTime: data.serviceStartTime || "09:00",
          serviceEndTime: data.serviceEndTime || "21:00"
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

        {/* Offline Message */}
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
      `}</style>
    </div>
  );
};

export default ServiceSettings;

