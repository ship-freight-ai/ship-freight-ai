
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
    const usersToFix = [
        { email: 'test-shipper@shipai.com', role: 'shipper', full_name: 'John Shipper', company: 'Test Shipper LLC' },
        { email: 'test-carrier@shipai.com', role: 'carrier', full_name: 'Jane Carrier', company: 'Test Carrier Inc' }
    ];

    for (const u of usersToFix) {
        console.log(`Fixing data for ${u.email}...`);

        // 1. Get User ID
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
        const user = users?.find(user => user.email === u.email);

        if (!user) {
            console.error(`User ${u.email} not found.`);
            continue;
        }

        // 2. Fix Profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        if (!profile) {
            console.log(`Creating profile for ${u.email}...`);
            const { error: insertError } = await supabase.from('profiles').insert({
                user_id: user.id,
                role: u.role,
                full_name: u.full_name,
                company_name: u.company,
                email: u.email
            });
            if (insertError) console.error('Error inserting profile:', insertError);
        } else {
            console.log(`Profile exists for ${u.email}. Updating role...`);
            await supabase.from('profiles').update({ role: u.role }).eq('user_id', user.id);
        }

        // 3. Fix User Role
        // (Optional, triggers usually handle this based on profile, but let's be explicit if the table exists and is used)
        const { data: userRole } = await supabase.from('user_roles').select('*').eq('user_id', user.id).single();
        if (!userRole) {
            console.log(`Creating user_role for ${u.email}...`);
            const { error: roleInsertError } = await supabase.from('user_roles').insert({
                user_id: user.id,
                role: u.role
            });
            if (roleInsertError) {
                // It's possible user_roles might not allow direct insert if RLS/Trigger issues, or maybe it doesn't exist?
                // We verified it exists in previous step.
                console.error('Error inserting user_role:', roleInsertError);
            }
        }
    }
    console.log('Fix complete.');
}

main();
