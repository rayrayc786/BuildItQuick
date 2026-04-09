import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const settingsChannel = new BroadcastChannel('settings_sync');

interface Settings {
  isServiceEnabled: boolean;
  offlineMessage: string;
  useOperatingHours: boolean;
  serviceStartTime: string;
  serviceEndTime: string;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  platformFee: number;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  isCurrentlyEnabled: boolean;
  refreshSettings: (shouldBroadcast?: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    isServiceEnabled: true,
    offlineMessage: "",
    useOperatingHours: false,
    serviceStartTime: "09:00",
    serviceEndTime: "21:00",
    deliveryCharge: 150,
    freeDeliveryThreshold: 5000,
    platformFee: 15
  });
  const [loading, setLoading] = useState(true);
  const [isCurrentlyEnabled, setIsCurrentlyEnabled] = useState(true);

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api';

  const checkStatus = (data: Settings) => {
    // 1. Manual override takes precedence
    if (!data.isServiceEnabled) return false;
    
    // 2. If no schedule is used, and it's enabled, we are open
    if (!data.useOperatingHours) return true;

    // 3. Time Check
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = data.serviceStartTime.split(':').map(Number);
    const [endH, endM] = data.serviceEndTime.split(':').map(Number);
    
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    if (startTime < endTime) {
      // Normal shift: e.g. 09:00 - 21:00
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight shift: e.g. 21:00 - 03:00
      // We are open if current time is AFTER start OR BEFORE end
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  const refreshSettings = async (shouldBroadcast = false) => {
    try {
      const { data } = await axios.get(`${API_BASE}/products/site/settings`);
      const updated = {
        isServiceEnabled: data.isServiceEnabled,
        offlineMessage: data.offlineMessage ?? "",
        useOperatingHours: data.useOperatingHours ?? false,
        serviceStartTime: data.serviceStartTime ?? "09:00",
        serviceEndTime: data.serviceEndTime ?? "21:00",
        deliveryCharge: data.deliveryCharge ?? 150,
        freeDeliveryThreshold: data.freeDeliveryThreshold ?? 5000,
        platformFee: data.platformFee ?? 15
      };
      setSettings(updated);
      setIsCurrentlyEnabled(checkStatus(updated));
      
      if (shouldBroadcast) {
        settingsChannel.postMessage('refresh');
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();

    // Listen for updates from other tabs
    settingsChannel.onmessage = (event) => {
      if (event.data === 'refresh') {
        refreshSettings(false);
      }
    };
    // Refresh from server every 30 seconds
    const serverInterval = setInterval(refreshSettings, 30000);
    
    // Re-check local calculation every minute (to handle clock crossing boundaries)
    const localInterval = setInterval(() => {
      setIsCurrentlyEnabled(checkStatus(settings));
    }, 60000);

    return () => {
      clearInterval(serverInterval);
      clearInterval(localInterval);
    };
  }, [settings.useOperatingHours, settings.serviceStartTime, settings.serviceEndTime, settings.isServiceEnabled]);

  return (
    <SettingsContext.Provider value={{ settings, loading, isCurrentlyEnabled, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
