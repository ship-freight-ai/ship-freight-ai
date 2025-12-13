/**
 * CarrierOK API Service
 * 
 * Handles carrier lookup by MC or DOT number.
 * Supports both mock mode (for testing) and real API mode.
 * 
 * API Documentation: https://docs.carrier-ok.com/
 */

// Environment config - set CARRIER_OK_USE_MOCK=false for production
const USE_MOCK = import.meta.env.VITE_CARRIER_OK_USE_MOCK !== 'false';
const API_KEY = import.meta.env.VITE_CARRIER_OK_API_KEY || '';
const API_BASE_URL = 'https://api.carrier-ok.com/v1';

// ============================================
// Types matching CarrierOK API response
// ============================================

export interface CarrierOKAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
}

export interface CarrierOKProfile {
    // Identifiers
    dot_number: string;
    mc_number: string | null;
    legal_name: string;
    dba_name: string | null;

    // Authority info
    authority_status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | null;
    authority_granted_date: string | null; // ISO date
    carrier_operation: string | null; // Interstate, Intrastate

    // Safety
    safety_rating: 'SATISFACTORY' | 'UNSATISFACTORY' | 'CONDITIONAL' | 'NONE' | null;
    safety_rating_date: string | null;

    // Fleet info
    safer_trucks: number | null;
    safer_drivers: number | null;

    // Insurance
    insurance_type: string | null;
    insurance_coverage_amount: number | null;
    insurance_effective_date: string | null;
    insurance_expiration_date: string | null;
    insurance_policy_number: string | null;

    // Contact
    contact_email: string | null;
    contact_phone: string | null;

    // Address
    address: CarrierOKAddress;

    // Compliance
    out_of_service: boolean;
    out_of_service_date: string | null;
}

// ============================================
// Validation Types
// ============================================

export interface ValidationGate {
    id: string;
    label: string;
    passed: boolean;
    message: string;
    value?: string | number | null;
}

export interface ValidationResult {
    passed: boolean;
    gates: ValidationGate[];
    failedReasons: string[];
}

// ============================================
// Validation Logic
// ============================================

const MIN_INSURANCE_COVERAGE = 750000; // $750k minimum

export function validateCarrier(profile: CarrierOKProfile): ValidationResult {
    const gates: ValidationGate[] = [];
    const failedReasons: string[] = [];

    // Gate 1: Authority must be ACTIVE
    const authorityPassed = profile.authority_status === 'ACTIVE';
    gates.push({
        id: 'authority',
        label: 'Operating Authority',
        passed: authorityPassed,
        message: authorityPassed
            ? `Authority is ${profile.authority_status}`
            : `Authority is ${profile.authority_status || 'UNKNOWN'} (must be ACTIVE)`,
        value: profile.authority_status,
    });
    if (!authorityPassed) {
        failedReasons.push('Your operating authority must be ACTIVE to use our platform.');
    }

    // Gate 2: Insurance coverage minimum
    const insuranceAmount = profile.insurance_coverage_amount || 0;
    const insurancePassed = insuranceAmount >= MIN_INSURANCE_COVERAGE;
    gates.push({
        id: 'insurance_coverage',
        label: 'Insurance Coverage',
        passed: insurancePassed,
        message: insurancePassed
            ? `$${insuranceAmount.toLocaleString()} coverage`
            : `$${insuranceAmount.toLocaleString()} (minimum $${(MIN_INSURANCE_COVERAGE / 1000)}k required)`,
        value: insuranceAmount,
    });
    if (!insurancePassed) {
        failedReasons.push(`Minimum insurance coverage of $${(MIN_INSURANCE_COVERAGE / 1000).toLocaleString()}k is required.`);
    }

    // Gate 3: Insurance not expired
    const today = new Date();
    const expiryDate = profile.insurance_expiration_date
        ? new Date(profile.insurance_expiration_date)
        : null;
    const insuranceActive = expiryDate ? expiryDate > today : false;
    gates.push({
        id: 'insurance_active',
        label: 'Insurance Status',
        passed: insuranceActive,
        message: insuranceActive
            ? `Valid until ${expiryDate?.toLocaleDateString()}`
            : expiryDate
                ? `Expired on ${expiryDate.toLocaleDateString()}`
                : 'No insurance expiration date on file',
        value: profile.insurance_expiration_date,
    });
    if (!insuranceActive) {
        failedReasons.push('Your insurance must be current and not expired.');
    }

    // Gate 4: Safety rating not UNSATISFACTORY
    const safetyPassed = profile.safety_rating !== 'UNSATISFACTORY';
    gates.push({
        id: 'safety',
        label: 'Safety Rating',
        passed: safetyPassed,
        message: safetyPassed
            ? profile.safety_rating || 'No rating (OK)'
            : `${profile.safety_rating} rating not acceptable`,
        value: profile.safety_rating,
    });
    if (!safetyPassed) {
        failedReasons.push('Carriers with UNSATISFACTORY safety ratings cannot use our platform.');
    }

    // Gate 5: Not out of service
    const notOutOfService = !profile.out_of_service;
    gates.push({
        id: 'out_of_service',
        label: 'Operating Status',
        passed: notOutOfService,
        message: notOutOfService
            ? 'Not out of service'
            : `Out of service since ${profile.out_of_service_date || 'unknown date'}`,
        value: profile.out_of_service ? 'OUT OF SERVICE' : 'ACTIVE',
    });
    if (!notOutOfService) {
        failedReasons.push('Your carrier is currently out of service.');
    }

    return {
        passed: failedReasons.length === 0,
        gates,
        failedReasons,
    };
}

// ============================================
// API Functions
// ============================================

/**
 * Normalize identifier input (MC or DOT)
 */
export function normalizeIdentifier(input: string): { type: 'mc' | 'dot'; value: string } {
    const cleaned = input.replace(/\s/g, '').toUpperCase();

    // Check if it starts with MC or DOT prefix
    if (cleaned.startsWith('MC-') || cleaned.startsWith('MC')) {
        const value = cleaned.replace(/^MC-?/, '');
        return { type: 'mc', value };
    }

    if (cleaned.startsWith('DOT-') || cleaned.startsWith('DOT')) {
        const value = cleaned.replace(/^DOT-?/, '');
        return { type: 'dot', value };
    }

    // Default: if it's 7+ digits, assume DOT; otherwise assume MC
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length >= 7) {
        return { type: 'dot', value: digits };
    }

    return { type: 'mc', value: digits };
}

/**
 * Lookup carrier by MC or DOT number
 */
export async function lookupCarrier(identifier: string): Promise<CarrierOKProfile> {
    const { type, value } = normalizeIdentifier(identifier);

    if (USE_MOCK) {
        return lookupCarrierMock(type, value);
    }

    return lookupCarrierReal(type, value);
}

/**
 * Real API call to CarrierOK
 */
async function lookupCarrierReal(type: 'mc' | 'dot', value: string): Promise<CarrierOKProfile> {
    if (!API_KEY) {
        throw new Error('CarrierOK API key not configured');
    }

    const endpoint = type === 'mc'
        ? `${API_BASE_URL}/profiles/mc/${value}`
        : `${API_BASE_URL}/profiles/dot/${value}`;

    const response = await fetch(endpoint, {
        headers: {
            'X-Api-Key': API_KEY,
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Carrier with ${type.toUpperCase()}-${value} not found`);
        }
        throw new Error(`API error: ${response.status}`);
    }

    return response.json();
}

// ============================================
// Mock Data for Testing
// ============================================

async function lookupCarrierMock(type: 'mc' | 'dot', value: string): Promise<CarrierOKProfile> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    const mockData = getMockCarrier(value);
    if (!mockData) {
        throw new Error(`Carrier with ${type.toUpperCase()}-${value} not found in FMCSA database`);
    }

    return mockData;
}

function getMockCarrier(identifier: string): CarrierOKProfile | null {
    const mocks: Record<string, CarrierOKProfile> = {
        // ✅ PASS: Active, insured, safe carrier
        '777777': {
            dot_number: '1234567',
            mc_number: '777777',
            legal_name: 'TITAN FREIGHT SYSTEMS LLC',
            dba_name: 'Titan Logistics',
            authority_status: 'ACTIVE',
            authority_granted_date: '2018-05-20',
            carrier_operation: 'Interstate',
            safety_rating: 'SATISFACTORY',
            safety_rating_date: '2022-03-15',
            safer_trucks: 45,
            safer_drivers: 52,
            insurance_type: 'Liability',
            insurance_coverage_amount: 1000000,
            insurance_effective_date: '2024-01-01',
            insurance_expiration_date: '2025-12-31',
            insurance_policy_number: 'POL-123456',
            contact_email: 'dispatch@titanfreight.com',
            contact_phone: '214-555-0100',
            address: { street: '100 Main St', city: 'Dallas', state: 'TX', zip: '75001' },
            out_of_service: false,
            out_of_service_date: null,
        },
        '1234567': {
            dot_number: '1234567',
            mc_number: '777777',
            legal_name: 'TITAN FREIGHT SYSTEMS LLC',
            dba_name: 'Titan Logistics',
            authority_status: 'ACTIVE',
            authority_granted_date: '2018-05-20',
            carrier_operation: 'Interstate',
            safety_rating: 'SATISFACTORY',
            safety_rating_date: '2022-03-15',
            safer_trucks: 45,
            safer_drivers: 52,
            insurance_type: 'Liability',
            insurance_coverage_amount: 1000000,
            insurance_effective_date: '2024-01-01',
            insurance_expiration_date: '2025-12-31',
            insurance_policy_number: 'POL-123456',
            contact_email: 'dispatch@titanfreight.com',
            contact_phone: '214-555-0100',
            address: { street: '100 Main St', city: 'Dallas', state: 'TX', zip: '75001' },
            out_of_service: false,
            out_of_service_date: null,
        },

        // ✅ PASS: Small but legit carrier (owner-operator)
        '111111': {
            dot_number: '2345678',
            mc_number: '111111',
            legal_name: 'SOLO TRANSPORT LLC',
            dba_name: null,
            authority_status: 'ACTIVE',
            authority_granted_date: '2022-01-15',
            carrier_operation: 'Interstate',
            safety_rating: 'NONE',
            safety_rating_date: null,
            safer_trucks: 1,
            safer_drivers: 1,
            insurance_type: 'Liability',
            insurance_coverage_amount: 750000,
            insurance_effective_date: '2024-06-01',
            insurance_expiration_date: '2025-05-31',
            insurance_policy_number: 'SOLO-789',
            contact_email: 'john@solotransport.com',
            contact_phone: '305-555-1234',
            address: { street: '12 Home Ln', city: 'Miami', state: 'FL', zip: '33101' },
            out_of_service: false,
            out_of_service_date: null,
        },

        // ❌ FAIL: Authority INACTIVE
        '999999': {
            dot_number: '9999999',
            mc_number: '999999',
            legal_name: 'DEFUNCT TRUCKING INC',
            dba_name: null,
            authority_status: 'INACTIVE',
            authority_granted_date: '2015-01-01',
            carrier_operation: 'Interstate',
            safety_rating: 'SATISFACTORY',
            safety_rating_date: '2020-01-01',
            safer_trucks: 10,
            safer_drivers: 12,
            insurance_type: 'Liability',
            insurance_coverage_amount: 1000000,
            insurance_effective_date: '2024-01-01',
            insurance_expiration_date: '2024-12-31',
            insurance_policy_number: 'DEF-111',
            contact_email: 'closed@defunct.com',
            contact_phone: '555-000-0000',
            address: { street: '404 Gone St', city: 'Nowhere', state: 'NV', zip: '89000' },
            out_of_service: false,
            out_of_service_date: null,
        },

        // ❌ FAIL: Insurance expired
        '888888': {
            dot_number: '8888888',
            mc_number: '888888',
            legal_name: 'LAPSED INSURANCE LLC',
            dba_name: null,
            authority_status: 'ACTIVE',
            authority_granted_date: '2019-06-01',
            carrier_operation: 'Interstate',
            safety_rating: 'SATISFACTORY',
            safety_rating_date: '2021-08-15',
            safer_trucks: 8,
            safer_drivers: 10,
            insurance_type: 'Liability',
            insurance_coverage_amount: 1000000,
            insurance_effective_date: '2023-01-01',
            insurance_expiration_date: '2023-12-31', // Expired!
            insurance_policy_number: 'LAPSED-222',
            contact_email: 'renew@lapsed.com',
            contact_phone: '800-555-2222',
            address: { street: '200 Overdue Ave', city: 'Chicago', state: 'IL', zip: '60601' },
            out_of_service: false,
            out_of_service_date: null,
        },

        // ❌ FAIL: UNSATISFACTORY safety rating
        '333333': {
            dot_number: '3333333',
            mc_number: '333333',
            legal_name: 'RISKY HAULERS INC',
            dba_name: null,
            authority_status: 'ACTIVE',
            authority_granted_date: '2016-03-10',
            carrier_operation: 'Interstate',
            safety_rating: 'UNSATISFACTORY',
            safety_rating_date: '2023-11-01',
            safer_trucks: 15,
            safer_drivers: 18,
            insurance_type: 'Liability',
            insurance_coverage_amount: 1000000,
            insurance_effective_date: '2024-01-01',
            insurance_expiration_date: '2025-12-31',
            insurance_policy_number: 'RISKY-333',
            contact_email: 'unsafe@risky.com',
            contact_phone: '313-555-6666',
            address: { street: '666 Danger Rd', city: 'Detroit', state: 'MI', zip: '48201' },
            out_of_service: false,
            out_of_service_date: null,
        },

        // ❌ FAIL: Low insurance coverage
        '555555': {
            dot_number: '5555555',
            mc_number: '555555',
            legal_name: 'UNDERINSURED TRANSPORT',
            dba_name: null,
            authority_status: 'ACTIVE',
            authority_granted_date: '2020-07-01',
            carrier_operation: 'Interstate',
            safety_rating: 'NONE',
            safety_rating_date: null,
            safer_trucks: 3,
            safer_drivers: 4,
            insurance_type: 'Liability',
            insurance_coverage_amount: 300000, // Only $300k
            insurance_effective_date: '2024-01-01',
            insurance_expiration_date: '2025-12-31',
            insurance_policy_number: 'LOW-555',
            contact_email: 'cheap@underinsured.com',
            contact_phone: '555-555-5555',
            address: { street: '500 Budget Blvd', city: 'Austin', state: 'TX', zip: '78701' },
            out_of_service: false,
            out_of_service_date: null,
        },

        // ❌ FAIL: Out of service
        '666666': {
            dot_number: '6666666',
            mc_number: '666666',
            legal_name: 'GROUNDED FLEET LLC',
            dba_name: null,
            authority_status: 'ACTIVE',
            authority_granted_date: '2017-02-15',
            carrier_operation: 'Interstate',
            safety_rating: 'CONDITIONAL',
            safety_rating_date: '2023-09-01',
            safer_trucks: 20,
            safer_drivers: 25,
            insurance_type: 'Liability',
            insurance_coverage_amount: 1000000,
            insurance_effective_date: '2024-01-01',
            insurance_expiration_date: '2025-12-31',
            insurance_policy_number: 'GND-666',
            contact_email: 'grounded@fleet.com',
            contact_phone: '666-666-6666',
            address: { street: '600 Parked Ln', city: 'Phoenix', state: 'AZ', zip: '85001' },
            out_of_service: true,
            out_of_service_date: '2024-01-15',
        },
    };

    return mocks[identifier] || null;
}
