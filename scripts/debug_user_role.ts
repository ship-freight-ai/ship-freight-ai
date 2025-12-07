
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
    const email = 'test-carrier@shipai.com';
    console.log(`Checking data for ${email}...`);

    // Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error('User not found in auth.users');
        return;
    }
    console.log(`User ID: ${user.id}`);

    // Check public.profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (profileError) console.error('Error fetching profile:', profileError);
    console.log('Profile:', profile);

    // Check public.user_roles
    const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (roleError) console.error('Error fetching user_role:', roleError);
    console.log('User Role:', userRole);
}

main();
