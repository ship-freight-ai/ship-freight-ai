/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Truck, ArrowRight, DollarSign, Calendar, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Load = Database["public"]["Tables"]["loads"]["Row"];

interface LoadsMapViewProps {
    loads: Load[];
    isLoading?: boolean;
}

export function LoadsMapView({ loads, isLoading }: LoadsMapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const navigate = useNavigate();

    // Load Google Maps Script
    useEffect(() => {
        const loadGoogleMaps = () => {
            if (window.google?.maps?.Map) {
                setIsMapLoaded(true);
                return;
            }

            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
                console.error("Google Maps API key not found");
                return;
            }

            const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => setIsMapLoaded(true));
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
            script.async = true;
            script.defer = true;
            script.onload = () => setIsMapLoaded(true);
            script.onerror = () => console.error("Failed to load Google Maps script");
            document.head.appendChild(script);
        };

        loadGoogleMaps();
    }, []);

    // Initialize Map
    useEffect(() => {
        if (!isMapLoaded || !mapRef.current || map) return;

        const newMap = new google.maps.Map(mapRef.current, {
            center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
            zoom: 4,
            styles: [
                { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
                { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
        });

        setMap(newMap);
    }, [isMapLoaded, map]);

    // Add markers for loads
    useEffect(() => {
        if (!map || !loads.length) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        const geocoder = new google.maps.Geocoder();
        const bounds = new google.maps.LatLngBounds();

        loads.forEach((load, index) => {
            // Geocode origin
            const originAddress = `${load.origin_city}, ${load.origin_state}`;
            const destAddress = `${load.destination_city}, ${load.destination_state}`;

            geocoder.geocode({ address: originAddress }, (results, status) => {
                if (status === "OK" && results?.[0]) {
                    const position = results[0].geometry.location;

                    const marker = new google.maps.Marker({
                        position,
                        map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: "#22c55e",
                            fillOpacity: 0.9,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                        },
                        title: `Origin: ${load.origin_city}, ${load.origin_state}`,
                        zIndex: 100 + index,
                    });

                    marker.addListener("click", () => setSelectedLoad(load));
                    markersRef.current.push(marker);
                    bounds.extend(position);

                    // Also geocode destination
                    geocoder.geocode({ address: destAddress }, (destResults, destStatus) => {
                        if (destStatus === "OK" && destResults?.[0]) {
                            const destPosition = destResults[0].geometry.location;

                            const destMarker = new google.maps.Marker({
                                position: destPosition,
                                map,
                                icon: {
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 10,
                                    fillColor: "#ef4444",
                                    fillOpacity: 0.9,
                                    strokeColor: "#ffffff",
                                    strokeWeight: 2,
                                },
                                title: `Destination: ${load.destination_city}, ${load.destination_state}`,
                                zIndex: 100 + index,
                            });

                            destMarker.addListener("click", () => setSelectedLoad(load));
                            markersRef.current.push(destMarker);
                            bounds.extend(destPosition);

                            // Draw line between origin and destination
                            const line = new google.maps.Polyline({
                                path: [position, destPosition],
                                geodesic: true,
                                strokeColor: "#8b5cf6",
                                strokeOpacity: 0.6,
                                strokeWeight: 2,
                                map,
                            });

                            // Fit bounds after adding markers
                            if (markersRef.current.length >= 2) {
                                map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
                            }
                        }
                    });
                }
            });
        });
    }, [map, loads]);

    if (isLoading) {
        return (
            <Card className="p-4 h-[600px] flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </Card>
        );
    }

    return (
        <div className="relative">
            {/* Map Container */}
            <Card className="overflow-hidden">
                <div ref={mapRef} className="h-[600px] w-full" />

                {!isMapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <div className="text-center space-y-3">
                            <MapPin className="h-10 w-10 text-muted-foreground animate-pulse mx-auto" />
                            <p className="text-muted-foreground">Loading map...</p>
                        </div>
                    </div>
                )}
            </Card>

            {/* Legend */}
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg p-3 shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span>Pickup Location</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                    <span>Delivery Location</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-0.5 bg-purple-500" />
                    <span>Route</span>
                </div>
            </div>

            {/* Selected Load Card */}
            {selectedLoad && (
                <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96">
                    <Card className="p-4 bg-white/95 dark:bg-black/95 backdrop-blur-sm shadow-xl">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-primary" />
                                    Load #{selectedLoad.load_number || selectedLoad.id.slice(0, 8)}
                                </h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    {selectedLoad.origin_city}, {selectedLoad.origin_state}
                                    <ArrowRight className="h-3 w-3" />
                                    {selectedLoad.destination_city}, {selectedLoad.destination_state}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setSelectedLoad(null)}
                            >
                                ×
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{format(new Date(selectedLoad.pickup_date), "MMM d")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="capitalize">{selectedLoad.equipment_type?.replace("_", " ")}</span>
                            </div>
                            {selectedLoad.posted_rate && (
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">${selectedLoad.posted_rate.toLocaleString()}</span>
                                </div>
                            )}
                            {selectedLoad.distance_miles && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedLoad.distance_miles} miles</span>
                                </div>
                            )}
                        </div>

                        <Button
                            className="w-full"
                            onClick={() => navigate(`/app/loads/${selectedLoad.id}`)}
                        >
                            View Load Details
                        </Button>
                    </Card>
                </div>
            )}

            {/* Load Count */}
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                <p className="text-sm font-medium">
                    {loads.length} load{loads.length !== 1 ? 's' : ''} on map
                </p>
            </div>
        </div>
    );
}
