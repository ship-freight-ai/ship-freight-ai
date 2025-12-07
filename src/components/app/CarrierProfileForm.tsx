import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateCarrierProfile, useUpdateCarrierProfile } from "@/hooks/useCarriers";
import type { Database } from "@/integrations/supabase/types";
import { Checkbox } from "@/components/ui/checkbox";

type EquipmentType = Database["public"]["Enums"]["equipment_type"];

const carrierSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  dot_number: z.string().min(1, "DOT number is required"),
  mc_number: z.string().min(1, "MC number is required"),
  capacity: z.string().min(1, "Capacity is required"),
  insurance_amount: z.string().optional(),
  insurance_expiry: z.string().optional(),
  service_areas: z.string().optional(),
  equipment_types: z.array(z.string()).min(1, "Select at least one equipment type"),
});

type CarrierFormData = z.infer<typeof carrierSchema>;

interface CarrierProfileFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

const equipmentOptions: { value: EquipmentType; label: string }[] = [
  { value: "dry_van", label: "Dry Van" },
  { value: "reefer", label: "Reefer" },
  { value: "flatbed", label: "Flatbed" },
  { value: "step_deck", label: "Step Deck" },
  { value: "power_only", label: "Power Only" },
];

export function CarrierProfileForm({ initialData, onSuccess }: CarrierProfileFormProps) {
  const createCarrier = useCreateCarrierProfile();
  const updateCarrier = useUpdateCarrierProfile();
  const isEditing = !!initialData;

  const form = useForm<CarrierFormData>({
    resolver: zodResolver(carrierSchema),
    defaultValues: initialData
      ? {
          company_name: initialData.company_name || "",
          dot_number: initialData.dot_number || "",
          mc_number: initialData.mc_number || "",
          capacity: initialData.capacity?.toString() || "",
          insurance_amount: initialData.insurance_amount?.toString() || "",
          insurance_expiry: initialData.insurance_expiry || "",
          service_areas: initialData.service_areas?.join(", ") || "",
          equipment_types: initialData.equipment_types || [],
        }
      : {
          company_name: "",
          dot_number: "",
          mc_number: "",
          capacity: "",
          insurance_amount: "",
          insurance_expiry: "",
          service_areas: "",
          equipment_types: [],
        },
  });

  const onSubmit = async (data: CarrierFormData) => {
    const carrierData = {
      company_name: data.company_name,
      dot_number: data.dot_number,
      mc_number: data.mc_number,
      capacity: parseInt(data.capacity),
      insurance_amount: data.insurance_amount ? parseFloat(data.insurance_amount) : null,
      insurance_expiry: data.insurance_expiry || null,
      service_areas: data.service_areas ? data.service_areas.split(",").map((s) => s.trim()) : [],
      equipment_types: data.equipment_types as EquipmentType[],
    };

    if (isEditing) {
      updateCarrier.mutate(carrierData, { onSuccess });
    } else {
      createCarrier.mutate(carrierData, { onSuccess });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="ABC Trucking LLC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dot_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DOT Number</FormLabel>
                <FormControl>
                  <Input placeholder="1234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mc_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MC Number</FormLabel>
                <FormControl>
                  <Input placeholder="MC-123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fleet Capacity (Number of Trucks)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="equipment_types"
          render={() => (
            <FormItem>
              <FormLabel>Equipment Types</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                {equipmentOptions.map((option) => (
                  <FormField
                    key={option.value}
                    control={form.control}
                    name="equipment_types"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const updated = checked
                                ? [...(field.value || []), option.value]
                                : field.value?.filter((val) => val !== option.value) || [];
                              field.onChange(updated);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {option.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="insurance_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Amount ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="insurance_expiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Expiry Date</FormLabel>
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
          name="service_areas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Areas (comma-separated states)</FormLabel>
              <FormControl>
                <Input placeholder="CA, NV, AZ, OR, WA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={createCarrier.isPending || updateCarrier.isPending}
          className="w-full"
        >
          {createCarrier.isPending || updateCarrier.isPending
            ? "Saving..."
            : isEditing
            ? "Update Profile"
            : "Create Profile"}
        </Button>
      </form>
    </Form>
  );
}
