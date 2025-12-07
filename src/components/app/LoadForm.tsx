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
import { CheckCircle2 } from "lucide-react";

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
  posted_rate: z.string().optional(),
});

type LoadFormData = z.infer<typeof loadSchema>;

interface LoadFormProps {
  onSuccess?: () => void;
  initialData?: Partial<Load>;
  loadId?: string;
  isEditing?: boolean;
}

// Commodity options by equipment type
const COMMODITY_OPTIONS = {
  dry_van: [
    "Dry Food",
    "Beverages",
    "Textiles",
    "Electronics",
    "Consumer Goods",
    "Retail Products",
    "Paper Products",
    "Packaged Goods",
    "Furniture",
    "Automotive Parts",
  ],
  reefer: [
    "Fresh Produce",
    "Frozen Foods",
    "Dairy Products",
    "Meat & Poultry",
    "Seafood",
    "Pharmaceuticals",
    "Flowers",
    "Temperature-Sensitive Chemicals",
  ],
  flatbed: [
    "Construction Materials",
    "Steel Beams",
    "Lumber",
    "Machinery",
    "Vehicles",
    "Pipes",
    "Building Supplies",
    "Heavy Equipment",
  ],
  step_deck: [
    "Oversized Equipment",
    "Industrial Machinery",
    "Prefab Buildings",
    "Large Vehicles",
    "Construction Equipment",
  ],
  power_only: [
    "Loaded Trailers",
    "Pre-Loaded Equipment",
  ],
  tanker: [
    "Liquid Chemicals",
    "Petroleum Products",
    "Food Grade Liquids",
    "Hazmat Liquids",
  ],
  box_truck: [
    "Local Deliveries",
    "Small Packages",
    "Retail Goods",
  ],
  lowboy: [
    "Heavy Machinery",
    "Industrial Equipment",
    "Construction Equipment",
  ],
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
    },
  });

  const equipmentType = form.watch("equipment_type");
  const postedRate = form.watch("posted_rate");
  const originAddress = form.watch("origin_address");
  const destinationAddress = form.watch("destination_address");

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

  const onSubmit = async (data: LoadFormData) => {
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
    };

    if (isEditing && loadId) {
      updateLoad.mutate(loadData, {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      });
    } else {
      createLoad.mutate(loadData, {
        onSuccess: () => {
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
      : ["pickup_date", "delivery_date", "equipment_type"];

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) setStep(step + 1);
  };

  const commodityOptions = equipmentType && COMMODITY_OPTIONS[equipmentType as keyof typeof COMMODITY_OPTIONS] || [];
  const isReefer = equipmentType === "reefer";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
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
                    <Input placeholder="Warehouse or business name" {...field} />
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
                    <AddressAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="123 Main St"
                      onPlaceSelected={(place) => {
                        form.setValue("origin_address", place.address);
                        form.setValue("origin_city", place.city);
                        form.setValue("origin_state", place.state);
                        form.setValue("origin_zip", place.zip);
                        form.setValue("origin_lat" as any, place.lat);
                        form.setValue("origin_lng" as any, place.lng);
                        if (place.facilityName) {
                          form.setValue("origin_facility_name", place.facilityName);
                        }
                      }}
                    />
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
                    <Input placeholder="Warehouse or business name" {...field} />
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
                    <AddressAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="456 Oak Ave"
                      onPlaceSelected={(place) => {
                        form.setValue("destination_address", place.address);
                        form.setValue("destination_city", place.city);
                        form.setValue("destination_state", place.state);
                        form.setValue("destination_zip", place.zip);
                        form.setValue("destination_lat" as any, place.lat);
                        form.setValue("destination_lng" as any, place.lng);
                        if (place.facilityName) {
                          form.setValue("destination_facility_name", place.facilityName);
                        }
                      }}
                    />
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
                      <Input type="date" {...field} />
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
                      <Input type="date" {...field} />
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
                      <SelectItem value="dry_van">Dry Van</SelectItem>
                      <SelectItem value="reefer">Reefer</SelectItem>
                      <SelectItem value="flatbed">Flatbed</SelectItem>
                      <SelectItem value="step_deck">Step Deck</SelectItem>
                      <SelectItem value="lowboy">Lowboy</SelectItem>
                      <SelectItem value="tanker">Tanker</SelectItem>
                      <SelectItem value="box_truck">Box Truck</SelectItem>
                      <SelectItem value="power_only">Power Only</SelectItem>
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
                    <SelectContent>
                      {commodityOptions.map((commodity) => (
                        <SelectItem key={commodity} value={commodity}>
                          {commodity}
                        </SelectItem>
                      ))}
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
            <Button type="button" onClick={nextStep} className="flex-1">
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
