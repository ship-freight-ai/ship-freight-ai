// supabase/functions/calculate-distance/index.ts
// Server-side distance calculation using Google Maps Distance Matrix API
// This avoids CORS and API key domain restriction issues

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DistanceRequest {
    originCity: string;
    originState: string;
    originAddress?: string;
    originZip?: string;
    destinationCity: string;
    destinationState: string;
    destinationAddress?: string;
    destinationZip?: string;
}

interface DistanceResponse {
    distance_miles: number | null;
    duration_hours: number | null;
    error?: string;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
        if (!apiKey) {
            console.error('GOOGLE_MAPS_API_KEY not configured');
            return new Response(
                JSON.stringify({ error: 'Google Maps API key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const body: DistanceRequest = await req.json();

        // Validate required fields
        if (!body.originCity || !body.originState || !body.destinationCity || !body.destinationState) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: originCity, originState, destinationCity, destinationState' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Build origin and destination strings with multiple attempts
        const attempts = [];

        // Attempt 1: Full address
        if (body.originAddress && body.destinationAddress) {
            attempts.push({
                origin: `${body.originAddress}, ${body.originCity}, ${body.originState} ${body.originZip || ''}`.trim(),
                destination: `${body.destinationAddress}, ${body.destinationCity}, ${body.destinationState} ${body.destinationZip || ''}`.trim(),
                label: 'Full Address'
            });
        }

        // Attempt 2: City, State only (most reliable)
        attempts.push({
            origin: `${body.originCity}, ${body.originState}, USA`,
            destination: `${body.destinationCity}, ${body.destinationState}, USA`,
            label: 'City/State'
        });

        let result: DistanceResponse = { distance_miles: null, duration_hours: null };

        for (const attempt of attempts) {
            console.log(`[Distance] Trying ${attempt.label}: "${attempt.origin}" → "${attempt.destination}"`);

            const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
            url.searchParams.set('origins', attempt.origin);
            url.searchParams.set('destinations', attempt.destination);
            url.searchParams.set('mode', 'driving');
            url.searchParams.set('units', 'imperial');
            url.searchParams.set('key', apiKey);

            const response = await fetch(url.toString());
            const data = await response.json();

            console.log(`[Distance] Google API response status: ${data.status}`);

            if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
                const element = data.rows[0].elements[0];
                const meters = element.distance.value;
                const seconds = element.duration.value;

                result = {
                    distance_miles: Math.round(meters / 1609.34), // Convert meters to miles
                    duration_hours: Math.round((seconds / 3600) * 10) / 10, // Convert to hours with 1 decimal
                };

                console.log(`[Distance] Success: ${result.distance_miles} miles, ${result.duration_hours} hours`);
                break;
            } else {
                console.warn(`[Distance] ${attempt.label} failed: ${data.rows?.[0]?.elements?.[0]?.status || data.status}`);
            }
        }

        if (!result.distance_miles) {
            result.error = 'Unable to calculate distance between these locations';
        }

        return new Response(
            JSON.stringify(result),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error calculating distance:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
