import { Injectable } from '@nestjs/common';

interface ZoneCoordinates {
    lat: number;
    lon: number;
}

interface ServiceZone {
    city: string;
    district?: string;
    latitude?: number;
    longitude?: number;
}

@Injectable()
export class GeocodingService {
    // In-memory cache for geocoded coordinates
    private cache = new Map<string, ZoneCoordinates>();
    private lastRequestTime = 0;
    private readonly MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds to respect Nominatim rate limits

    /**
     * Generate a cache key from zone data
     */
    private getCacheKey(zone: ServiceZone): string {
        const city = zone.city?.trim().toLowerCase() || '';
        const district = zone.district?.trim().toLowerCase() || '';
        return district ? `${district}|${city}` : city;
    }

    /**
     * Rate-limited delay to respect Nominatim API limits
     */
    private async rateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
            await new Promise(resolve =>
                setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
            );
        }
        this.lastRequestTime = Date.now();
    }

    /**
     * Geocode a single zone using Nominatim API
     */
    async geocodeZone(zone: ServiceZone): Promise<ZoneCoordinates | null> {
        if (!zone.city) return null;

        const cacheKey = this.getCacheKey(zone);

        // Check cache first
        if (this.cache.has(cacheKey)) {
            console.log(`📍 [Geocoding] Cache hit for: ${cacheKey}`);
            return this.cache.get(cacheKey)!;
        }

        // Build query
        const city = zone.city.trim();
        const district = zone.district?.trim();
        const query = district
            ? `${district}, ${city}, Cameroun`
            : `${city}, Cameroun`;

        try {
            // Respect rate limits
            await this.rateLimit();

            console.log(`🌍 [Geocoding] Geocoding: ${query}`);

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
                {
                    headers: {
                        'User-Agent': 'KmerBeauty/1.0 (contact@kmerbeauty.com)'
                    }
                }
            );

            if (!response.ok) {
                console.error(`❌ [Geocoding] API error: ${response.status}`);
                return null;
            }

            const data = await response.json();

            if (data && data[0]) {
                const coords: ZoneCoordinates = {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                };

                // Cache the result
                this.cache.set(cacheKey, coords);
                console.log(`✅ [Geocoding] Found: ${query} → (${coords.lat}, ${coords.lon})`);

                return coords;
            }

            console.warn(`⚠️ [Geocoding] No results for: ${query}`);
            return null;
        } catch (error) {
            console.error(`❌ [Geocoding] Error geocoding ${query}:`, error);
            return null;
        }
    }

    /**
   * Enrich an array of service zones with coordinates
   * Zones that already have coordinates are preserved
   * Zones without coordinates are geocoded
   * Handles both string[] and ServiceZone[] formats
   */
    async enrichServiceZones(zones: any[]): Promise<ServiceZone[]> {
        if (!zones || !Array.isArray(zones) || zones.length === 0) {
            return [];
        }

        console.log(`📍 [Geocoding] Enriching ${zones.length} service zones...`);

        // Normalize zones - handle both string[] and ServiceZone[] formats
        const normalizedZones: ServiceZone[] = zones.map(zone => {
            if (typeof zone === 'string') {
                // If it's just a string like "Yaoundé", treat it as city
                return { city: zone };
            }
            return zone as ServiceZone;
        });

        const enrichedZones: ServiceZone[] = [];

        for (const zone of normalizedZones) {
            // Skip if zone already has coordinates
            if (zone.latitude && zone.longitude) {
                console.log(`📍 [Geocoding] Zone already has coordinates: ${zone.city}`);
                enrichedZones.push(zone);
                continue;
            }

            // Geocode the zone
            const coords = await this.geocodeZone(zone);

            if (coords) {
                enrichedZones.push({
                    ...zone,
                    latitude: coords.lat,
                    longitude: coords.lon
                });
            } else {
                // Keep zone without coordinates if geocoding fails
                enrichedZones.push(zone);
            }
        }

        console.log(`✅ [Geocoding] Enriched ${enrichedZones.filter(z => z.latitude).length}/${zones.length} zones with coordinates`);

        return enrichedZones;
    }

    /**
     * Get cache stats for debugging
     */
    getCacheStats(): { size: number; entries: string[] } {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}
