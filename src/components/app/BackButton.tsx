import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export const BackButton = ({ to, label = "Back", className }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="ghost"
        onClick={handleClick}
        className={className}
      >
        <motion.div
          whileHover={{ x: -4 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
        </motion.div>
        {label}
      </Button>
    </motion.div>
  );
};
