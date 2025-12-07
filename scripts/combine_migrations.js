import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
const outputFile = path.resolve(__dirname, '../supabase/combined_migration.sql');

const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

let combined = '-- Combined migrations for Supabase\n';
combined += `-- Generated: ${new Date().toISOString()}\n`;
combined += `-- Total migrations: ${files.length}\n\n`;

for (const file of files) {
    combined += `\n-- ========================================\n`;
    combined += `-- Migration: ${file}\n`;
    combined += `-- ========================================\n\n`;

    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    combined += content;
    combined += '\n\n';
}

fs.writeFileSync(outputFile, combined);
console.log(`✓ Combined ${files.length} migrations into: ${outputFile}`);
console.log(`File size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
