import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateRating } from "@/hooks/useRatings";

const ratingSchema = z.object({
  overall_rating: z.number().min(1).max(5),
  on_time: z.boolean(),
  communication_rating: z.number().min(0).max(5).optional(),
  condition_rating: z.number().min(0).max(5).optional(),
  professionalism_rating: z.number().min(0).max(5).optional(),
  comments: z.string().max(500).optional(),
});

type RatingFormValues = z.infer<typeof ratingSchema>;

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadId: string;
  carrierId: string;
  carrierName: string;
}

const StarRating = ({
  value,
  onChange,
  label,
  required = false,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  required?: boolean;
}) => {
  return (
    <div className="space-y-2">
      <FormLabel>
        {label} {required && <span className="text-destructive">*</span>}
      </FormLabel>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-colors hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export function RatingDialog({
  open,
  onOpenChange,
  loadId,
  carrierId,
  carrierName,
}: RatingDialogProps) {
  const createRating = useCreateRating();
  const [overallRating, setOverallRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [conditionRating, setConditionRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);

  const form = useForm<RatingFormValues>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      overall_rating: 5,
      on_time: true,
      communication_rating: 0,
      condition_rating: 0,
      professionalism_rating: 0,
      comments: "",
    },
  });

  const onSubmit = async (data: RatingFormValues) => {
    const ratingData = {
      load_id: loadId,
      carrier_id: carrierId,
      overall_rating: overallRating,
      on_time: data.on_time,
      communication_rating: communicationRating > 0 ? communicationRating : null,
      condition_rating: conditionRating > 0 ? conditionRating : null,
      professionalism_rating: professionalismRating > 0 ? professionalismRating : null,
      comments: data.comments || null,
    };

    await createRating.mutateAsync(ratingData);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Carrier</DialogTitle>
          <DialogDescription>
            Share your experience with {carrierName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              label="Overall Rating"
              required
            />

            <FormField
              control={form.control}
              name="on_time"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">
                    Delivered on time
                  </FormLabel>
                </FormItem>
              )}
            />

            <StarRating
              value={communicationRating}
              onChange={setCommunicationRating}
              label="Communication (Optional)"
            />

            <StarRating
              value={conditionRating}
              onChange={setConditionRating}
              label="Load Condition (Optional)"
            />

            <StarRating
              value={professionalismRating}
              onChange={setProfessionalismRating}
              label="Professionalism (Optional)"
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share your experience..."
                      className="resize-none"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRating.isPending}>
                {createRating.isPending ? "Submitting..." : "Submit Rating"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
