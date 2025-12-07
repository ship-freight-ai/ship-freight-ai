import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useVerifiedCarriers } from "@/hooks/useCarriers";
import { CarrierCard } from "@/components/app/CarrierCard";
import { Search, Building2 } from "lucide-react";
import { useState } from "react";

export default function AppCarriers() {
  const { data: carriers, isLoading } = useVerifiedCarriers();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCarriers = carriers?.filter(
    (carrier) =>
      carrier.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      carrier.dot_number.includes(searchQuery) ||
      carrier.mc_number.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Verified Carriers</h1>
          <p className="text-muted-foreground">Browse our network of verified carriers</p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name, DOT, or MC number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted" />
            ))}
          </div>
        ) : filteredCarriers && filteredCarriers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCarriers.map((carrier) => (
              <CarrierCard key={carrier.id} carrier={carrier} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No carriers found</h2>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search terms"
                : "No verified carriers available at this time"}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
