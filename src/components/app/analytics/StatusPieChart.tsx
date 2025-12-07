import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface StatusPieChartProps {
  data: Record<string, number>;
  title: string;
}

const COLORS = {
  draft: "hsl(var(--muted))",
  posted: "hsl(var(--primary))",
  bidding: "hsl(221, 83%, 53%)",
  booked: "hsl(142, 76%, 36%)",
  in_transit: "hsl(48, 96%, 53%)",
  delivered: "hsl(142, 76%, 36%)",
  completed: "hsl(142, 76%, 36%)",
  cancelled: "hsl(var(--destructive))",
  pending: "hsl(48, 96%, 53%)",
  held_in_escrow: "hsl(221, 83%, 53%)",
  released: "hsl(142, 76%, 36%)",
  failed: "hsl(var(--destructive))",
  disputed: "hsl(var(--destructive))",
  accepted: "hsl(142, 76%, 36%)",
  rejected: "hsl(var(--destructive))",
};

export default function StatusPieChart({ data, title }: StatusPieChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    value,
  }));

  const getColor = (name: string): string => {
    const key = name.toLowerCase().replace(/ /g, "_");
    return COLORS[key as keyof typeof COLORS] || "hsl(var(--primary))";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getColor(entry.name)} 
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--background))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }} 
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
