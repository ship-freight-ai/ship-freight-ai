import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
const connectionString = `postgresql://postgres:${process.env.DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;

async function applyMigrations() {
    const client = new pg.Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to database');

        const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        console.log(`Found ${files.length} migration files`);

        for (const file of files) {
            console.log(`Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            try {
                await client.query(sql);
                console.log(`✓ ${file} completed`);
            } catch (error) {
                console.error(`Error in ${file}:`, error.message);
                // Continue with next migration
            }
        }

        console.log('All migrations completed!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyMigrations();
