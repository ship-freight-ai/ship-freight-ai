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

const logStep = (step, details) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[CREATE-TRIAL-USERS] ${step}${detailsStr}`);
};

async function createTrialUsers() {
    try {
        logStep("Starting creation of trial users with 1-year free trial");

        // Calculate 1 year from now
        const now = new Date();
        const oneYearFromNow = new Date(now);
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        // Test user credentials with 1-year free trial
        const testUsers = [
            {
                email: "test-shipper@shipai.com",
                password: "TestShip123!",
                role: "shipper",
                fullName: "Test Shipper",
                companyName: "Test Shipping Co",
                planType: "shipper"
            },
            {
                email: "test-carrier@shipai.com",
                password: "TestCarrier123!",
                role: "carrier",
                fullName: "Test Carrier",
                companyName: "Test Carrier LLC",
                planType: "carrier"
            },
        ];

        const createdUsers = [];

        // Create test users
        logStep("Creating test users with 1-year trial and 5 seats");
        for (const user of testUsers) {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: {
                    full_name: user.fullName,
                    role: user.role,
                }
            });

            if (authError) {
                logStep(`Error creating user ${user.email}`, { error: authError.message });
                continue;
            }

            logStep(`Created user: ${user.email}`, { id: authData.user.id });

            // Create profile
            const { error: profileError } = await supabaseAdmin
                .from("profiles")
                .insert({
                    user_id: authData.user.id,
                    email: user.email,
                    full_name: user.fullName,
                    company_name: user.companyName,
                    role: user.role,
                });

            if (profileError) {
                logStep(`Error creating profile for ${user.email}`, { error: profileError.message });
            }

            // Create subscription with 1-year free trial and 5 seats
            const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
                .from("subscriptions")
                .insert({
                    user_id: authData.user.id,
                    stripe_customer_id: `cus_trial_${authData.user.id.substring(0, 8)}`,
                    stripe_subscription_id: `sub_trial_${authData.user.id.substring(0, 8)}`,
                    plan_type: user.planType,
                    billing_cycle: "annual",
                    seats: 5,
                    seats_used: 1,
                    status: "trialing",
                    current_period_start: now.toISOString(),
                    current_period_end: oneYearFromNow.toISOString(),
                    trial_start: now.toISOString(),
                    trial_end: oneYearFromNow.toISOString(),
                    cancel_at_period_end: false,
                })
                .select()
                .single();

            if (subscriptionError) {
                logStep(`Error creating subscription for ${user.email}`, { error: subscriptionError.message });
            } else {
                logStep(`Created 1-year trial subscription for ${user.email}`, {
                    subscriptionId: subscriptionData?.id,
                    trialEnd: oneYearFromNow.toISOString(),
                    seats: 5
                });

                // Update profile with subscription_id
                await supabaseAdmin
                    .from("profiles")
                    .update({ subscription_id: subscriptionData.id })
                    .eq("user_id", authData.user.id);
            }

            // Create carrier profile if carrier
            if (user.role === "carrier") {
                const { error: carrierError } = await supabaseAdmin.from("carriers").insert({
                    user_id: authData.user.id,
                    company_name: user.companyName,
                    dot_number: "123456",
                    mc_number: "MC123456",
                    equipment_types: ["dry_van", "reefer", "flatbed"],
                    service_areas: ["CA", "NV", "AZ", "TX"],
                    capacity: 10,
                    rating: 5.0,
                    total_loads: 0,
                    on_time_percentage: 100,
                    verification_status: "verified",
                    insurance_amount: 1000000,
                    insurance_expiry: oneYearFromNow.toISOString().split('T')[0],
                });

                if (carrierError) {
                    logStep(`Error creating carrier profile`, { error: carrierError.message });
                }
            }

            createdUsers.push({ ...user, id: authData.user.id });
        }

        logStep("Trial users created successfully");
        console.log("\n=== TEST USER CREDENTIALS ===");
        testUsers.forEach(u => {
            console.log(`\n${u.role.toUpperCase()}:`);
            console.log(`  Email: ${u.email}`);
            console.log(`  Password: ${u.password}`);
            console.log(`  Trial ends: ${oneYearFromNow.toISOString()}`);
            console.log(`  Seats: 5`);
        });

    } catch (error) {
        console.error("ERROR in create-trial-users:", error);
        process.exit(1);
    }
}

createTrialUsers();
