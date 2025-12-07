import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function insertTestData() {
    try {
        const now = new Date();
        const oneYearFromNow = new Date(now);
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        const users = [
            {
                id: '96a65e92-cdf6-4052-b444-195f3298241e',
                email: 'test-shipper@shipai.com',
                role: 'shipper',
                fullName: 'Test Shipper',
                companyName: 'Test Shipping Co',
                planType: 'shipper'
            },
            {
                id: '66bd1e32-82b6-4a90-b4ab-f6fb873295f8',
                email: 'test-carrier@shipai.com',
                role: 'carrier',
                fullName: 'Test Carrier',
                companyName: 'Test Carrier LLC',
                planType: 'carrier'
            },
        ];

        for (const user of users) {
            console.log(`\nProcessing ${user.email}...`);

            // Insert profile using upsert
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    user_id: user.id,
                    email: user.email,
                    full_name: user.fullName,
                    company_name: user.companyName,
                    role: user.role,
                }, { onConflict: 'user_id' })
                .select()
                .single();

            if (profileError) {
                console.error(`❌ Profile error:`, profileError);
            } else {
                console.log(`✓ Profile created`);
            }

            // Insert subscription using upsert
            const { data: subscription, error: subError } = await supabaseAdmin
                .from('subscriptions')
                .upsert({
                    user_id: user.id,
                    stripe_customer_id: `cus_trial_${user.id.substring(0, 8)}`,
                    stripe_subscription_id: `sub_trial_${user.id.substring(0, 8)}`,
                    plan_type: user.planType,
                    billing_cycle: 'annual',
                    seats: 5,
                    status: 'trialing',
                    current_period_start: now.toISOString(),
                    current_period_end: oneYearFromNow.toISOString(),
                    trial_start: now.toISOString(),
                    trial_end: oneYearFromNow.toISOString(),
                    cancel_at_period_end: false,
                }, { onConflict: 'user_id' })
                .select()
                .single();

            if (subError) {
                console.error(`❌ Subscription error:`, subError);
            } else {
                console.log(`✓ Subscription created (trial until ${oneYearFromNow.toISOString().split('T')[0]})`);
            }

            // If carrier, create carrier profile
            if (user.role === 'carrier') {
                const { data: carrier, error: carrierError } = await supabaseAdmin
                    .from('carriers')
                    .upsert({
                        user_id: user.id,
                        company_name: user.companyName,
                        dot_number: '123456',
                        mc_number: 'MC123456',
                        equipment_types: ['dry_van', 'reefer', 'flatbed'],
                        service_areas: ['CA', 'NV', 'AZ', 'TX'],
                        capacity: 10,
                        rating: 5.0,
                        total_loads: 0,
                        on_time_percentage: 100,
                        verification_status: 'verified',
                        insurance_amount: 1000000,
                        insurance_expiry: oneYearFromNow.toISOString().split('T')[0],
                    }, { onConflict: 'user_id' })
                    .select()
                    .single();

                if (carrierError) {
                    console.error(`❌ Carrier error:`, carrierError);
                } else {
                    console.log(`✓ Carrier profile created`);
                }
            }
        }

        console.log('\n✅ All test data inserted successfully!');
        console.log('\nYou can now log in and test:');
        console.log('  Shipper: test-shipper@shipai.com / TestShip123!');
        console.log('  Carrier: test-carrier@shipai.com / TestCarrier123!');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

insertTestData();
