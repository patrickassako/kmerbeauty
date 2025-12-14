import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import { servicesApi } from '../services/api';

interface NearbyProvider {
    id: string;
    type: 'therapist' | 'salon';
    name: string;
    bio: string;
    rating: number;
    review_count: number;
    distance_meters: number;
    image: string | null;
    city: string;
    is_mobile: boolean;
    is_active: boolean;
    latitude: number;
    longitude: number;
    service_price?: number;
    match_type: string;
    match_score: number;
}

interface LocationCoords {
    latitude: number;
    longitude: number;
}

interface GeolocationContextType {
    location: LocationCoords | null;
    city: string | undefined;
    district: string | undefined;
    nearbyProviders: NearbyProvider[];
    loading: boolean;
    error: string | null;
    permissionGranted: boolean;
    refresh: () => void;
    setManualLocation: (lat: number, lng: number, manualCity?: string, manualDistrict?: string) => Promise<void>;
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

export const GeolocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [location, setLocation] = useState<LocationCoords | null>(null);
    const [nearbyProviders, setNearbyProviders] = useState<NearbyProvider[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [city, setCity] = useState<string | undefined>();
    const [district, setDistrict] = useState<string | undefined>();

    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionGranted(status === 'granted');

            if (status === 'granted') {
                getCurrentLocation();
            }
        } catch (err) {
            console.error('Error requesting location permission:', err);
            setError('Impossible d\'accéder à la localisation');
        }
    };

    const getCurrentLocation = async () => {
        try {
            setLoading(true);
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const coords = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            };

            setLocation(coords);

            // Reverse geocoding to get city and district
            let detectedCity = undefined;
            let detectedDistrict = undefined;
            try {
                const address = await Location.reverseGeocodeAsync({
                    latitude: coords.latitude,
                    longitude: coords.longitude
                });

                if (address && address.length > 0) {
                    detectedCity = (address[0].city || address[0].region) ?? undefined;
                    detectedDistrict = (address[0].district || address[0].subregion || address[0].street) ?? undefined;
                    console.log('📍 User location:', detectedCity, detectedDistrict);
                    setCity(detectedCity);
                    setDistrict(detectedDistrict);
                }
            } catch (geoError) {
                console.warn('Reverse geocoding failed:', geoError);
            }

            await fetchNearbyProviders(coords.latitude, coords.longitude, 50000, detectedCity, detectedDistrict);
        } catch (err) {
            console.error('Error getting location:', err);
            setError('Impossible de récupérer votre position');
        } finally {
            setLoading(false);
        }
    };

    const fetchNearbyProviders = async (
        lat: number,
        lng: number,
        radius: number = 10000,
        city?: string,
        district?: string
    ) => {
        try {
            setLoading(true);
            setError(null);

            const providers = await servicesApi.getAllNearbyProviders({
                lat,
                lng,
                radius,
                city,
                district
            });

            setNearbyProviders(providers || []);
        } catch (err) {
            console.error('Error fetching nearby providers:', err);
            setError('Impossible de charger les prestataires');
            setNearbyProviders([]);
        } finally {
            setLoading(false);
        }
    };

    const refresh = () => {
        if (permissionGranted) {
            getCurrentLocation();
        }
    };

    const setManualLocation = async (lat: number, lng: number, manualCity?: string, manualDistrict?: string) => {
        setLocation({ latitude: lat, longitude: lng });
        setCity(manualCity);
        setDistrict(manualDistrict);
        await fetchNearbyProviders(lat, lng, 50000, manualCity, manualDistrict);
    };

    return (
        <GeolocationContext.Provider value={{
            location,
            city,
            district,
            nearbyProviders,
            loading,
            error,
            permissionGranted,
            refresh,
            setManualLocation,
        }}>
            {children}
        </GeolocationContext.Provider>
    );
};

export const useGeolocation = () => {
    const context = useContext(GeolocationContext);
    if (context === undefined) {
        throw new Error('useGeolocation must be used within a GeolocationProvider');
    }
    return context;
};
