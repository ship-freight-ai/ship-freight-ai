import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    variant?: "primary" | "secondary" | "white";
}

export function LoadingSpinner({
    size = "md",
    className,
    variant = "primary",
    ...props
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12"
    };

    const variantClasses = {
        primary: "text-primary",
        secondary: "text-muted-foreground",
        white: "text-white"
    };

    return (
        <div className={cn("flex justify-center items-center animate-in fade-in duration-300", className)} {...props}>
            <Loader2
                className={cn(
                    "animate-spin",
                    sizeClasses[size],
                    variantClasses[variant]
                )}
            />
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm relative z-50">
            <LoadingSpinner size="xl" />
            <p className="mt-4 text-muted-foreground font-medium animate-pulse">Loading Ship AI...</p>
        </div>
    );
}
