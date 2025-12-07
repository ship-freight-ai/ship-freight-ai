import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function AppAITools() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">AI Tools</h1>

        <Card className="glass-card p-12 text-center">
          <Sparkles className="w-16 h-16 text-accent mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">AI Tools</h2>
          <p className="text-muted-foreground">
            AI-powered automation and insights coming soon
          </p>
        </Card>
      </div>
    </div>
  );
}
