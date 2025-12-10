import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useVerifiedCarriers } from "@/hooks/useCarriers";
import { CarrierCard } from "@/components/app/CarrierCard";
import { Search, Building2, SlidersHorizontal, UserCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function AppCarriers() {
  const { data: carriers, isLoading } = useVerifiedCarriers();
  const [searchQuery, setSearchQuery] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filteredCarriers = carriers?.filter((carrier) => {
    const matchesSearch =
      carrier.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      carrier.dot_number.includes(searchQuery) ||
      carrier.mc_number.includes(searchQuery);

    const matchesEquipment =
      equipmentFilter === "all" ||
      carrier.equipment_types.includes(equipmentFilter);

    const matchesVerified = !verifiedOnly || carrier.verified;

    return matchesSearch && matchesEquipment && matchesVerified;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verified Carriers</h1>
          <p className="text-muted-foreground">
            Search our network of DOT-verified carriers for your next shipment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-green-500/10 text-green-600 border-green-500/20">
            <UserCheck className="w-3 h-3 mr-1" />
            {carriers?.length || 0} Verify Partners
          </Badge>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Company Name, DOT #, or MC #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="w-full md:w-48 space-y-2">
            <Label>Equipment Type</Label>
            <Select
              value={equipmentFilter}
              onValueChange={setEquipmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
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
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Switch
              id="verified-mode"
              checked={verifiedOnly}
              onCheckedChange={setVerifiedOnly}
            />
            <Label htmlFor="verified-mode" className="cursor-pointer">
              Verified Only
            </Label>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : filteredCarriers && filteredCarriers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCarriers.map((carrier) => (
            <CarrierCard key={carrier.id} carrier={carrier} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <SlidersHorizontal className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No carriers match your search</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Try adjusting your filters or search terms to find more results.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setSearchQuery("");
              setEquipmentFilter("all");
              setVerifiedOnly(false);
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
