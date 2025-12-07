import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface LoadStatsChartProps {
  data: Array<{
    month: string;
    total: number;
    completed: number;
    cancelled: number;
  }>;
}

export default function LoadStatsChart({ data }: LoadStatsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Load Trends (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--background))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }} 
            />
            <Legend />
            <Bar dataKey="total" fill="hsl(var(--primary))" name="Total Loads" />
            <Bar dataKey="completed" fill="hsl(142, 76%, 36%)" name="Completed" />
            <Bar dataKey="cancelled" fill="hsl(var(--destructive))" name="Cancelled" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
