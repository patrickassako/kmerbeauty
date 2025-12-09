
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yogfmkyfpfucbozlvwja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZ2Zta3lmcGZ1Y2Jvemx2d2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTg2NDIsImV4cCI6MjA3ODQ3NDY0Mn0.rPooBNTnmhRNN4OFQiBEkVxvOQ6vp1CvwXeVYwctZcY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSalons() {
    const { data, error } = await supabase.from('salons').select('*').limit(1);
    if (error) {
        console.error('Error fetching salons:', error);
    } else {
        console.log('Salons data:', JSON.stringify(data, null, 2));
    }
}

inspectSalons();
