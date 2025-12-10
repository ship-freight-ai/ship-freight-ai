import { useQuery } from "@tanstack/react-query";
import { MOCK_CARRIERS, CarrierProfile } from "@/data/mockCarriers";

export const useVerifiedCarriers = () => {
  return useQuery({
    queryKey: ["verified-carriers"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      return MOCK_CARRIERS as CarrierProfile[];
    },
  });
};

export const useCreateCarrierProfile = () => {
  return {
    mutate: (data: any, { onSuccess }: { onSuccess?: () => void }) => {
      console.log("Mock create carrier:", data);
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
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        id: "mock_carrier_id",
        created_at: new Date().toISOString(),
        user_id: "mock_user_id",
        company_name: "Mock Carrier LLC",
        dot_number: "1234567",
        mc_number: "MC-123",
        capacity: 5,
        equipment_types: ["dry_van", "reefer"],
        verification_status: "verified",
        rating: 4.8,
        total_loads: 152,
        on_time_percentage: 98,
        insurance_amount: 1000000,
        insurance_expiry: new Date(Date.now() + 86400000 * 365).toISOString(),
        service_areas: ["CA", "NV", "AZ"]
      };
    },
  });
};
