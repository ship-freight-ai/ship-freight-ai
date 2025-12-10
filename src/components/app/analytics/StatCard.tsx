import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
  id?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  id
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`group relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ${className || ''}`}
        id={id}
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {description && (
                <p className="text-xs text-muted-foreground/80 pt-1">{description}</p>
              )}
              {trend && (
                <div className={`flex items-center gap-1 text-sm font-medium pt-2 ${trend.isPositive ? "text-green-500" : "text-red-500"}`}>
                  {trend.isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{Math.abs(trend.value)}%</span>
                  <span className="text-muted-foreground/60 text-xs ml-1">vs last month</span>
                </div>
              )}
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
