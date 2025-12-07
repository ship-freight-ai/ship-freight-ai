import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createUsersDirectSQL() {
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
        // Insert profile
        const profileSQL = `
      INSERT INTO public.profiles (user_id, email, full_name, company_name, role)
      VALUES ('${user.id}', '${user.email}', '${user.fullName}', '${user.companyName}', '${user.role}')
      ON CONFLICT (user_id) DO NOTHING;
    `;

        // Insert subscription
        const subscriptionSQL = `
      INSERT INTO public.subscriptions (
        user_id, stripe_customer_id, stripe_subscription_id, plan_type, 
        billing_cycle, seats, status, current_period_start, current_period_end,
        trial_start, trial_end, cancel_at_period_end
      )
      VALUES (
        '${user.id}', 
        'cus_trial_${user.id.substring(0, 8)}',
        'sub_trial_${user.id.substring(0, 8)}',
        '${user.planType}',
        'annual',
        5,
        'trialing',
        '${now.toISOString()}',
        '${oneYearFromNow.toISOString()}',
        '${now.toISOString()}',
        '${oneYearFromNow.toISOString()}',
        false
      )
      ON CONFLICT (user_id) DO NOTHING;
    `;

        console.log(`Creating profile and subscription for ${user.email}...`);

        // Execute via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql: profileSQL + subscriptionSQL })
        });

        if (!response.ok) {
            console.log(`Error: ${await response.text()}`);
        } else {
            console.log(`✓ Created for ${user.email}`);
        }

        // If carrier, create carrier profile
        if (user.role === 'carrier') {
            const carrierSQL = `
        INSERT INTO public.carriers (
          user_id, company_name, dot_number, mc_number, equipment_types,
          service_areas, capacity, rating, total_loads, on_time_percentage,
          verification_status, insurance_amount, insurance_expiry
        )
        VALUES (
          '${user.id}',
          '${user.companyName}',
          '123456',
          'MC123456',
          ARRAY['dry_van', 'reefer', 'flatbed']::equipment_type[],
          ARRAY['CA', 'NV', 'AZ', 'TX'],
          10,
          5.0,
          0,
          100,
          'verified',
          1000000,
          '${oneYearFromNow.toISOString().split('T')[0]}'
        )
        ON CONFLICT (user_id) DO NOTHING;
      `;

            const carrierResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql: carrierSQL })
            });

            if (!carrierResponse.ok) {
                console.log(`Carrier error: ${await carrierResponse.text()}`);
            } else {
                console.log(`✓ Created carrier profile`);
            }
        }
    }

    console.log('\n=== TEST USER CREDENTIALS ===');
    console.log('\nSHIPPER:');
    console.log('  Email: test-shipper@shipai.com');
    console.log('  Password: TestShip123!');
    console.log(`  Trial ends: ${oneYearFromNow.toISOString()}`);
    console.log('  Seats: 5');
    console.log('\nCARRIER:');
    console.log('  Email: test-carrier@shipai.com');
    console.log('  Password: TestCarrier123!');
    console.log(`  Trial ends: ${oneYearFromNow.toISOString()}`);
    console.log('  Seats: 5');
}

createUsersDirectSQL();
