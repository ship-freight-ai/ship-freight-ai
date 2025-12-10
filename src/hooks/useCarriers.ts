import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarrierProfile } from "@/data/mockCarriers";

export const useVerifiedCarriers = () => {
  return useQuery({
    queryKey: ["verified-carriers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carriers")
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .eq("verification_status", "verified");

      if (error) {
        console.error("Error fetching carriers:", error);
        throw error;
      }

      // Map DB response to CarrierProfile interface
      return data.map((carrier: any) => ({
        id: carrier.id,
        company_name: carrier.company_name,
        dot_number: carrier.dot_number || "N/A",
        mc_number: carrier.mc_number || "N/A",
        // Defaulting location since it's not in the main table yet
        city: "Verified",
        state: "Carrier",
        rating: Number(carrier.rating) || 0,
        verified: true,
        reviews_count: 0,
        equipment_types: carrier.equipment_types || [],
        lanes: (carrier.service_areas || []).map((area: string) => ({ origin: "US", dest: area })),
        fleet_size: carrier.capacity || 1,
        years_in_business: 1,
        insurance_active: true, // Assuming active if verified
        contact_email: carrier.profiles?.email || "",
        phone: ""
      })) as CarrierProfile[];
    },
  });
};

export const useCreateCarrierProfile = () => {
  return {
    mutate: (data: any, { onSuccess }: { onSuccess?: () => void }) => {
      // Logic handled in Auth now
      console.log("Create carrier handled via Auth flow");
      setTimeout(() => onSuccess?.(), 500);
    },
    isPending: false
  };
};

export const useUpdateCarrierProfile = () => {
  return {
    mutate: (data: any, { onSuccess }: { onSuccess?: () => void }) => {
      console.log("Mock update carrier:", data);
      setTimeout(() => onSuccess?.(), 500);
    },
    isPending: false
  };
};

export const useCarrierProfile = () => {
  return useQuery({
    queryKey: ["carrier-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("carriers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) return null;

      return {
        ...data,
        insurance_amount: Number(data.insurance_amount) || 0,
        capacity: data.capacity || 0,
        rating: Number(data.rating) || 0,
        on_time_percentage: Number(data.on_time_percentage) || 0,
        total_loads: data.total_loads || 0,
      };
    },
  });
};
