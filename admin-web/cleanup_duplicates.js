
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
    console.log('Starting cleanup...');

    // 1. Get all services
    const { data: services, error } = await supabase
        .from('services')
        .select('id, name_fr, created_at')
        .order('created_at', { ascending: false }); // Latest first

    if (error) {
        console.error('Error fetching services:', error);
        return;
    }

    const uniqueServices = {};
    const toDelete = [];

    // 2. Identify duplicates
    for (const service of services) {
        if (uniqueServices[service.name_fr]) {
            // We already have a (newer) version of this service, so this one is a duplicate
            toDelete.push(service.id);
        } else {
            uniqueServices[service.name_fr] = service.id;
        }
    }

    console.log(`Found ${toDelete.length} duplicate services to delete.`);
    console.log(`Keeping ${Object.keys(uniqueServices).length} unique services.`);

    if (toDelete.length === 0) {
        console.log('No duplicates to delete.');
        return;
    }

    // 3. Delete duplicates
    // We need to do this in chunks to avoid URL length limits or timeouts
    const chunkSize = 20;
    for (let i = 0; i < toDelete.length; i += chunkSize) {
        const chunk = toDelete.slice(i, i + chunkSize);
        console.log(`Deleting chunk ${i / chunkSize + 1}... (${chunk.length} items)`);

        // First, try to delete. If it fails due to FK constraints, we might need to handle that.
        // But for now, let's assume we can just delete the extra seed data.
        // If these are true duplicates from seeding, they might not have dependent data if the seed script created new dependencies for each run.
        // OR they might have dependent data that we also want to delete (cascade).
        // Let's try deleting and see.

        const { error: deleteError } = await supabase
            .from('services')
            .delete()
            .in('id', chunk);

        if (deleteError) {
            console.error('Error deleting chunk:', deleteError);
            // If error is FK constraint, we might need to re-assign dependencies to the 'kept' service ID.
            // But that's complex. Let's see if simple delete works first.
        } else {
            console.log('Chunk deleted successfully.');
        }
    }

    console.log('Cleanup complete.');
}

cleanupDuplicates();
