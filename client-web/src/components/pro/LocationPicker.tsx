"use client";

import { useEffect, useState, useRef } from 'react';
import { MapPin, Crosshair, Loader2 } from 'lucide-react';

interface LocationPickerProps {
    value: {
        latitude: number;
        longitude: number;
        address: string;
        city: string;
        region: string;
    } | null;
    onChange: (location: {
        latitude: number;
        longitude: number;
        address: string;
        city: string;
        region: string;
    }) => void;
    label?: string;
    error?: string;
}

export default function LocationPicker({ value, onChange, label, error }: LocationPickerProps) {
    const [search, setSearch] = useState(value?.address || '');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [showMap, setShowMap] = useState(!!value);
    const [gettingLocation, setGettingLocation] = useState(false);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [mapReady, setMapReady] = useState(false);

    // Default to Douala center
    const defaultCenter: [number, number] = [4.0511, 9.7679];

    useEffect(() => {
        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        return () => {
            document.head.removeChild(link);
        };
    }, []);

    useEffect(() => {
        if (showMap && !mapRef.current) {
            initMap();
        }
    }, [showMap]);

    const initMap = async () => {
        const L = (await import('leaflet')).default;

        // Fix default icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const initialPos = value
            ? [value.latitude, value.longitude] as [number, number]
            : defaultCenter;

        const map = L.map('location-picker-map').setView(initialPos, 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Custom red marker icon
        const redIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
        });

        const marker = L.marker(initialPos, {
            draggable: true,
            icon: redIcon,
        }).addTo(map);

        marker.on('dragend', async () => {
            const pos = marker.getLatLng();
            await reverseGeocode(pos.lat, pos.lng);
        });

        map.on('click', async (e: L.LeafletMouseEvent) => {
            marker.setLatLng(e.latlng);
            await reverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;
        setMapReady(true);
    };

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                { headers: { 'User-Agent': 'KMR-Beauty-Web/1.0' } }
            );
            const data = await response.json();

            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || 'Unknown';
            const region = addr.state || addr.region || '';

            onChange({
                latitude: lat,
                longitude: lng,
                address: data.display_name || '',
                city,
                region,
            });
            setSearch(data.display_name || '');
        } catch (error) {
            console.error('Error reverse geocoding:', error);
        }
    };

    const searchAddress = async (query: string) => {
        setSearch(query);
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        try {
            setSearching(true);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=cm&addressdetails=1&limit=5`,
                { headers: { 'User-Agent': 'KMR-Beauty-Web/1.0' } }
            );
            const data = await response.json();
            setSuggestions(data);
        } catch (error) {
            console.error('Error searching address:', error);
        } finally {
            setSearching(false);
        }
    };

    const selectAddress = (item: any) => {
        const addr = item.address || {};
        const city = addr.city || addr.town || addr.village || addr.municipality || 'Unknown';
        const region = addr.state || addr.region || '';
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        onChange({
            latitude: lat,
            longitude: lng,
            address: item.display_name,
            city,
            region,
        });

        setSearch(item.display_name);
        setSuggestions([]);
        setShowMap(true);

        // Move map and marker
        if (mapRef.current && markerRef.current) {
            mapRef.current.setView([lat, lng], 16);
            markerRef.current.setLatLng([lat, lng]);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('La géolocalisation n\'est pas supportée par votre navigateur');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setShowMap(true);

                // Wait for map to be ready
                setTimeout(async () => {
                    if (mapRef.current && markerRef.current) {
                        mapRef.current.setView([latitude, longitude], 16);
                        markerRef.current.setLatLng([latitude, longitude]);
                    }
                    await reverseGeocode(latitude, longitude);
                    setGettingLocation(false);
                }, 500);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Impossible d\'obtenir votre position');
                setGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
                <MapPin className="w-4 h-4 inline mr-2" />
                {label || 'Adresse principale'}
            </label>

            {/* Search Input */}
            <div className="relative">
                <input
                    className={`w-full p-3 pr-12 rounded-xl border ${error ? 'border-red-500' : 'border-gray-200'} focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none`}
                    placeholder="Rechercher votre adresse..."
                    value={search}
                    onChange={e => searchAddress(e.target.value)}
                />
                <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-amber-500 transition-colors"
                    title="Utiliser ma position"
                >
                    {gettingLocation ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Crosshair className="w-5 h-5" />
                    )}
                </button>

                {searching && <Loader2 className="w-5 h-5 animate-spin absolute right-12 top-3.5 text-gray-400" />}

                {suggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-lg border max-h-60 overflow-y-auto">
                        {suggestions.map((item, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => selectAddress(item)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-0 text-sm"
                            >
                                {item.display_name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* Map Container */}
            {showMap && (
                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <div
                        id="location-picker-map"
                        className="h-64 w-full"
                        style={{ minHeight: '256px' }}
                    />
                    <div className="p-3 bg-amber-50 text-sm text-amber-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">Déplacez le marqueur pour ajuster votre position</span>
                    </div>
                    {value && (
                        <div className="p-3 bg-gray-50 text-sm text-gray-600 border-t">
                            📍 {value.city}, {value.region}
                        </div>
                    )}
                </div>
            )}

            {!showMap && !value && (
                <button
                    type="button"
                    onClick={() => {
                        setShowMap(true);
                        setTimeout(() => {
                            if (!mapReady) initMap();
                        }, 100);
                    }}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
                >
                    <MapPin className="w-5 h-5" />
                    Sélectionner sur la carte
                </button>
            )}
        </div>
    );
}
