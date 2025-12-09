import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SERVICE_ID = 'f3a4b5c6-d7e8-4f90-1234-567890abcdef';

async function check() {
    console.log(`\n=== Checking service ID: ${SERVICE_ID} ===\n`);

    // 1. Does this service exist?
    const { data: service, error: sErr } = await supabase
        .from('services')
        .select('*')
        .eq('id', SERVICE_ID)
        .single();

    if (sErr) {
        console.log('❌ Service NOT FOUND:', sErr.message);
    } else {
        console.log('✅ Service found:', service.name_fr, '| Category:', service.category);
    }

    // 2. Check therapist_services links
    const { data: therapistLinks, count: tCount } = await supabase
        .from('therapist_services')
        .select('*, therapists(*)', { count: 'exact' })
        .eq('service_id', SERVICE_ID);

    console.log(`\n📋 Therapist links for this service: ${tCount || 0}`);
    therapistLinks?.forEach(link => {
        const t = link.therapists;
        console.log(`   - Therapist ID: ${link.therapist_id}`);
        console.log(`     Name: ${t?.business_name || 'N/A'}, Active: ${t?.is_active}, Online: ${t?.is_online}`);
    });

    // 3. Check salon_services links
    const { data: salonLinks, count: sCount } = await supabase
        .from('salon_services')
        .select('*, salons(*)', { count: 'exact' })
        .eq('service_id', SERVICE_ID);

    console.log(`\n🏢 Salon links for this service: ${sCount || 0}`);
    salonLinks?.forEach(link => {
        const s = link.salons;
        console.log(`   - Salon ID: ${link.salon_id}`);
        console.log(`     Name: ${s?.name_fr || 'N/A'}, Active: ${s?.is_active}`);
    });

    // 4. List all services with their link counts
    console.log('\n=== All Services Overview ===\n');
    const { data: allServices } = await supabase.from('services').select('id, name_fr');
    
    for (const svc of allServices || []) {
        const { count: tc } = await supabase.from('therapist_services').select('*', { count: 'exact', head: true }).eq('service_id', svc.id);
        const { count: sc } = await supabase.from('salon_services').select('*', { count: 'exact', head: true }).eq('service_id', svc.id);
        console.log(`${svc.id} | ${svc.name_fr} | Therapists: ${tc || 0} | Salons: ${sc || 0}`);
    }
}

check();
