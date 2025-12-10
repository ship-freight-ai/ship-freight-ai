/// <reference types="google.maps" />
import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface PlaceResult {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected?: (place: {
    address: string;
    city: string;
    state: string;
    zip: string;
    lat: number;
    lng: number;
    facilityName?: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Search for a place or address...",
  className
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [apiError, setApiError] = useState<string | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);


  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // position: fixed is relative to viewport, no scroll offset needed
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google?.maps?.places) {
        setIsLoaded(true);
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setApiError("Google Maps API key not found");
        console.warn("Google Maps API key not found");
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => setIsLoaded(true));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("Google Maps loaded successfully");
        setIsLoaded(true);
      };
      script.onerror = () => {
        setApiError("Failed to load Google Maps");
        console.error("Failed to load Google Maps script");
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize services when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded) return;

    try {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();

      // Create a dummy div for PlacesService (required by the API)
      const dummyDiv = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);

      // Create session token for billing optimization
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      console.log("Google Maps services initialized");
    } catch (error) {
      console.error("Error initializing Google Maps services:", error);
      setApiError("Error initializing Google Maps");
    }
  }, [isLoaded]);

  // Fetch suggestions when input changes
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 2 || !autocompleteServiceRef.current) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    updateDropdownPosition();

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input,
        componentRestrictions: { country: ["us", "ca", "mx"] },
        sessionToken: sessionTokenRef.current!,
      };

      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoading(false);

          console.log("Autocomplete status:", status, "predictions:", predictions?.length);

          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const results: PlaceResult[] = predictions.map((prediction) => ({
              placeId: prediction.place_id,
              mainText: prediction.structured_formatting.main_text,
              secondaryText: prediction.structured_formatting.secondary_text || "",
              description: prediction.description,
            }));
            setSuggestions(results);
            setShowDropdown(true);
            setSelectedIndex(-1);
            updateDropdownPosition();
          } else {
            console.warn("Autocomplete failed with status:", status);
            setSuggestions([]);
            setShowDropdown(false);
          }
        }
      );
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setIsLoading(false);
      setSuggestions([]);
    }
  }, [updateDropdownPosition]);

  // Debounced input handler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, fetchSuggestions]);

  // Get place details when a suggestion is selected
  const selectPlace = useCallback((placeResult: PlaceResult) => {
    if (!placesServiceRef.current) return;

    setIsLoading(true);

    const request: google.maps.places.PlaceDetailsRequest = {
      placeId: placeResult.placeId,
      fields: ["address_components", "geometry", "name", "formatted_address"],
      sessionToken: sessionTokenRef.current!,
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      setIsLoading(false);

      console.log("Place details status:", status, "place:", place?.name);

      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        let streetNumber = "";
        let route = "";
        let city = "";
        let state = "";
        let zip = "";

        place.address_components?.forEach((component) => {
          const types = component.types;

          if (types.includes("street_number")) {
            streetNumber = component.long_name;
          }
          if (types.includes("route")) {
            route = component.long_name;
          }
          if (types.includes("locality")) {
            city = component.long_name;
          }
          if (types.includes("sublocality_level_1") && !city) {
            city = component.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            state = component.short_name;
          }
          if (types.includes("postal_code")) {
            zip = component.long_name;
          }
        });

        const address = streetNumber ? `${streetNumber} ${route}` : route;
        const lat = place.geometry?.location?.lat() || 0;
        const lng = place.geometry?.location?.lng() || 0;
        const facilityName = place.name || "";

        // Update the input with the formatted address
        onChange(address || placeResult.mainText);

        // Call the callback with all extracted data
        onPlaceSelected?.({
          address: address || placeResult.mainText,
          city,
          state,
          zip,
          lat,
          lng,
          facilityName: facilityName !== address ? facilityName : undefined,
        });

        // Create new session token for next search
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      }

      setSuggestions([]);
      setShowDropdown(false);
    });
  }, [onChange, onPlaceSelected]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectPlace(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update position on scroll/resize
  useEffect(() => {
    if (showDropdown) {
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [showDropdown, updateDropdownPosition]);

  // Dropdown component rendered via portal
  const dropdown = showDropdown && suggestions.length > 0 && createPortal(
    <div
      ref={dropdownRef}
      className="bg-popover border border-border rounded-lg shadow-2xl overflow-y-auto max-h-[300px] overscroll-contain"
      onMouseDown={(e) => {
        // Prevent input blur when interacting with the dropdown (including scrollbar)
        e.preventDefault();
      }}
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 99999,
        pointerEvents: 'auto' // Ensure clicks work in modals
      }}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.placeId}
          type="button"
          onMouseDown={(e) => {
            // Prevent input blur which would close the dropdown before selection
            e.preventDefault();
            selectPlace(suggestion);
          }}
          onMouseEnter={() => setSelectedIndex(index)}
          className={cn(
            "w-full px-4 py-3 flex items-start gap-3 text-left transition-colors",
            "hover:bg-accent/50",
            selectedIndex === index && "bg-accent"
          )}
        >
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {suggestion.placeId ? <MapPin className="w-4 h-4 text-primary" /> : <Building2 className="w-4 h-4 text-primary" />}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {suggestion.mainText}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {suggestion.secondaryText}
            </p>
          </div>
        </button>
      ))}
      <div className="px-4 py-2 bg-muted/50 border-t border-border">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Powered by Google
        </p>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            updateDropdownPosition();
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className={cn("pl-10 pr-10", className)}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {apiError && (
        <p className="text-xs text-destructive mt-1">{apiError}</p>
      )}

      {dropdown}
    </div>
  );
}
