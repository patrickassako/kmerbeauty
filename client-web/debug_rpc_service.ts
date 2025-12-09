
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRpc() {
    console.log('Checking total links...');
    const { count: totalSalons } = await supabase.from('salon_services').select('*', { count: 'exact', head: true });
    const { count: totalTherapists } = await supabase.from('therapist_services').select('*', { count: 'exact', head: true });

    console.log(`Total Salon Services links: ${totalSalons}`);
    console.log(`Total Therapist Services links: ${totalTherapists}`);

    if (totalSalons === 0 && totalTherapists === 0) {
        console.error('CRITICAL: No services are linked to any providers!');
        return;
    }

    // Find a service that IS linked
    let serviceId = null;
    if (totalSalons > 0) {
        const { data } = await supabase.from('salon_services').select('service_id').limit(1);
        if (data) serviceId = data[0].service_id;
    } else if (totalTherapists > 0) {
        const { data } = await supabase.from('therapist_services').select('service_id').limit(1);
        if (data) serviceId = data[0].service_id;
    }

    if (!serviceId) {
        console.error('Could not find a linked service ID despite counts > 0');
        return;
    }

    console.log(`Testing with LINKED Service ID: ${serviceId}`);

    // Inspect the providers linked to this service
    console.log('Inspecting linked salons...');
    const { data: linkedSalons } = await supabase
        .from('salon_services')
        .select('salon_id, salons(*)')
        .eq('service_id', serviceId);

    linkedSalons?.forEach(item => {
        const s = item.salons;
        console.log(`Salon ${s.name_fr}: Active=${s.is_active}, Lat=${s.latitude}, Lng=${s.longitude}, City=${s.city}`);
    });

    console.log('Inspecting linked therapists...');
    const { data: linkedTherapists } = await supabase
        .from('therapist_services')
        .select('therapist_id, therapists(*)')
        .eq('service_id', serviceId);

    linkedTherapists?.forEach(item => {
        const t = item.therapists;
        console.log(`Therapist ${t.name}: Active=${t.is_active}, Online=${t.is_online}, Lat=${t.latitude}, Lng=${t.longitude}, City=${t.city}`);
    });

    const params = {
        lat: 3.8480, // Yaoundé
        lng: 11.5021,
        radius_meters: 30000,
        client_city: 'Yaoundé',
        client_district: null,
        filter_service_id: serviceId
    };

    // Test 1: Standard Call
    console.log('--- Test 1: Standard Call ---');
    const { data: data1 } = await supabase.rpc('get_nearby_providers', params);
    console.log(`Result: ${data1?.length || 0} providers`);

    // Test 2: No City Filter
    console.log('--- Test 2: No City Filter ---');
    const paramsNoCity = { ...params, client_city: null };
    const { data: data2 } = await supabase.rpc('get_nearby_providers', paramsNoCity);
    console.log(`Result: ${data2?.length || 0} providers`);

    // Test 3: No Service Filter
    console.log('--- Test 3: No Service Filter ---');
    const paramsNoService = { ...params, filter_service_id: null };
    const { data: data3 } = await supabase.rpc('get_nearby_providers', paramsNoService);
    console.log(`Result: ${data3?.length || 0} providers`);

    // Test 4: No Location (Global)
    console.log('--- Test 4: No Location (Global) ---');
    const paramsGlobal = { ...params, lat: null, lng: null, client_city: null };
    const { data: data4 } = await supabase.rpc('get_nearby_providers', paramsGlobal);
    console.log(`Result: ${data4?.length || 0} providers`);

    // Test 5: Global Location + Service Filter
    console.log('--- Test 5: Global Location + Service Filter ---');
    const paramsGlobalService = { ...params, lat: null, lng: null, client_city: null, filter_service_id: serviceId };
    const { data: data5 } = await supabase.rpc('get_nearby_providers', paramsGlobalService);
    console.log(`Result: ${data5?.length || 0} providers`);
}

debugRpc();
