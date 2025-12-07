import { Star, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CarrierRatingBadgeProps {
  rating?: number | null;
  totalLoads?: number | null;
  onTimePercentage?: number | null;
  variant?: "compact" | "detailed";
}

export function CarrierRatingBadge({
  rating,
  totalLoads,
  onTimePercentage,
  variant = "compact",
}: CarrierRatingBadgeProps) {
  if (!rating && !totalLoads) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        No ratings yet
      </Badge>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600 dark:text-green-400";
    if (rating >= 3.5) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getOnTimeColor = (percentage: number) => {
    if (percentage >= 95) return "text-green-600 dark:text-green-400";
    if (percentage >= 85) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 text-sm">
        {rating && (
          <div className={`flex items-center gap-1 font-semibold ${getRatingColor(rating)}`}>
            <Star className="h-4 w-4 fill-current" />
            <span>{rating.toFixed(1)}</span>
          </div>
        )}
        {totalLoads && totalLoads > 0 && (
          <span className="text-muted-foreground">({totalLoads} loads)</span>
        )}
        {onTimePercentage !== null && onTimePercentage !== undefined && (
          <div className={`flex items-center gap-1 ${getOnTimeColor(onTimePercentage)}`}>
            <TrendingUp className="h-4 w-4" />
            <span>{onTimePercentage.toFixed(0)}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {rating && (
        <Badge variant="outline" className={getRatingColor(rating)}>
          <Star className="h-3 w-3 mr-1 fill-current" />
          {rating.toFixed(1)} Rating
        </Badge>
      )}
      {totalLoads && totalLoads > 0 && (
        <Badge variant="outline">
          {totalLoads} {totalLoads === 1 ? "Load" : "Loads"}
        </Badge>
      )}
      {onTimePercentage !== null && onTimePercentage !== undefined && (
        <Badge variant="outline" className={getOnTimeColor(onTimePercentage)}>
          <TrendingUp className="h-3 w-3 mr-1" />
          {onTimePercentage.toFixed(0)}% On-time
        </Badge>
      )}
    </div>
  );
}
