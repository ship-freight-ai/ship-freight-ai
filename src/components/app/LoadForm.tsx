import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { AddressAutocomplete } from "@/components/app/AddressAutocomplete";
import { useCreateLoad, useUpdateLoad } from "@/hooks/useLoads";
import type { Database } from "@/integrations/supabase/types";
import { CheckCircle2, Package, Snowflake, Truck, Box, Droplet, Hammer, Car, Pill, Flower2, Fish, Beef, Milk, Apple, ShoppingCart, Sofa, Zap, Wrench, Building2, Shirt, Newspaper, Wine, Cpu, Baby, Dog, Leaf, Cog, Factory, Container, CircleDollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type EquipmentType = Database["public"]["Enums"]["equipment_type"];
type Load = Database["public"]["Tables"]["loads"]["Row"];

const loadSchema = z.object({
  origin_address: z.string().min(1, "Origin address is required"),
  origin_city: z.string().min(1, "Origin city is required"),
  origin_state: z.string().min(2, "Origin state is required").max(2),
  origin_zip: z.string().min(5, "Origin zip is required"),
  origin_facility_name: z.string().optional(),
  destination_address: z.string().min(1, "Destination address is required"),
  destination_city: z.string().min(1, "Destination city is required"),
  destination_state: z.string().min(2, "Destination state is required").max(2),
  destination_zip: z.string().min(5, "Destination zip is required"),
  destination_facility_name: z.string().optional(),
  pickup_date: z.string().min(1, "Pickup date is required"),
  delivery_date: z.string().min(1, "Delivery date is required"),
  equipment_type: z.string().min(1, "Equipment type is required"),
  weight: z.string().optional(),
  length: z.string().optional(),
  commodity: z.string().min(1, "Commodity is required"),
  temperature_min: z.string().optional(),
  temperature_max: z.string().optional(),
  special_requirements: z.string().optional(),
  posted_rate: z.string().min(1, "Posted rate is required"),
  is_public: z.boolean().default(true),
  pickup_ref: z.string().optional(),
  requires_eld: z.boolean().default(false),
});

type LoadFormData = z.infer<typeof loadSchema>;

interface LoadFormProps {
  onSuccess?: () => void;
  initialData?: Partial<Load> & { is_public?: boolean; pickup_ref?: string; requires_eld?: boolean };
  loadId?: string;
  isEditing?: boolean;
}

// Commodity options with icons by equipment type
const COMMODITY_OPTIONS: Record<string, Array<{ value: string; label: string; icon: React.ElementType }>> = {
  dry_van: [
    { value: "General Merchandise", label: "General Merchandise", icon: ShoppingCart },
    { value: "Building Materials", label: "Building Materials", icon: Building2 },
    { value: "Auto Parts", label: "Auto Parts", icon: Car },
    { value: "Electronics", label: "Electronics", icon: Cpu },
    { value: "Consumer Goods", label: "Consumer Goods", icon: Package },
    { value: "Retail Products", label: "Retail Products", icon: ShoppingCart },
    { value: "Furniture", label: "Furniture", icon: Sofa },
    { value: "Textiles & Apparel", label: "Textiles & Apparel", icon: Shirt },
    { value: "Paper Products", label: "Paper Products", icon: Newspaper },
    { value: "Beverages", label: "Beverages", icon: Wine },
    { value: "Dry Food", label: "Dry Food", icon: Package },
    { value: "Household Goods", label: "Household Goods", icon: Sofa },
    { value: "Industrial Supplies", label: "Industrial Supplies", icon: Cog },
    { value: "Hardware & Tools", label: "Hardware & Tools", icon: Wrench },
    { value: "Baby Products", label: "Baby Products", icon: Baby },
    { value: "Pet Supplies", label: "Pet Supplies", icon: Dog },
    { value: "Packaged Goods", label: "Packaged Goods", icon: Box },
    { value: "E-Commerce Freight", label: "E-Commerce Freight", icon: Package },
  ],
  reefer: [
    { value: "Fresh Produce", label: "Fresh Produce", icon: Apple },
    { value: "Frozen Foods", label: "Frozen Foods", icon: Snowflake },
    { value: "Dairy Products", label: "Dairy Products", icon: Milk },
    { value: "Meat & Poultry", label: "Meat & Poultry", icon: Beef },
    { value: "Seafood", label: "Seafood", icon: Fish },
    { value: "Pharmaceuticals", label: "Pharmaceuticals", icon: Pill },
    { value: "Flowers & Plants", label: "Flowers & Plants", icon: Flower2 },
    { value: "Beverages (Chilled)", label: "Beverages (Chilled)", icon: Wine },
    { value: "Temperature-Sensitive Chemicals", label: "Temperature-Sensitive Chemicals", icon: Droplet },
    { value: "Bakery Products", label: "Bakery Products", icon: Package },
    { value: "Ice Cream", label: "Ice Cream", icon: Snowflake },
    { value: "Organic Products", label: "Organic Products", icon: Leaf },
  ],
  flatbed: [
    { value: "Construction Materials", label: "Construction Materials", icon: Hammer },
    { value: "Steel & Metals", label: "Steel & Metals", icon: Cog },
    { value: "Lumber & Wood", label: "Lumber & Wood", icon: Building2 },
    { value: "Machinery", label: "Machinery", icon: Factory },
    { value: "Vehicles", label: "Vehicles", icon: Car },
    { value: "Pipes & Tubing", label: "Pipes & Tubing", icon: Container },
    { value: "Building Supplies", label: "Building Supplies", icon: Building2 },
    { value: "Heavy Equipment", label: "Heavy Equipment", icon: Truck },
    { value: "Roofing Materials", label: "Roofing Materials", icon: Building2 },
    { value: "Concrete Products", label: "Concrete Products", icon: Box },
    { value: "Farm Equipment", label: "Farm Equipment", icon: Leaf },
  ],
  step_deck: [
    { value: "Oversized Equipment", label: "Oversized Equipment", icon: Truck },
    { value: "Industrial Machinery", label: "Industrial Machinery", icon: Factory },
    { value: "Prefab Buildings", label: "Prefab Buildings", icon: Building2 },
    { value: "Large Vehicles", label: "Large Vehicles", icon: Car },
    { value: "Construction Equipment", label: "Construction Equipment", icon: Hammer },
    { value: "Agricultural Equipment", label: "Agricultural Equipment", icon: Leaf },
  ],
  power_only: [
    { value: "Loaded Trailers", label: "Loaded Trailers", icon: Container },
    { value: "Pre-Loaded Equipment", label: "Pre-Loaded Equipment", icon: Truck },
    { value: "Container Chassis", label: "Container Chassis", icon: Container },
  ],
  tanker: [
    { value: "Liquid Chemicals", label: "Liquid Chemicals", icon: Droplet },
    { value: "Petroleum Products", label: "Petroleum Products", icon: Droplet },
    { value: "Food Grade Liquids", label: "Food Grade Liquids", icon: Droplet },
    { value: "Hazmat Liquids", label: "Hazmat Liquids", icon: Zap },
    { value: "Water", label: "Water", icon: Droplet },
    { value: "Milk & Dairy Liquids", label: "Milk & Dairy Liquids", icon: Milk },
  ],
  box_truck: [
    { value: "Local Deliveries", label: "Local Deliveries", icon: Package },
    { value: "Small Packages", label: "Small Packages", icon: Box },
    { value: "Retail Goods", label: "Retail Goods", icon: ShoppingCart },
    { value: "Office Supplies", label: "Office Supplies", icon: Package },
    { value: "Residential Moving", label: "Residential Moving", icon: Sofa },
    { value: "Medical Supplies", label: "Medical Supplies", icon: Pill },
  ],
  lowboy: [
    { value: "Heavy Machinery", label: "Heavy Machinery", icon: Factory },
    { value: "Industrial Equipment", label: "Industrial Equipment", icon: Cog },
    { value: "Construction Equipment", label: "Construction Equipment", icon: Hammer },
    { value: "Excavators", label: "Excavators", icon: Truck },
    { value: "Bulldozers", label: "Bulldozers", icon: Truck },
  ],
  car_carrier: [
    { value: "Passenger Vehicles", label: "Passenger Vehicles", icon: Car },
    { value: "SUVs & Trucks", label: "SUVs & Trucks", icon: Truck },
    { value: "Motorcycles", label: "Motorcycles", icon: Car },
    { value: "Classic Cars", label: "Classic Cars", icon: Car },
    { value: "Luxury Vehicles", label: "Luxury Vehicles", icon: Car },
    { value: "Fleet Vehicles", label: "Fleet Vehicles", icon: Car },
    { value: "Dealer Inventory", label: "Dealer Inventory", icon: Car },
    { value: "Auction Vehicles", label: "Auction Vehicles", icon: Car },
  ],
};

// Equipment type icons mapping
const EQUIPMENT_ICONS: Record<string, React.ElementType> = {
  dry_van: Package,
  reefer: Snowflake,
  flatbed: Hammer,
  step_deck: Truck,
  lowboy: Truck,
  tanker: Droplet,
  box_truck: Box,
  power_only: Truck,
  car_carrier: Car,
};

export function LoadForm({ onSuccess, initialData, loadId, isEditing }: LoadFormProps) {
  const [step, setStep] = useState(1);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const createLoad = useCreateLoad();
  const updateLoad = useUpdateLoad(loadId || "");

  const form = useForm<LoadFormData>({
    resolver: zodResolver(loadSchema),
    defaultValues: {
      origin_address: initialData?.origin_address || "",
      origin_city: initialData?.origin_city || "",
      origin_state: initialData?.origin_state || "",
      origin_zip: initialData?.origin_zip || "",
      origin_facility_name: initialData?.origin_facility_name || "",
      destination_address: initialData?.destination_address || "",
      destination_city: initialData?.destination_city || "",
      destination_state: initialData?.destination_state || "",
      destination_zip: initialData?.destination_zip || "",
      destination_facility_name: initialData?.destination_facility_name || "",
      pickup_date: initialData?.pickup_date || "",
      delivery_date: initialData?.delivery_date || "",
      equipment_type: initialData?.equipment_type || "",
      weight: initialData?.weight?.toString() || "",
      length: initialData?.length?.toString() || "",
      commodity: initialData?.commodity || "",
      temperature_min: initialData?.temperature_min?.toString() || "",
      temperature_max: initialData?.temperature_max?.toString() || "",
      special_requirements: initialData?.special_requirements || "",
      posted_rate: initialData?.posted_rate?.toString() || "",
      is_public: initialData?.is_public !== undefined ? initialData.is_public : true,
      pickup_ref: initialData?.pickup_ref || "",
      requires_eld: initialData?.requires_eld !== undefined ? initialData.requires_eld : false,
    },
  });

  const equipmentType = form.watch("equipment_type");
  const postedRate = form.watch("posted_rate");
  const originAddress = form.watch("origin_address");
  const destinationAddress = form.watch("destination_address");

  // Storage key for form persistence (only for new loads, not edits)
  const STORAGE_KEY = "load_form_draft";

  // Load saved form data on mount (only for new loads)
  useEffect(() => {
    if (isEditing || initialData) return;

    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        Object.keys(parsed).forEach((key) => {
          form.setValue(key as keyof LoadFormData, parsed[key]);
        });
        // Restore step if saved
        if (parsed._step) {
          setStep(parsed._step);
        }
        if (parsed._distance) {
          setCalculatedDistance(parsed._distance);
        }
      }
    } catch (e) {
      console.error("Failed to load saved form data:", e);
    }
  }, [isEditing, initialData]);

  // Save form data to localStorage on change (only for new loads)
  useEffect(() => {
    if (isEditing || initialData) return;

    const subscription = form.watch((data) => {
      try {
        const saveData = {
          ...data,
          _step: step,
          _distance: calculatedDistance,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
      } catch (e) {
        console.error("Failed to save form data:", e);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, step, calculatedDistance, isEditing, initialData]);

  // Clear localStorage on successful submission
  const clearSavedForm = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Calculate distance when addresses change
  useEffect(() => {
    const calculateDistance = async () => {
      if (!originAddress || !destinationAddress || !window.google?.maps) return;

      setIsCalculatingDistance(true);
      try {
        const service = new google.maps.DistanceMatrixService();
        const result = await service.getDistanceMatrix({
          origins: [originAddress],
          destinations: [destinationAddress],
          travelMode: google.maps.TravelMode.DRIVING,
        });

        const distance = result.rows[0]?.elements[0]?.distance?.value;
        if (distance) {
          const miles = Math.round(distance / 1609.34); // Convert meters to miles
          setCalculatedDistance(miles);
        }
      } catch (error) {
        console.error("Error calculating distance:", error);
      } finally {
        setIsCalculatingDistance(false);
      }
    };

    calculateDistance();
  }, [originAddress, destinationAddress]);

  const minimumRate = calculatedDistance ? calculatedDistance * 2 : null;
  const rateValue = postedRate ? parseFloat(postedRate) : 0;
  const meetsMinimum = minimumRate ? rateValue >= minimumRate : true;

  const onSubmit = async (data: any) => {
    // Prevent premature submission if not on the last step
    if (step < 4) {
      await nextStep();
      return;
    }

    const loadData = {
      origin_address: data.origin_address,
      origin_city: data.origin_city,
      origin_state: data.origin_state,
      origin_zip: data.origin_zip,
      origin_facility_name: data.origin_facility_name || null,
      destination_address: data.destination_address,
      destination_city: data.destination_city,
      destination_state: data.destination_state,
      destination_zip: data.destination_zip,
      destination_facility_name: data.destination_facility_name || null,
      pickup_date: data.pickup_date,
      delivery_date: data.delivery_date,
      equipment_type: data.equipment_type as EquipmentType,
      weight: data.weight ? parseFloat(data.weight) : null,
      length: data.length ? parseFloat(data.length) : null,
      commodity: data.commodity || null,
      temperature_min: data.temperature_min ? parseFloat(data.temperature_min) : null,
      temperature_max: data.temperature_max ? parseFloat(data.temperature_max) : null,
      special_requirements: data.special_requirements || null,
      posted_rate: data.posted_rate ? parseFloat(data.posted_rate) : null,
      distance_miles: calculatedDistance,
      status: "draft" as const,
      is_public: data.is_public !== undefined ? data.is_public : true,
      pickup_ref: data.pickup_ref || null,
      requires_eld: data.requires_eld !== undefined ? data.requires_eld : false,
    };

    // Using any cast for loadData temporarily to bypass strict typing until types.ts is updated
    if (isEditing && loadId) {
      updateLoad.mutate(loadData as any, {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      });
    } else {
      createLoad.mutate(loadData as any, {
        onSuccess: () => {
          clearSavedForm();
          form.reset();
          onSuccess?.();
        },
      });
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = step === 1
      ? ["origin_address", "origin_city", "origin_state", "origin_zip"]
      : step === 2
        ? ["destination_address", "destination_city", "destination_state", "destination_zip"]
        : ["pickup_date", "delivery_date", "equipment_type", "commodity"];

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid && step < 4) setStep(step + 1);
  };

  const commodityOptions = equipmentType && COMMODITY_OPTIONS[equipmentType as keyof typeof COMMODITY_OPTIONS] || [];
  const isReefer = equipmentType === "reefer";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  // Allow clicking on completed steps or when editing
                  if (s <= step || isEditing) {
                    setStep(s);
                  }
                }}
                className={`h-2 w-16 rounded-full transition-all ${s <= step ? "bg-primary" : "bg-muted"
                  } ${(s <= step || isEditing) ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed"}`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            Step {step} of 4
          </span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Origin Details</h3>
            <FormField
              control={form.control}
              name="origin_facility_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facility Name (Optional)</FormLabel>
                  <FormControl>
                    <AddressAutocomplete
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Search facility (e.g. Amazon, Walmart)"
                      onPlaceSelected={(place) => {
                        if (place.facilityName) {
                          form.setValue("origin_facility_name", place.facilityName);
                        }
                        form.setValue("origin_address", place.address);
                        form.setValue("origin_city", place.city);
                        form.setValue("origin_state", place.state);
                        form.setValue("origin_zip", place.zip);
                        form.setValue("origin_lat" as any, place.lat);
                        form.setValue("origin_lng" as any, place.lng);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="origin_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origin_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="origin_state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="CA" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="origin_zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code</FormLabel>
                  <FormControl>
                    <Input placeholder="12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Destination Details</h3>
            <FormField
              control={form.control}
              name="destination_facility_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facility Name (Optional)</FormLabel>
                  <FormControl>
                    <AddressAutocomplete
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Search facility (e.g. Costco, Target)"
                      onPlaceSelected={(place) => {
                        if (place.facilityName) {
                          form.setValue("destination_facility_name", place.facilityName);
                        }
                        form.setValue("destination_address", place.address);
                        form.setValue("destination_city", place.city);
                        form.setValue("destination_state", place.state);
                        form.setValue("destination_zip", place.zip);
                        form.setValue("destination_lat" as any, place.lat);
                        form.setValue("destination_lng" as any, place.lng);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destination_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="456 Oak Ave" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="destination_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination_state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="destination_zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code</FormLabel>
                  <FormControl>
                    <Input placeholder="54321" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {calculatedDistance && (
              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-sm font-medium">
                  Calculated Distance: <span className="text-primary">{calculatedDistance} miles</span>
                </p>
              </div>
            )}
            {isCalculatingDistance && (
              <p className="text-sm text-muted-foreground">Calculating distance...</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Load Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pickup_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Date</FormLabel>
                    <FormControl>
                      <Input type="date" min={new Date().toISOString().split('T')[0]} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="delivery_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Date</FormLabel>
                    <FormControl>
                      <Input type="date" min={new Date().toISOString().split('T')[0]} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="equipment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(EQUIPMENT_ICONS).map(([value, Icon]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <span>{value.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="commodity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commodity</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!equipmentType}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={equipmentType ? "Select commodity" : "Select equipment type first"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {commodityOptions.map((commodity) => {
                        const Icon = commodity.icon;
                        return (
                          <SelectItem key={commodity.value} value={commodity.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-primary" />
                              <span>{commodity.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isReefer && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="temperature_min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Temperature (°F)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="-10" {...field} />
                      </FormControl>
                      <FormDescription>Minimum required temperature</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="temperature_max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Temperature (°F)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormDescription>Maximum required temperature</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (lbs)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="45000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (ft)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="53" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Rate & Requirements</h3>
            <FormField
              control={form.control}
              name="posted_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posted Rate ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="2500" {...field} />
                  </FormControl>
                  {minimumRate && (
                    <FormDescription className="flex items-center gap-2">
                      {meetsMinimum ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Meets minimum: ${minimumRate.toLocaleString()} ({calculatedDistance} miles × $2/mile)</span>
                        </>
                      ) : (
                        <span className="text-destructive">
                          Minimum rate: ${minimumRate.toLocaleString()} ({calculatedDistance} miles × $2/mile)
                        </span>
                      )}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Public Load Board</FormLabel>
                    <FormDescription>
                      Make this load visible to all carriers on the platform
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requires_eld"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Require ELD Tracking</FormLabel>
                    <FormDescription>
                      Only carriers with active ELD integration can bid
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pickup_ref"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Reference Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="REF-123456" {...field} />
                  </FormControl>
                  <FormDescription>
                    Hidden from public view. Only visible to booked carrier.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="special_requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="E.g., hazmat, team drivers, liftgate required..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="flex gap-3">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextStep();
              }}
              className="flex-1"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={createLoad.isPending || updateLoad.isPending || (minimumRate ? !meetsMinimum : false)}
              className="flex-1"
            >
              {createLoad.isPending || updateLoad.isPending
                ? (isEditing ? "Updating..." : "Creating...")
                : (isEditing ? "Update Load" : "Create Load")}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
