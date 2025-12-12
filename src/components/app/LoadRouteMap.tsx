/// <reference types="google.maps" />
import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Navigation, Clock, Route } from "lucide-react";

interface LoadRouteMapProps {
    originAddress: string;
    originCity: string;
    originState: string;
    originZip?: string;
    destinationAddress: string;
    destinationCity: string;
    destinationState: string;
    destinationZip?: string;
    distanceMiles?: number;
}

export function LoadRouteMap({
    originAddress,
    originCity,
    originState,
    originZip,
    destinationAddress,
    destinationCity,
    destinationState,
    destinationZip,
    distanceMiles,
}: LoadRouteMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{
        distance: string;
        duration: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

    // Build full address strings
    const originFull = `${originAddress}, ${originCity}, ${originState}${originZip ? ` ${originZip}` : ''}, USA`;
    const destinationFull = `${destinationAddress}, ${destinationCity}, ${destinationState}${destinationZip ? ` ${destinationZip}` : ''}, USA`;

    // Load Google Maps Script
    useEffect(() => {
        const loadGoogleMaps = () => {
            if (window.google?.maps?.DirectionsService) {
                setIsMapLoaded(true);
                return;
            }

            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
                setError("Google Maps API key not found");
                return;
            }

            const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => setIsMapLoaded(true));
                // Check if already loaded
                if (window.google?.maps?.DirectionsService) {
                    setIsMapLoaded(true);
                }
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
            script.async = true;
            script.defer = true;
            script.onload = () => setIsMapLoaded(true);
            script.onerror = () => setError("Failed to load Google Maps");
            document.head.appendChild(script);
        };

        loadGoogleMaps();
    }, []);

    // Initialize Map and get directions
    const initializeRoute = useCallback(async () => {
        if (!isMapLoaded || !mapRef.current || !window.google?.maps) return;

        // Create map if not exists
        if (!map) {
            const newMap = new google.maps.Map(mapRef.current, {
                center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
                zoom: 5,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                styles: [
                    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
                    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
                ],
            });
            setMap(newMap);
            return; // Will re-run when map is set
        }

        // Clear previous route
        if (directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null);
        }

        try {
            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer({
                map,
                suppressMarkers: false,
                polylineOptions: {
                    strokeColor: "#8b5cf6",
                    strokeWeight: 5,
                    strokeOpacity: 0.8,
                },
                markerOptions: {
                    zIndex: 100,
                },
            });
            directionsRendererRef.current = directionsRenderer;

            console.log(`[Route] Getting directions: ${originFull} → ${destinationFull}`);

            const result = await directionsService.route({
                origin: originFull,
                destination: destinationFull,
                travelMode: google.maps.TravelMode.DRIVING,
            });

            if (result.routes[0]) {
                directionsRenderer.setDirections(result);

                const leg = result.routes[0].legs[0];
                if (leg) {
                    setRouteInfo({
                        distance: leg.distance?.text || `${distanceMiles} miles`,
                        duration: leg.duration?.text || "Unknown",
                    });
                }
                setError(null);
            }
        } catch (err) {
            console.error("[Route] Directions error:", err);
            setError("Unable to calculate route. Showing approximate locations.");

            // Fallback: Just show markers without route
            const geocoder = new google.maps.Geocoder();
            const bounds = new google.maps.LatLngBounds();

            // Geocode origin
            geocoder.geocode({ address: originFull }, (results, status) => {
                if (status === "OK" && results?.[0]) {
                    new google.maps.Marker({
                        position: results[0].geometry.location,
                        map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 12,
                            fillColor: "#22c55e",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 3,
                        },
                        title: "Pickup",
                    });
                    bounds.extend(results[0].geometry.location);
                    map.fitBounds(bounds, 50);
                }
            });

            // Geocode destination
            geocoder.geocode({ address: destinationFull }, (results, status) => {
                if (status === "OK" && results?.[0]) {
                    new google.maps.Marker({
                        position: results[0].geometry.location,
                        map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 12,
                            fillColor: "#ef4444",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 3,
                        },
                        title: "Delivery",
                    });
                    bounds.extend(results[0].geometry.location);
                    map.fitBounds(bounds, 50);
                }
            });
        }
    }, [isMapLoaded, map, originFull, destinationFull, distanceMiles]);

    // Run when map or addresses change
    useEffect(() => {
        initializeRoute();
    }, [initializeRoute]);

    if (error && !map) {
        return (
            <Card className="p-6 text-center">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">{error}</p>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            {/* Route Info Header */}
            {routeInfo && (
                <div className="p-4 bg-muted/30 border-b flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Route className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{routeInfo.distance}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{routeInfo.duration} drive</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span>Pickup</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span>Delivery</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Container */}
            <div className="relative">
                <div ref={mapRef} className="h-[400px] w-full" />

                {!isMapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <div className="text-center space-y-3">
                            <Navigation className="h-10 w-10 text-muted-foreground animate-pulse mx-auto" />
                            <p className="text-muted-foreground">Loading route...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Route Details Footer */}
            <div className="p-4 bg-muted/20 border-t text-sm">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 mt-1 shrink-0" />
                        <div>
                            <p className="font-medium">Pickup Location</p>
                            <p className="text-muted-foreground">{originAddress}</p>
                            <p className="text-muted-foreground">{originCity}, {originState} {originZip}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 mt-1 shrink-0" />
                        <div>
                            <p className="font-medium">Delivery Location</p>
                            <p className="text-muted-foreground">{destinationAddress}</p>
                            <p className="text-muted-foreground">{destinationCity}, {destinationState} {destinationZip}</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
