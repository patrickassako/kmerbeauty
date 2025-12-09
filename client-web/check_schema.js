
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    // Check therapists table
    const { data: therapists, error: tError } = await supabase
        .from('therapists')
        .select('*')
        .limit(1);

    if (tError) {
        console.log('therapists table error:', tError.message);
    } else if (therapists && therapists.length > 0) {
        console.log('therapists keys:', Object.keys(therapists[0]));
    } else {
        console.log('therapists table exists but empty');
    }
}

checkSchema();
```
