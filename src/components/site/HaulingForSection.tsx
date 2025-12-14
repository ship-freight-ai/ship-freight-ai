import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";

/**
 * Recognizable shipper brand logos for social proof
 * Using text-based logos for theme compatibility
 */
const shipperBrands = [
    { name: "Walmart", color: "#0071CE" },
    { name: "Home Depot", color: "#F96302" },
    { name: "Target", color: "#CC0000" },
    { name: "Amazon", color: "#FF9900" },
    { name: "Costco", color: "#E31837" },
    { name: "Lowe's", color: "#004990" },
    { name: "FedEx", color: "#4D148C" },
    { name: "UPS", color: "#351C15" },
];

const BrandLogo = ({ name, color }: { name: string; color: string }) => (
    <div
        className="flex items-center justify-center px-6 py-4 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/30 hover:shadow-lg group min-w-[140px]"
    >
        <span
            className="text-lg font-bold tracking-tight opacity-70 group-hover:opacity-100 transition-opacity"
            style={{ color }}
        >
            {name}
        </span>
    </div>
);

export const HaulingForSection = () => {
    return (
        <section className="py-16 overflow-hidden bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10"
                >
                    <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm rounded-full border-primary/30 bg-primary/5 text-primary">
                        <Truck className="w-3.5 h-3.5 mr-2" />
                        Trusted Network
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">
                        Hauling For
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Our verified carriers deliver for America's most recognized brands
                    </p>
                </motion.div>

                {/* Scrolling Carousel */}
                <div className="relative">
                    {/* Gradient Masks */}
                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="flex overflow-hidden"
                    >
                        <div className="flex animate-scroll-slow gap-6">
                            {/* First set */}
                            <div className="flex gap-6 shrink-0">
                                {shipperBrands.map((brand) => (
                                    <BrandLogo key={`set1-${brand.name}`} {...brand} />
                                ))}
                            </div>
                            {/* Duplicate for seamless loop */}
                            <div className="flex gap-6 shrink-0">
                                {shipperBrands.map((brand) => (
                                    <BrandLogo key={`set2-${brand.name}`} {...brand} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex justify-center gap-12 mt-10 text-center"
                >
                    <div>
                        <div className="text-3xl font-bold text-foreground">5,000+</div>
                        <div className="text-sm text-muted-foreground">Verified Carriers</div>
                    </div>
                    <div className="w-px bg-border/50" />
                    <div>
                        <div className="text-3xl font-bold text-foreground">50+</div>
                        <div className="text-sm text-muted-foreground">States Covered</div>
                    </div>
                    <div className="w-px bg-border/50" />
                    <div>
                        <div className="text-3xl font-bold text-foreground">$2.4M+</div>
                        <div className="text-sm text-muted-foreground">Saved for Customers</div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
