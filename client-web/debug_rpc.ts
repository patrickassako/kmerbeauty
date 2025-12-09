
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    console.log('Testing get_nearby_providers RPC...');

    // Coordinates for Akwa, Douala
    const lat = 4.052544;
    const lon = 9.6963304;
    const city = "Akwa"; // As passed by the frontend currently
    const district = null;

    // Service ID from the user's logs (massage?)
    // GET /service/f3a4b5c6-d7e8-4f90-1234-567890abcdef
    const serviceId = 'f3a4b5c6-d7e8-4f90-1234-567890abcdef';

    console.log(`Params: lat=${lat}, lon=${lon}, city=${city}, district=${district}, serviceId=${serviceId}`);

    const { data, error } = await supabase.rpc('get_nearby_providers', {
        lat: lat,
        lng: lon,
        radius_meters: 30000,
        client_city: city,
        client_district: district,
        filter_service_id: serviceId
    });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log(`Found ${data.length} providers`);
        if (data.length > 0) {
            console.log('First provider:', data[0]);
            console.log('Distances:', data.map((p: any) => `${p.name}: ${p.distance_meters}m, City: ${p.city}`));
        }
    }
}

testRpc();
