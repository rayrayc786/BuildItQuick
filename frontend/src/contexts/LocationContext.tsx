import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface Location {
  address: string;
  coords: { lat: number; lng: number };
  isServiceable: boolean;
}

interface LocationContextType {
  location: Location | null;
  setLocation: (loc: Location) => void;
  detectLocation: () => Promise<void>;
  isLocating: boolean;
  error: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocationState] = useState<Location | null>(() => {
    const saved = localStorage.getItem('user_location');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const geocodingLibrary = useMapsLibrary('geocoding');

  const setLocation = (loc: Location) => {
    setLocationState(loc);
    localStorage.setItem('user_location', JSON.stringify(loc));
  };

  const checkServiceability = async (pincode: string, city: string) => {
    try {
      const query = pincode || city;
      if (!query) return false;

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/check-serviceability/${encodeURIComponent(query)}`
      );
      return !!data.serviceable;
    } catch (err) {
      console.error('Serviceability check failed:', err);
      return false; // Strict: if check fails, assume not serviceable
    }
  };

  const getAddressFromCoords = useCallback(async (lat: number, lng: number) => {
    if (!geocodingLibrary) return null;
    
    const geocoder = new geocodingLibrary.Geocoder();
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results[0]) {
        const result = response.results[0];
        const address = result.formatted_address;
        
        // Extract pincode and city correctly
        const pincodeComp = result.address_components.find((c: any) => c.types.includes('postal_code'));
        const cityComp = result.address_components.find((c: any) => c.types.includes('locality')) || 
                        result.address_components.find((c: any) => c.types.includes('administrative_area_level_2'));
        
        const pincode = pincodeComp ? pincodeComp.long_name : '';
        const city = cityComp ? cityComp.long_name : '';

        const isServiceable = await checkServiceability(pincode, city);
        return { address, isServiceable };
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
    return null;
  }, [geocodingLibrary]);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsLocating(true);
    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const result = await getAddressFromCoords(latitude, longitude);
          if (result) {
            setLocation({
              address: result.address,
              coords: { lat: latitude, lng: longitude },
              isServiceable: result.isServiceable
            });
          }
          setIsLocating(false);
          resolve();
        },
        (err) => {
          setError(err.message);
          setIsLocating(false);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }, [getAddressFromCoords]);

  // Handle watchPosition for automatic movement detection
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Only update if moved significantly (e.g., > 100 meters)
        // For simplicity, we can also check if the existing address is far from new coords
        // but here we'll just check if the coordinates changed significantly enough
        
        if (!location || 
            Math.abs(location.coords.lat - latitude) > 0.001 || 
            Math.abs(location.coords.lng - longitude) > 0.001) {
          
          const result = await getAddressFromCoords(latitude, longitude);
          if (result) {
            setLocation({
              address: result.address,
              coords: { lat: latitude, lng: longitude },
              isServiceable: result.isServiceable
            });
          }
        }
      },
      (err) => console.warn('WatchPosition error:', err),
      { enableHighAccuracy: true, distanceFilter: 100 } as any // distanceFilter is supported in some browsers/wrappers
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [getAddressFromCoords, location]);

  useEffect(() => {
    if (!location && geocodingLibrary) {
      detectLocation();
    }
  }, [location, geocodingLibrary, detectLocation]);

  return (
    <LocationContext.Provider value={{ location, setLocation, detectLocation, isLocating, error }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
