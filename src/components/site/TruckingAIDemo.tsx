import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, MessageSquare, BarChart3, FileText, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const demoExamples = {
  extract_shipment: {
    icon: MessageSquare,
    title: "Extract Shipment Details",
    input: `Hey, I need to move 40,000 lbs of steel coils from Chicago, IL to Houston, TX. 
Pickup needs to be June 15th between 8am-5pm, delivery by June 18th before noon. 
It's temperature sensitive, needs to stay above 50°F. BOL #CH-2024-1523.`,
    description: "Watch AI extract structured data from an unstructured message"
  },
  followup: {
    icon: Clock,
    title: "Auto Follow-up",
    input: `Load #TRK-8472 - Chicago to Miami, currently in transit near Atlanta. 
Carrier: ABC Trucking, Driver: John Smith. Expected delivery tomorrow 2pm.`,
    description: "AI generates professional follow-up messages automatically"
  },
  rate_suggestion: {
    icon: BarChart3,
    title: "Smart Rate Analysis",
    input: `Lane: Los Angeles, CA to Seattle, WA
Distance: 1,135 miles
Freight: 45,000 lbs dry van
Season: Summer peak
Recent loads: $2,800-$3,200`,
    description: "Get AI-powered rate recommendations based on market data"
  },
  status_recap: {
    icon: FileText,
    title: "Status Summary",
    input: `Load #9234: Picked up Dallas 6/14 8:30am, currently in Little Rock AR (on schedule), 
POD received for previous stop, driver reports no issues, ETA Memphis tonight 10pm, 
final delivery Nashville 6/16 morning. Customer contacted, all good.`,
    description: "AI creates instant status summaries for stakeholders"
  }
};

export const TruckingAIDemo = () => {
  const [activeDemo, setActiveDemo] = useState<keyof typeof demoExamples>("extract_shipment");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>("");
  const { toast } = useToast();

  const runDemo = async (demoType: keyof typeof demoExamples) => {
    setIsLoading(true);
    setResponse("");
    
    try {
      const example = demoExamples[demoType];
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trucking-ai-demo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          demoType,
          input: example.input
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to process demo");
      }

      const data = await res.json();
      setResponse(data.response);
      
    } catch (error) {
      console.error("Demo error:", error);
      toast({
        title: "Demo Error",
        description: error instanceof Error ? error.message : "Failed to run demo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Tabs value={activeDemo} onValueChange={(v) => setActiveDemo(v as keyof typeof demoExamples)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
          {Object.entries(demoExamples).map(([key, demo]) => {
            const Icon = demo.icon;
            return (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{demo.title.split(" ")[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(demoExamples).map(([key, demo]) => {
          const Icon = demo.icon;
          return (
            <TabsContent key={key} value={key} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-card p-6 border-accent/20">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{demo.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{demo.description}</p>
                    </div>
                  </div>

                  {/* Input Example */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Example Input:
                    </label>
                    <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                      <pre className="text-sm whitespace-pre-wrap font-mono text-foreground">
                        {demo.input}
                      </pre>
                    </div>
                  </div>

                  {/* Run Demo Button */}
                  <Button
                    onClick={() => runDemo(key as keyof typeof demoExamples)}
                    disabled={isLoading}
                    className="w-full md:w-auto gap-2 shimmer"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Run AI Demo
                      </>
                    )}
                  </Button>

                  {/* AI Response */}
                  {response && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <label className="text-sm font-medium text-accent mb-2 block flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Response:
                      </label>
                      <div className="bg-gradient-to-br from-accent/5 to-primary/5 rounded-lg p-6 border-2 border-accent/30">
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-foreground font-sans">
                            {response}
                          </pre>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          ✨ Powered by live AI - Try each demo to see real-time analysis
        </p>
      </div>
    </div>
  );
};
