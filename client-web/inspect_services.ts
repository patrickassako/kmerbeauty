
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yogfmkyfpfucbozlvwja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZ2Zta3lmcGZ1Y2Jvemx2d2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTg2NDIsImV4cCI6MjA3ODQ3NDY0Mn0.rPooBNTnmhRNN4OFQiBEkVxvOQ6vp1CvwXeVYwctZcY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectServices() {
    console.log("--- Services ---");
    const { data: services, error: servicesError } = await supabase.from('services').select('*').limit(1);
    if (servicesError) console.error(servicesError);
    else console.log(JSON.stringify(services, null, 2));

    console.log("\n--- Salon Services ---");
    const { data: salonServices, error: salonServicesError } = await supabase.from('salon_services').select('*').limit(1);
    if (salonServicesError) console.error(salonServicesError);
    else console.log(JSON.stringify(salonServices, null, 2));

    console.log("\n--- Test Join Query ---");
    // Try to fetch salons that have a service with category 'HAIR_CARE' (example)
    // We need to know a valid category first.
    // Let's assume 'HAIR_CARE' exists based on mobile app code.

    const { data: joinData, error: joinError } = await supabase
        .from('salons')
        .select('id, name_fr, salon_services!inner(service:services!inner(category))')
        .eq('salon_services.service.category', 'HAIR_CARE')
        .limit(1);

    if (joinError) {
        console.error("Join Error:", joinError);
    } else {
        console.log("Join Data:", JSON.stringify(joinData, null, 2));
    }
}

inspectServices();
