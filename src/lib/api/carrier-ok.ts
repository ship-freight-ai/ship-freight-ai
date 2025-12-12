/**
 * Mock CarrierOK API Service
 * 
 * This simulates the CarrierOK API for testing the Velvet Rope onboarding flow.
 * Replace with real API calls when you have the production key.
 */

export interface CarrierAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
}

export interface CarrierProfile {
    mc_number: string;
    legal_name: string;
    dba_name: string;
    address: CarrierAddress;

    // The Golden Metrics for Velvet Rope validation
    authority_status: 'ACTIVE' | 'INACTIVE';
    original_grant_date: string; // ISO Date "YYYY-MM-DD"
    reported_truck_count: number;
    safety_rating: 'SATISFACTORY' | 'NONE' | 'UNSATISFACTORY';

    // Identity Data
    contact_email: string;
    contact_phone: string;
    recent_contact_changes: boolean; // True if changed < 30 days ago (fraud risk)
    insurance_agent_email: string; // For the fallback verification path
}

export interface VelvetRopeResult {
    passed: boolean;
    gates: {
        age: { passed: boolean; value: number; required: number };
        size: { passed: boolean; value: number; required: number };
        safety: { passed: boolean; value: string; blocked: string[] };
        stability: { passed: boolean; value: boolean };
    };
    failedReasons: string[];
}

/**
 * Calculate the age of carrier authority in years
 */
function calculateAuthorityAge(grantDate: string): number {
    const grant = new Date(grantDate);
    const today = new Date();
    const diffMs = today.getTime() - grant.getTime();
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffYears * 10) / 10; // One decimal place
}

/**
 * Validate carrier against Velvet Rope criteria
 */
export function validateVelvetRope(profile: CarrierProfile): VelvetRopeResult {
    const authorityAge = calculateAuthorityAge(profile.original_grant_date);

    const gates = {
        age: {
            passed: authorityAge >= 4,
            value: authorityAge,
            required: 4,
        },
        size: {
            passed: profile.reported_truck_count >= 5,
            value: profile.reported_truck_count,
            required: 5,
        },
        safety: {
            passed: profile.safety_rating !== 'UNSATISFACTORY',
            value: profile.safety_rating,
            blocked: ['UNSATISFACTORY'],
        },
        stability: {
            passed: !profile.recent_contact_changes,
            value: profile.recent_contact_changes,
        },
    };

    const failedReasons: string[] = [];

    if (!gates.age.passed) {
        failedReasons.push(`Authority must be at least 4 years old (yours: ${authorityAge.toFixed(1)} years)`);
    }
    if (!gates.size.passed) {
        failedReasons.push(`Carrier must have at least 5 power units (yours: ${profile.reported_truck_count})`);
    }
    if (!gates.safety.passed) {
        failedReasons.push(`Safety rating cannot be UNSATISFACTORY (yours: ${profile.safety_rating})`);
    }
    if (!gates.stability.passed) {
        failedReasons.push('Contact information was changed recently (within 30 days) - this is a fraud risk indicator');
    }

    return {
        passed: failedReasons.length === 0,
        gates,
        failedReasons,
    };
}

/**
 * Mock CarrierOK API - Lookup carrier by MC number
 * 
 * Test Cases:
 * - 777777: Elite Partner (passes all gates)
 * - 111111: Too Small (only 1 truck)
 * - 999999: Fraud Risk (recent contact changes)
 * - 222222: Too New (authority < 4 years)
 * - 333333: Unsafe (unsatisfactory rating)
 */
export async function getCarrierProfile(mc: string): Promise<CarrierProfile> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1200));

    // Normalize MC number (remove leading zeros, spaces, etc.)
    const normalizedMC = mc.replace(/\D/g, '');

    // ========================================
    // TEST CASE 1: The "Elite Partner" (Passes All Gates)
    // ========================================
    if (normalizedMC === '777777') {
        return {
            mc_number: '777777',
            legal_name: 'TITAN FREIGHT SYSTEMS LLC',
            dba_name: 'Titan Logistics',
            address: { street: '100 Main St', city: 'Dallas', state: 'TX', zip: '75001' },
            authority_status: 'ACTIVE',
            original_grant_date: '2015-05-20', // > 4 Years ✅
            reported_truck_count: 45,          // > 5 Trucks ✅
            safety_rating: 'SATISFACTORY',     // Not UNSATISFACTORY ✅
            contact_email: 'dispatch@titanfreight.com',
            contact_phone: '214-555-0100',
            recent_contact_changes: false,     // Stable ✅
            insurance_agent_email: 'certs@progressive.com',
        };
    }

    // ========================================
    // TEST CASE 2: The "Too Small" Carrier (Fails Size Gate)
    // ========================================
    if (normalizedMC === '111111') {
        return {
            mc_number: '111111',
            legal_name: 'SOLO TRANS INC',
            dba_name: '',
            address: { street: '12 Home Ln', city: 'Miami', state: 'FL', zip: '33101' },
            authority_status: 'ACTIVE',
            original_grant_date: '2018-01-01', // Age OK ✅
            reported_truck_count: 1,           // FAIL ❌ (< 5)
            safety_rating: 'NONE',
            contact_email: 'solo@gmail.com',
            contact_phone: '305-555-1234',
            recent_contact_changes: false,
            insurance_agent_email: 'agent@geico.com',
        };
    }

    // ========================================
    // TEST CASE 3: The "Fraud/Identity Theft" Risk (Fails Stability Gate)
    // ========================================
    if (normalizedMC === '999999') {
        return {
            mc_number: '999999',
            legal_name: 'SUSPICIOUS CARRIER LLC',
            dba_name: '',
            address: { street: '404 Fake St', city: 'Nowhere', state: 'NV', zip: '89000' },
            authority_status: 'ACTIVE',
            original_grant_date: '2010-01-01', // Age OK ✅
            reported_truck_count: 10,          // Size OK ✅
            safety_rating: 'SATISFACTORY',     // Safety OK ✅
            contact_email: 'hacker@scam.com',
            contact_phone: '555-000-0000',
            recent_contact_changes: true,      // FAIL ❌ (Changed recently)
            insurance_agent_email: 'unknown@gmail.com',
        };
    }

    // ========================================
    // TEST CASE 4: The "Too New" Carrier (Fails Age Gate)
    // ========================================
    if (normalizedMC === '222222') {
        return {
            mc_number: '222222',
            legal_name: 'NEWBIE TRUCKING LLC',
            dba_name: 'Fresh Haul',
            address: { street: '500 Startup Ave', city: 'Austin', state: 'TX', zip: '78701' },
            authority_status: 'ACTIVE',
            original_grant_date: '2023-06-15', // FAIL ❌ (< 4 years)
            reported_truck_count: 8,           // Size OK ✅
            safety_rating: 'NONE',
            contact_email: 'dispatch@newbie.com',
            contact_phone: '512-555-8000',
            recent_contact_changes: false,
            insurance_agent_email: 'agent@statefarm.com',
        };
    }

    // ========================================
    // TEST CASE 5: The "Unsafe" Carrier (Fails Safety Gate)
    // ========================================
    if (normalizedMC === '333333') {
        return {
            mc_number: '333333',
            legal_name: 'RISKY HAULERS INC',
            dba_name: '',
            address: { street: '666 Danger Rd', city: 'Detroit', state: 'MI', zip: '48201' },
            authority_status: 'ACTIVE',
            original_grant_date: '2012-03-10', // Age OK ✅
            reported_truck_count: 15,          // Size OK ✅
            safety_rating: 'UNSATISFACTORY',   // FAIL ❌
            contact_email: 'unsafe@risky.com',
            contact_phone: '313-555-6666',
            recent_contact_changes: false,
            insurance_agent_email: 'agent@liability.com',
        };
    }

    // ========================================
    // TEST CASE 6: Inactive Authority
    // ========================================
    if (normalizedMC === '444444') {
        return {
            mc_number: '444444',
            legal_name: 'CLOSED CARRIER LLC',
            dba_name: '',
            address: { street: '0 Gone St', city: 'Memphis', state: 'TN', zip: '38101' },
            authority_status: 'INACTIVE',      // FAIL ❌
            original_grant_date: '2010-01-01',
            reported_truck_count: 20,
            safety_rating: 'SATISFACTORY',
            contact_email: 'closed@defunct.com',
            contact_phone: '901-555-0000',
            recent_contact_changes: false,
            insurance_agent_email: 'none@none.com',
        };
    }

    // Default: Carrier not found
    throw new Error(`Carrier with MC# ${mc} not found in FMCSA database`);
}

/**
 * Mock send OTP email
 */
export async function sendVerificationOTP(email: string): Promise<{ success: boolean; code: string }> {
    await new Promise(r => setTimeout(r, 500));

    // In production, this would actually send an email via Resend
    // For mock, we return a fixed code for testing
    const mockCode = '123456';

    console.log(`[MOCK] OTP sent to ${email}: ${mockCode}`);

    return { success: true, code: mockCode };
}

/**
 * Mock verify OTP
 */
export async function verifyOTP(email: string, code: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 300));

    // Accept 123456 as the valid mock code
    return code === '123456';
}

/**
 * Mock send insurance agent verification request
 */
export async function sendInsuranceAgentRequest(
    agentEmail: string,
    carrierName: string
): Promise<{ success: boolean }> {
    await new Promise(r => setTimeout(r, 500));

    console.log(`[MOCK] Insurance verification request sent to ${agentEmail} for ${carrierName}`);
    console.log(`[MOCK] Email content: "Please reply with the COI for ${carrierName}"`);

    return { success: true };
}
