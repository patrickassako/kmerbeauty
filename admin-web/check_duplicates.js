
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend directory
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    console.log('URL:', supabaseUrl);
    // Don't log the key for security, just check if it exists
    console.log('Key exists:', !!supabaseKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
    console.log('Checking for duplicates...');
    const { data, error } = await supabase
        .from('services')
        .select('name_fr, id');

    if (error) {
        console.error('Error fetching services:', error);
        return;
    }

    const counts = {};
    data.forEach((s) => {
        counts[s.name_fr] = (counts[s.name_fr] || 0) + 1;
    });

    const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);

    if (duplicates.length > 0) {
        console.log('Found duplicates:', duplicates);
        console.log('Example duplicate IDs for first match:');
        const firstDupName = duplicates[0][0];
        const ids = data.filter((s) => s.name_fr === firstDupName).map((s) => s.id);
        console.log(ids);
    } else {
        console.log('No duplicates found in DB.');
    }
    console.log('Total services:', data.length);
}

checkDuplicates();
