
export interface CarrierProfile {
    id: string;
    company_name: string;
    dot_number: string;
    mc_number: string;
    city: string;
    state: string;
    rating: number; // 0-5
    verified: boolean;
    reviews_count: number;
    equipment_types: string[];
    lanes: { origin: string; dest: string }[];
    fleet_size: number;
    years_in_business: number;
    insurance_active: boolean;
    contact_email: string;
    phone: string;
}

export const MOCK_CARRIERS: CarrierProfile[] = [
    {
        id: "c1",
        company_name: "Swift Logistics Pro",
        dot_number: "1234567",
        mc_number: "MC-987654",
        city: "Phoenix",
        state: "AZ",
        rating: 4.8,
        verified: true,
        reviews_count: 342,
        equipment_types: ["dry_van", "reefer"],
        lanes: [{ origin: "AZ", dest: "CA" }, { origin: "TX", dest: "NY" }],
        fleet_size: 150,
        years_in_business: 12,
        insurance_active: true,
        contact_email: "dispatch@swiftlogpro.com",
        phone: "(602) 555-0101"
    },
    {
        id: "c2",
        company_name: "Cold Chain Experts",
        dot_number: "2345678",
        mc_number: "MC-876543",
        city: "Chicago",
        state: "IL",
        rating: 4.9,
        verified: true,
        reviews_count: 156,
        equipment_types: ["reefer"],
        lanes: [{ origin: "IL", dest: "FL" }, { origin: "WA", dest: "IL" }],
        fleet_size: 45,
        years_in_business: 8,
        insurance_active: true,
        contact_email: "ops@coldchainexperts.com",
        phone: "(312) 555-0202"
    },
    {
        id: "c3",
        company_name: "Heavy Haul Brothers",
        dot_number: "3456789",
        mc_number: "MC-765432",
        city: "Houston",
        state: "TX",
        rating: 4.5,
        verified: true,
        reviews_count: 89,
        equipment_types: ["flatbed", "step_deck", "lowboy"],
        lanes: [{ origin: "TX", dest: "OK" }, { origin: "TX", dest: "LA" }],
        fleet_size: 25,
        years_in_business: 15,
        insurance_active: true,
        contact_email: "bids@heavyhaulbros.com",
        phone: "(713) 555-0303"
    },
    {
        id: "c4",
        company_name: "FastLane Express",
        dot_number: "4567890",
        mc_number: "MC-654321",
        city: "Atlanta",
        state: "GA",
        rating: 4.2,
        verified: false,
        reviews_count: 45,
        equipment_types: ["dry_van", "box_truck"],
        lanes: [{ origin: "GA", dest: "FL" }, { origin: "SC", dest: "NC" }],
        fleet_size: 12,
        years_in_business: 3,
        insurance_active: true,
        contact_email: "dispatch@fastlane.com",
        phone: "(404) 555-0404"
    },
    {
        id: "c5",
        company_name: "Pacific Coast Transport",
        dot_number: "5678901",
        mc_number: "MC-543210",
        city: "Portland",
        state: "OR",
        rating: 4.7,
        verified: true,
        reviews_count: 210,
        equipment_types: ["dry_van", "flatbed"],
        lanes: [{ origin: "OR", dest: "WA" }, { origin: "CA", dest: "OR" }],
        fleet_size: 80,
        years_in_business: 20,
        insurance_active: true,
        contact_email: "info@pacificcoast.com",
        phone: "(503) 555-0505"
    },
    {
        id: "c6",
        company_name: "Midwest Bulk Carriers",
        dot_number: "6789012",
        mc_number: "MC-432109",
        city: "Omaha",
        state: "NE",
        rating: 4.6,
        verified: true,
        reviews_count: 112,
        equipment_types: ["tanker", "dry_van"],
        lanes: [{ origin: "NE", dest: "IA" }, { origin: "KS", dest: "MO" }],
        fleet_size: 55,
        years_in_business: 10,
        insurance_active: true,
        contact_email: "dispatch@midwestbulk.com",
        phone: "(402) 555-0606"
    },
    {
        id: "c7",
        company_name: "Urban Delivery Co",
        dot_number: "7890123",
        mc_number: "MC-321098",
        city: "New York",
        state: "NY",
        rating: 4.3,
        verified: true,
        reviews_count: 67,
        equipment_types: ["box_truck"],
        lanes: [{ origin: "NJ", dest: "NY" }, { origin: "CT", dest: "NY" }],
        fleet_size: 30,
        years_in_business: 5,
        insurance_active: true,
        contact_email: "ops@urbandelivery.com",
        phone: "(212) 555-0707"
    },
    {
        id: "c8",
        company_name: "All States Moving",
        dot_number: "8901234",
        mc_number: "MC-210987",
        city: "Denver",
        state: "CO",
        rating: 4.0,
        verified: false,
        reviews_count: 23,
        equipment_types: ["dry_van"],
        lanes: [{ origin: "CO", dest: "UT" }, { origin: "CO", dest: "WY" }],
        fleet_size: 8,
        years_in_business: 2,
        insurance_active: true,
        contact_email: "booking@allstates.com",
        phone: "(303) 555-0808"
    },
    {
        id: "c9",
        company_name: "Titan Heavy Haul",
        dot_number: "9012345",
        mc_number: "MC-109876",
        city: "Nashville",
        state: "TN",
        rating: 4.9,
        verified: true,
        reviews_count: 412,
        equipment_types: ["lowboy", "flatbed", "step_deck"],
        lanes: [{ origin: "TN", dest: "KY" }, { origin: "AL", dest: "GA" }],
        fleet_size: 90,
        years_in_business: 18,
        insurance_active: true,
        contact_email: "project@titanheavy.com",
        phone: "(615) 555-0909"
    },
    {
        id: "c10",
        company_name: "Rapid Response Logistics",
        dot_number: "0123456",
        mc_number: "MC-098765",
        city: "Miami",
        state: "FL",
        rating: 4.7,
        verified: true,
        reviews_count: 189,
        equipment_types: ["reefer", "dry_van"],
        lanes: [{ origin: "FL", dest: "GA" }, { origin: "FL", dest: "TX" }],
        fleet_size: 65,
        years_in_business: 9,
        insurance_active: true,
        contact_email: "dispatch@rapidresponse.com",
        phone: "(305) 555-1010"
    }
];
