import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Truck, MapPinOff, Construction } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {/* Animated Truck Scene */}
        <div className="relative h-64 mb-8 overflow-hidden">
          {/* Road */}
          <div className="absolute bottom-8 left-0 right-0 h-4 bg-muted-foreground/20 rounded-full" />
          <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-8">
            <div className="w-16 h-1 bg-yellow-400/60 rounded" />
            <div className="w-16 h-1 bg-yellow-400/60 rounded" />
            <div className="w-16 h-1 bg-yellow-400/60 rounded" />
            <div className="w-16 h-1 bg-yellow-400/60 rounded" />
          </div>

          {/* Broken Road Sign */}
          <motion.div
            initial={{ rotate: -15 }}
            animate={{ rotate: [-15, -10, -15] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute left-1/4 bottom-16"
          >
            <div className="relative">
              <div className="w-2 h-24 bg-gradient-to-t from-muted-foreground/40 to-muted-foreground/20 rounded" />
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-16 bg-red-500/80 rounded-lg flex items-center justify-center shadow-lg transform -rotate-12">
                <MapPinOff className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Animated Truck */}
          <motion.div
            initial={{ x: "200%" }}
            animate={{ x: "-100%" }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-12"
          >
            <div className="flex items-end">
              {/* Trailer */}
              <div className="w-32 h-20 bg-gradient-to-b from-primary/80 to-primary rounded-t-lg relative">
                <div className="absolute inset-2 border-2 border-primary-foreground/20 rounded" />
                <div className="absolute bottom-0 left-4 w-6 h-6 bg-muted-foreground/60 rounded-full border-4 border-muted-foreground/40" />
                <div className="absolute bottom-0 right-4 w-6 h-6 bg-muted-foreground/60 rounded-full border-4 border-muted-foreground/40" />
              </div>
              {/* Cab */}
              <div className="relative -ml-1">
                <div className="w-16 h-14 bg-gradient-to-b from-blue-400 to-blue-500 rounded-t-xl" />
                <div className="absolute top-2 left-2 w-10 h-6 bg-sky-300/60 rounded" />
                <div className="w-16 h-8 bg-gradient-to-b from-muted-foreground/60 to-muted-foreground/40 rounded-b" />
                <div className="absolute bottom-0 left-2 w-5 h-5 bg-muted-foreground/60 rounded-full border-4 border-muted-foreground/40" />
                <div className="absolute bottom-0 right-2 w-5 h-5 bg-muted-foreground/60 rounded-full border-4 border-muted-foreground/40" />
              </div>
            </div>
          </motion.div>

          {/* Construction Cone */}
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute right-1/4 bottom-12"
          >
            <Construction className="w-12 h-12 text-orange-500/80" />
          </motion.div>
        </div>

        {/* Error Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-8xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Wrong Turn, Driver! 🚛
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Looks like this load got lost in transit. The route you're looking for doesn't exist or has been moved to a new destination.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Back to Home Base
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2" onClick={() => window.history.back()}>
            <span onClick={() => window.history.back()} className="cursor-pointer flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </span>
          </Button>
        </motion.div>

        {/* Fun Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-sm text-muted-foreground/60 flex items-center justify-center gap-2"
        >
          <Truck className="w-4 h-4" />
          Ship AI - Getting you back on track
        </motion.p>
      </div>
    </div>
  );
};

export default NotFound;
