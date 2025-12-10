
import { useState, useEffect } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronRight, X } from "lucide-react";

export interface TourStep {
    targetId: string; // ID of the element to attach to
    title: string;
    content: string;
    position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
    tourId: string; // Unique ID for localStorage persistence
    steps: TourStep[];
}

export function OnboardingTour({ tourId, steps }: OnboardingTourProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

    // Check if tour has been completed
    useEffect(() => {
        const hasSeenTour = localStorage.getItem(`tour_completed_${tourId}`);
        if (!hasSeenTour) {
            // Small delay to allow page UI to mount
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [tourId]);

    // Find target element for current step
    useEffect(() => {
        if (!isOpen) return;

        const currentStep = steps[currentStepIndex];
        if (currentStep) {
            const element = document.getElementById(currentStep.targetId);
            if (element) {
                setAnchorElement(element);
                // Scroll into view if needed
                element.scrollIntoView({ behavior: "smooth", block: "center" });

                // Add a temporary highlight class or style
                element.classList.add("ring-2", "ring-primary", "ring-offset-2");
            } else {
                // If target not found, maybe skip or wait? 
                // For now, let's just log and maybe close strict mode
                console.warn(`Tour target #${currentStep.targetId} not found`);
            }
        }

        return () => {
            // Cleanup highlight
            if (currentStep) {
                const element = document.getElementById(currentStep.targetId);
                element?.classList.remove("ring-2", "ring-primary", "ring-offset-2");
            }
        };
    }, [currentStepIndex, isOpen, steps]);

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            completeTour();
        }
    };

    const completeTour = () => {
        setIsOpen(false);
        localStorage.setItem(`tour_completed_${tourId}`, "true");
    };

    const handleSkip = () => {
        completeTour();
    };

    if (!isOpen || !anchorElement) return null;

    // We are using a portal-like approach by using the anchor element logic of Radix if possible,
    // but Radix Popover usually wraps the trigger. 
    // Since we can't easily wrap existing elements in the DOM dynamically without portal magic,
    // a cleaner "overlay" approach might be better, OR we use a library.
    // BUT, to stick to the plan: simple popover. 
    // We can render a hidden trigger at the position of the anchor element using absolute positioning.

    const rect = anchorElement.getBoundingClientRect();
    const style = {
        position: 'absolute' as const,
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
        pointerEvents: 'none' as const, // Let clicks pass through to the element
    };

    return (
        // Render into body/portal usually, but here we just render in place if this component is placed high in the tree
        // Actually, standard Popover expects a trigger. 
        // Let's make a floating implementation using specific positioning.

        <div className="absolute top-0 left-0 w-full h-full z-50 pointer-events-none">
            {/* Overlay (optional) */}
            {/* <div className="fixed inset-0 bg-black/20" /> */}

            {/* Positioning Container */}
            <div style={style}>
                <Popover open={true}>
                    <PopoverTrigger asChild>
                        <div className="w-full h-full" />
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-80 p-0 pointer-events-auto"
                        side={steps[currentStepIndex].position || "bottom"}
                        align="center"
                        sideOffset={10}
                    >
                        <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                            <div className="bg-primary/5 p-4 border-b border-border flex justify-between items-center">
                                <h4 className="font-semibold text-foreground">
                                    {steps[currentStepIndex].title}
                                </h4>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSkip}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-foreground/80 mb-4">
                                    {steps[currentStepIndex].content}
                                </p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">
                                        Step {currentStepIndex + 1} of {steps.length}
                                    </span>
                                    <Button size="sm" onClick={handleNext} className="gap-2">
                                        {currentStepIndex === steps.length - 1 ? "Finish" : "Next"}
                                        <ChevronRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
