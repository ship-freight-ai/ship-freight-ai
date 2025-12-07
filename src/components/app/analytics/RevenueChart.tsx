import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface RevenueChartProps {
  data: Array<{
    month: string;
    revenue: number;
    completed: number;
  }>;
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trends (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--background))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Total Revenue"
              dot={{ fill: "hsl(var(--primary))" }}
            />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="hsl(142, 76%, 36%)" 
              strokeWidth={2}
              name="Paid Amount"
              dot={{ fill: "hsl(142, 76%, 36%)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
