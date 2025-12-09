"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { Star, MapPin, ArrowRight } from 'lucide-react';

// Fix for default marker icon in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to update map center when coordinates change
function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

interface Salon {
    id: string;
    name_fr: string;
    name_en?: string;
    latitude: number;
    longitude: number;
    cover_image?: string;
    rating?: number;
    address?: string;
    quarter?: string;
    city?: string;
    service_areas?: {
        name: string;
        latitude: number;
        longitude: number;
    }[];
    type?: 'salon' | 'therapist';
}

interface MapProps {
    salons: Salon[];
    userLocation: { lat: number; lon: number } | null;
    language?: 'fr' | 'en';
}

export default function Map({ salons, userLocation, language = 'fr' }: MapProps) {
    const router = useRouter();
    const defaultCenter: [number, number] = [4.0511, 9.7679]; // Douala default
    const center = userLocation ? [userLocation.lat, userLocation.lon] as [number, number] : defaultCenter;

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-100 relative z-0">
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={center} />

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lon]} icon={icon}>
                        <Popup>
                            <div className="font-medium">
                                {language === 'en' ? 'Your Position' : 'Votre position'}
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Salon Markers */}
                {salons.map((salon) => {
                    // Helper to render a marker
                    const renderMarker = (lat: number, lon: number, locationName: string, isServiceArea = false) => {
                        const salonIcon = L.divIcon({
                            className: 'custom-salon-marker',
                            html: `<div style="
                                background-image: url('${salon.cover_image || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=200"}'); 
                                width: ${isServiceArea ? '40px' : '48px'}; 
                                height: ${isServiceArea ? '40px' : '48px'}; 
                                background-size: cover; 
                                background-position: center;
                                border-radius: 50%; 
                                border: ${isServiceArea ? '3px solid #3b82f6' : '3px solid white'}; 
                                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                            "></div>`,
                            iconSize: [isServiceArea ? 40 : 48, isServiceArea ? 40 : 48],
                            iconAnchor: [isServiceArea ? 20 : 24, isServiceArea ? 20 : 24],
                            popupAnchor: [0, isServiceArea ? -20 : -24]
                        });

                        return (
                            <Marker
                                key={`${salon.id}-${locationName}`}
                                position={[lat, lon]}
                                icon={salonIcon}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-1 min-w-[200px]">
                                        <div className="h-32 w-full rounded-lg overflow-hidden mb-3 relative">
                                            <img
                                                src={salon.cover_image || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=200"}
                                                alt={salon.name_fr}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold flex items-center shadow-sm">
                                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                                                {salon.rating || "4.8"}
                                            </div>
                                            {isServiceArea && (
                                                <div className="absolute bottom-2 left-2 bg-blue-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-sm">
                                                    {language === 'en' ? 'Service Area' : 'Zone couverte'}
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-base mb-1">
                                            {(language === 'en' && salon.name_en) ? salon.name_en : salon.name_fr}
                                        </h3>
                                        <p className="text-xs text-gray-500 flex items-center mb-3">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {locationName}
                                        </p>

                                        <Button
                                            size="sm"
                                            className="w-full rounded-full h-8 text-xs font-bold"
                                            onClick={() => {
                                                if (salon.type === 'therapist') {
                                                    router.push(`/therapist/${salon.id}`);
                                                } else {
                                                    router.push(`/salons/${salon.id}`);
                                                }
                                            }}
                                        >
                                            {language === 'en' ? 'View Details' : 'Voir détails'} <ArrowRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    };

                    // Render main location if it exists (some freelancers might ONLY have service areas)
                    const markers = [];
                    if (salon.latitude && salon.longitude) {
                        markers.push(renderMarker(
                            salon.latitude,
                            salon.longitude,
                            salon.quarter ? `${salon.quarter}, ${salon.city}` : salon.address || salon.city || ""
                        ));
                    }

                    // Render service areas if they exist
                    if (salon.service_areas && salon.service_areas.length > 0) {
                        salon.service_areas.forEach(area => {
                            markers.push(renderMarker(area.latitude, area.longitude, area.name, true));
                        });
                    }

                    return markers;
                })}
            </MapContainer>
        </div>
    );
}
