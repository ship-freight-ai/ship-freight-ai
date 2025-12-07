import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useLoadsList, type LoadFilters } from "@/hooks/useLoads";
import { LoadCard } from "@/components/app/LoadCard";
import { LoadForm } from "@/components/app/LoadForm";
import { BackButton } from "@/components/app/BackButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

function AppLoadsContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<LoadFilters>({});
  const pageSize = 20;

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      return data;
    },
  });

  const { data: loadsData, isLoading } = useLoadsList(
    profile?.role === "carrier" ? "carrier" : "shipper",
    filters,
    page,
    pageSize
  );

  const loads = loadsData?.data || [];
  const totalCount = loadsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const isShipper = profile?.role === "shipper";
  const isCarrier = profile?.role === "carrier";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-4xl font-bold mb-2 mt-2">Loads</h1>
          <p className="text-muted-foreground">
            {isShipper ? "Manage your shipments" : "Browse available loads"}
          </p>
        </div>
        {isShipper && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="w-4 h-4 mr-2" />
                Post Load
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Load</DialogTitle>
              </DialogHeader>
              <LoadForm onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isCarrier && (
        <Card className="p-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:w-auto mb-4"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <Label>Equipment Type</Label>
                <Select
                  value={filters.equipment_type || "all"}
                  onValueChange={(value) =>
                    setFilters({ ...filters, equipment_type: value === "all" ? undefined : value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="dry_van">Dry Van</SelectItem>
                    <SelectItem value="reefer">Reefer</SelectItem>
                    <SelectItem value="flatbed">Flatbed</SelectItem>
                    <SelectItem value="step_deck">Step Deck</SelectItem>
                    <SelectItem value="power_only">Power Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Origin State</Label>
                <Input
                  placeholder="e.g., CA"
                  maxLength={2}
                  value={filters.origin_state || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, origin_state: e.target.value || undefined })
                  }
                />
              </div>
              
              <div>
                <Label>Destination State</Label>
                <Input
                  placeholder="e.g., NY"
                  maxLength={2}
                  value={filters.destination_state || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, destination_state: e.target.value || undefined })
                  }
                />
              </div>
              
              <div>
                <Label>Min Rate ($)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.min_rate || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, min_rate: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
              
              <div>
                <Label>Max Rate ($)</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={filters.max_rate || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, max_rate: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
              
              <div>
                <Label>Pickup From</Label>
                <Input
                  type="date"
                  value={filters.pickup_date_from || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, pickup_date_from: e.target.value || undefined })
                  }
                />
              </div>
              
              <div>
                <Label>Pickup To</Label>
                <Input
                  type="date"
                  value={filters.pickup_date_to || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, pickup_date_to: e.target.value || undefined })
                  }
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({});
                    setPage(0);
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted" />
            ))}
          </div>
        ) : loads && loads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loads.map((load) => (
              <LoadCard key={load.id} load={load} />
            ))}
          </div>
        ) : (
          <Card className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {isShipper ? "No loads yet" : "No available loads"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isShipper
                ? "Post your first load to get started"
                : "Check back later for available loads"}
            </p>
            {isShipper && (
              <Button variant="default" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Load
              </Button>
            )}
          </Card>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalCount)} of {totalCount} loads
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppLoads() {
  return (
    <ErrorBoundary>
      <AppLoadsContent />
    </ErrorBoundary>
  );
}
