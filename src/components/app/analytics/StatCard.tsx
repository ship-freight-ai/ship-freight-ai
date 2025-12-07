import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
  variant?: "default" | "destructive";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = "text-primary",
  description,
  variant = "default",
  trend 
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-2">{description}</p>
            )}
            {trend && (
              <p className={`text-sm mt-2 ${trend.isPositive ? "text-green-500" : "text-red-500"}`}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className={`${iconColor}`}>
            <Icon className="w-10 h-10" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
