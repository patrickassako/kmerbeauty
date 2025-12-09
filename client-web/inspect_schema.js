
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

async function inspectSchema() {
    console.log('Fetching one salon to inspect structure...');

    // Try fetching just ID first to ensure connection
    const { data: basicData, error: basicError } = await supabase
        .from('salons')
        .select('id')
        .limit(1);

    if (basicError) {
        console.error('Basic fetch error:', basicError);
        return;
    }
    console.log('Connection successful.');

    // Now try fetching all columns for one row
    const { data, error } = await supabase
        .from('salons')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching *:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Sample Salon Keys:', Object.keys(data[0]));
            console.log('Sample Salon Data:', data[0]);
        } else {
            console.log('No salons found.');
        }
    }
}

inspectSchema();
