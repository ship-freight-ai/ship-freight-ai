import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserData() {
    console.log('Checking test user data...\n');

    // Get all users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error listing users:', authError);
        return;
    }

    console.log(`Found ${authUsers.users.length} auth users:`);
    authUsers.users.forEach(u => console.log(`  - ${u.email} (${u.id})`));

    // Check profiles
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');

    console.log(`\nProfiles: ${profiles?.length || 0}`);
    if (profiles) profiles.forEach(p => console.log(`  - ${p.email} (${p.role})`));

    // Check subscriptions
    const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*');

    console.log(`\nSubscriptions: ${subscriptions?.length || 0}`);
    if (subscriptions) subscriptions.forEach(s => console.log(`  - User ${s.user_id}: ${s.status}, ${s.seats} seats`));

    // Check carriers
    const { data: carriers, error: carrierError } = await supabase
        .from('carriers')
        .select('*');

    console.log(`\nCarriers: ${carriers?.length || 0}`);
    if (carriers) carriers.forEach(c => console.log(`  - ${c.company_name}`));
}

checkUserData();
