import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    console.log('Checking database connection and tables...');
    try {
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Error querying profiles:', error.message);
            if (error.message.includes('relation "public.profiles" does not exist')) {
                console.log('Tables do NOT exist.');
                process.exit(2); // Tables missing
            } else {
                process.exit(1); // Other error
            }
        }

        console.log('Tables exist. Profile count:', count);
        process.exit(0); // Success
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

checkDb();
