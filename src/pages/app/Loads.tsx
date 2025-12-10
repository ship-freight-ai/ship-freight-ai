import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Filter, ChevronLeft, ChevronRight, Package, Search, X, SlidersHorizontal } from "lucide-react";
import { useLoadsList, type LoadFilters } from "@/hooks/useLoads";
import { LoadCard } from "@/components/app/LoadCard";
import { LoadForm } from "@/components/app/LoadForm";
import { BackButton } from "@/components/app/BackButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

function AppLoadsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Auto-open dialog when coming from dashboard with ?new=true
  useEffect(() => {
    if (searchParams.get("new") === "true" && isShipper) {
      setDialogOpen(true);
      // Clear the query param so refreshing doesn't reopen
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, isShipper]);

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== "").length;

  const clearFilters = () => {
    setFilters({});
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isShipper ? "My Loads" : "Find Loads"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isShipper ? "Manage and track all your shipments" : "Browse available loads and place bids"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isCarrier && (
            <Button
              variant={showFilters ? "secondary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}
          {isShipper && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Load
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
      </motion.div>

      {/* Filters Panel - Carrier Only */}
      <AnimatePresence>
        {isCarrier && showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    Filter Loads
                  </CardTitle>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Equipment</Label>
                    <Select
                      value={filters.equipment_type || "all"}
                      onValueChange={(value) =>
                        setFilters({ ...filters, equipment_type: value === "all" ? undefined : value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
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

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Origin</Label>
                    <Input
                      placeholder="State (e.g., CA)"
                      maxLength={2}
                      value={filters.origin_state || ""}
                      onChange={(e) =>
                        setFilters({ ...filters, origin_state: e.target.value.toUpperCase() || undefined })
                      }
                      className="uppercase"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Destination</Label>
                    <Input
                      placeholder="State (e.g., NY)"
                      maxLength={2}
                      value={filters.destination_state || ""}
                      onChange={(e) =>
                        setFilters({ ...filters, destination_state: e.target.value.toUpperCase() || undefined })
                      }
                      className="uppercase"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Rate Range</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.min_rate || ""}
                        onChange={(e) =>
                          setFilters({ ...filters, min_rate: e.target.value ? Number(e.target.value) : undefined })
                        }
                        className="w-full"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.max_rate || ""}
                        onChange={(e) =>
                          setFilters({ ...filters, max_rate: e.target.value ? Number(e.target.value) : undefined })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <p className="text-sm text-muted-foreground">
            {totalCount > 0 ? (
              <>Showing <span className="font-medium text-foreground">{loads.length}</span> of <span className="font-medium text-foreground">{totalCount}</span> loads</>
            ) : (
              "No loads found"
            )}
          </p>
        </motion.div>
      )}

      {/* Loads Grid */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : loads && loads.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loads.map((load, index) => (
              <motion.div
                key={load.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <LoadCard load={load} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-border/50 p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                {isShipper ? (
                  <Package className="w-10 h-10 text-primary" />
                ) : (
                  <Search className="w-10 h-10 text-primary" />
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {isShipper ? "No loads yet" : "No loads available"}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {isShipper
                  ? "Post your first load to start connecting with carriers and moving freight"
                  : activeFilterCount > 0
                    ? "Try adjusting your filters to see more results"
                    : "Check back soon for new loads in your area"}
              </p>
              {isShipper ? (
                <Button size="lg" onClick={() => setDialogOpen(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Load
                </Button>
              ) : activeFilterCount > 0 ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : null}
            </Card>
          </motion.div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between pt-4 border-t border-border/50"
        >
          <p className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{page + 1}</span> of <span className="font-medium text-foreground">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
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
