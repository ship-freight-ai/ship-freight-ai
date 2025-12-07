import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function runMigrations() {
    try {
        const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        console.log(`Found ${files.length} migration files`);

        for (const file of files) {
            console.log(`Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            const { error } = await supabaseAdmin.rpc('exec_sql', { sql_string: sql });

            if (error) {
                console.error(`Error running ${file}:`, error);
                // Continue with next migration
            } else {
                console.log(`✓ ${file} completed`);
            }
        }

        console.log('All migrations completed!');
    } catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1);
    }
}

runMigrations();
