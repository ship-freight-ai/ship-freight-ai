
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

const users = [
    {
        email: 'test-shipper@shipai.com',
        password: 'TestShip123!',
        role: 'shipper',
        company_name: 'Test Shipper LLC',
        full_name: 'John Shipper'
    },
    {
        email: 'test-carrier@shipai.com',
        password: 'TestCarrier123!',
        role: 'carrier',
        company_name: 'Test Carrier Inc',
        full_name: 'Jane Carrier'
    }
];

async function main() {
    console.log('Checking test users...');

    for (const user of users) {
        const { data: existingUsers, error: searchError } = await supabase.auth.admin.listUsers();

        if (searchError) {
            console.error('Error listing users:', searchError);
            continue;
        }

        const existingUser = existingUsers.users.find(u => u.email === user.email);

        if (existingUser) {
            console.log(`User ${user.email} already exists. Updating password to be sure...`);
            await supabase.auth.admin.updateUserById(existingUser.id, { password: user.password });
        } else {
            console.log(`Creating user ${user.email}...`);
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: {
                    role: user.role,
                    company_name: user.company_name,
                    full_name: user.full_name
                }
            });

            if (createError) {
                console.error(`Error creating user ${user.email}:`, createError);
                continue;
            }

            console.log(`User ${user.email} created.`);

            // Create profile and role
            // Note: Triggers might handle this, but let's be safe if we need to manually insert
        }
    }

    // Also verify profiles and subscriptions directly if needed, but let's rely on app logic or triggers first.
    console.log('Done.');
}

main();
