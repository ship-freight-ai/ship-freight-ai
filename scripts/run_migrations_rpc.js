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

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    db: {
        schema: 'public',
    },
});

async function runMigrationsViaRPC() {
    try {
        const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        console.log(`Found ${files.length} migration files`);
        console.log('Running migrations via Supabase REST API...\n');

        for (const file of files) {
            console.log(`Running: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            // Split SQL into individual statements
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i] + ';';

                try {
                    const { data, error } = await supabase.rpc('exec_sql', { sql_string: statement });

                    if (error) {
                        console.error(`  Error in statement ${i + 1}:`, error.message);
                    }
                } catch (err) {
                    console.error(`  Error in statement ${i + 1}:`, err.message);
                }
            }

            console.log(`  ✓ Completed\n`);
        }

        console.log('All migrations processed!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

runMigrationsViaRPC();
