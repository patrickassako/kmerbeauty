
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yogfmkyfpfucbozlvwja.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZ2Zta3lmcGZ1Y2Jvemx2d2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTg2NDIsImV4cCI6MjA3ODQ3NDY0Mn0.rPooBNTnmhRNN4OFQiBEkVxvOQ6vp1CvwXeVYwctZcY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listCategories() {
    const { data, error } = await supabase
        .from('services')
        .select('category');

    if (error) {
        console.error(error);
    } else {
        // Get unique categories
        const categories = [...new Set(data.map(item => item.category))];
        console.log("Valid Categories:", categories);
    }
}

listCategories();
