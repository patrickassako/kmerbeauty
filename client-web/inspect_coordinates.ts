
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yogfmkyfpfucbozlvwja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZ2Zta3lmcGZ1Y2Jvemx2d2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTg2NDIsImV4cCI6MjA3ODQ3NDY0Mn0.rPooBNTnmhRNN4OFQiBEkVxvOQ6vp1CvwXeVYwctZcY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCoordinates() {
    console.log("--- Salons ---");
    const { data: salons, error: salonsError } = await supabase.from('salons').select('id, name, latitude, longitude').limit(1);
    if (salonsError) console.error(salonsError);
    else console.log(JSON.stringify(salons, null, 2));

    console.log("\n--- Therapists ---");
    const { data: therapists, error: therapistsError } = await supabase.from('therapists').select('id, latitude, longitude').limit(1);
    if (therapistsError) console.error(therapistsError);
    else console.log(JSON.stringify(therapists, null, 2));
}

inspectCoordinates();
