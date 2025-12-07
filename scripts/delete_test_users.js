import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function deleteTestUsers() {
    try {
        const testEmails = ['test-shipper@shipai.com', 'test-carrier@shipai.com'];

        for (const email of testEmails) {
            // Get user by email
            const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

            if (error) {
                console.error('Error listing users:', error);
                continue;
            }

            const user = users.users.find(u => u.email === email);

            if (user) {
                console.log(`Deleting user: ${email} (${user.id})`);
                const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

                if (deleteError) {
                    console.error(`Error deleting ${email}:`, deleteError);
                } else {
                    console.log(`✓ Deleted ${email}`);
                }
            } else {
                console.log(`User not found: ${email}`);
            }
        }

        console.log('\nTest users deleted. Now run: node scripts/create_trial_users.js');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

deleteTestUsers();
