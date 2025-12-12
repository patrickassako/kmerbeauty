/**
 * Batch Geocoding Script
 * 
 * This script enriches all existing therapist service zones with GPS coordinates.
 * Run with: npx ts-node scripts/batch-geocode-zones.ts
 * 
 * Or add to package.json: "geocode:zones": "ts-node scripts/batch-geocode-zones.ts"
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// In-memory cache for geocoded coordinates
const geocodeCache = new Map<string, { lat: number; lon: number }>();

interface ServiceZone {
    city: string;
    district?: string;
    latitude?: number;
    longitude?: number;
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeZone(zone: ServiceZone): Promise<{ lat: number; lon: number } | null> {
    if (!zone.city) return null;

    const city = zone.city.trim();
    const district = zone.district?.trim();
    const cacheKey = district ? `${district}|${city}`.toLowerCase() : city.toLowerCase();

    // Check cache
    if (geocodeCache.has(cacheKey)) {
        console.log(`  📍 Cache hit: ${cacheKey}`);
        return geocodeCache.get(cacheKey)!;
    }

    const query = district
        ? `${district}, ${city}, Cameroun`
        : `${city}, Cameroun`;

    try {
        // Rate limit: 1 request per second for Nominatim
        await sleep(1100);

        console.log(`  🌍 Geocoding: ${query}`);

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
            {
                headers: {
                    'User-Agent': 'KmerBeauty-BatchGeocoder/1.0 (contact@kmerbeauty.com)'
                }
            }
        );

        if (!response.ok) {
            console.error(`  ❌ API error: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data && data[0]) {
            const coords = {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
            geocodeCache.set(cacheKey, coords);
            console.log(`  ✅ Found: (${coords.lat}, ${coords.lon})`);
            return coords;
        }

        console.warn(`  ⚠️ No results for: ${query}`);
        return null;
    } catch (error) {
        console.error(`  ❌ Error geocoding ${query}:`, error);
        return null;
    }
}

async function enrichServiceZones(zones: any[]): Promise<ServiceZone[]> {
    if (!zones || !Array.isArray(zones) || zones.length === 0) {
        return [];
    }

    // Normalize zones
    const normalizedZones: ServiceZone[] = zones.map(zone => {
        if (typeof zone === 'string') {
            return { city: zone };
        }
        return zone as ServiceZone;
    });

    const enrichedZones: ServiceZone[] = [];

    for (const zone of normalizedZones) {
        // Skip if already has coordinates
        if (zone.latitude && zone.longitude) {
            enrichedZones.push(zone);
            continue;
        }

        const coords = await geocodeZone(zone);

        if (coords) {
            enrichedZones.push({
                ...zone,
                latitude: coords.lat,
                longitude: coords.lon
            });
        } else {
            enrichedZones.push(zone);
        }
    }

    return enrichedZones;
}

async function main() {
    console.log('🚀 Starting batch geocoding of therapist service zones...\n');

    // Fetch all therapists with service_zones
    const { data: therapists, error } = await supabase
        .from('therapists')
        .select('id, business_name, service_zones')
        .not('service_zones', 'is', null);

    if (error) {
        console.error('❌ Error fetching therapists:', error);
        process.exit(1);
    }

    console.log(`📊 Found ${therapists?.length || 0} therapists with service zones\n`);

    if (!therapists || therapists.length === 0) {
        console.log('✅ No therapists to process.');
        return;
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const therapist of therapists) {
        console.log(`\n👤 Processing: ${therapist.business_name || therapist.id}`);

        const zones = therapist.service_zones;

        if (!zones || !Array.isArray(zones) || zones.length === 0) {
            console.log('  ⏭️ No zones to process');
            skippedCount++;
            continue;
        }

        // Check if all zones already have coordinates
        const allHaveCoords = zones.every((z: any) =>
            (typeof z === 'object' && z.latitude && z.longitude)
        );

        if (allHaveCoords) {
            console.log('  ⏭️ All zones already have coordinates');
            skippedCount++;
            continue;
        }

        try {
            const enrichedZones = await enrichServiceZones(zones);

            // Update therapist with enriched zones
            const { error: updateError } = await supabase
                .from('therapists')
                .update({ service_zones: enrichedZones })
                .eq('id', therapist.id);

            if (updateError) {
                console.error(`  ❌ Update error:`, updateError);
                errorCount++;
            } else {
                const enrichedCount = enrichedZones.filter(z => z.latitude).length;
                console.log(`  ✅ Updated: ${enrichedCount}/${zones.length} zones enriched`);
                updatedCount++;
            }
        } catch (err) {
            console.error(`  ❌ Error processing therapist:`, err);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 BATCH GEOCODING COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Updated: ${updatedCount} therapists`);
    console.log(`⏭️ Skipped: ${skippedCount} therapists`);
    console.log(`❌ Errors:  ${errorCount} therapists`);
    console.log(`📍 Cache size: ${geocodeCache.size} unique locations`);
}

main().catch(console.error);
