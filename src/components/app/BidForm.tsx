import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useCreateBid } from "@/hooks/useBids";
import { Link } from "lucide-react";

const bidSchema = z.object({
  bid_amount: z.string().min(1, "Bid amount is required"),
  notes: z.string().optional(),
  tracking_url: z.string()
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: "Must be a valid URL starting with http:// or https://"
    }),
});

type BidFormData = z.infer<typeof bidSchema>;

interface BidFormProps {
  loadId: string;
  postedRate?: number;
  onSuccess?: () => void;
}

export function BidForm({ loadId, postedRate, onSuccess }: BidFormProps) {
  const createBid = useCreateBid();

  const form = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      bid_amount: postedRate?.toString() || "",
      notes: "",
      tracking_url: "",
    },
  });

  const onSubmit = async (data: BidFormData) => {
    createBid.mutate({
      load_id: loadId,
      bid_amount: parseFloat(data.bid_amount),
      notes: data.notes || null,
      tracking_url: data.tracking_url || null,
    }, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="bid_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bid Amount ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={postedRate ? postedRate.toString() : "2500.00"}
                  {...field}
                />
              </FormControl>
              {postedRate && (
                <FormDescription>
                  Posted rate: ${postedRate.toLocaleString()}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tracking_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tracking Link (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="url"
                    className="pl-10"
                    placeholder="https://track.myfleet.com/truck123"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Provide a URL where the shipper can track your truck
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information about your bid..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={createBid.isPending}
          className="w-full"
        >
          {createBid.isPending ? "Submitting..." : "Submit Bid"}
        </Button>
      </form>
    </Form>
  );
}
