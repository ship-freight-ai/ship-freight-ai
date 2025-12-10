import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, Menu, X, Moon, Sun } from "lucide-react";
import logo from "@/assets/logo.png";
import { useState } from "react";
import { useTheme } from "next-themes";
export const NavSite = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    theme,
    setTheme
  } = useTheme();
  return <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
    <div className="container mx-auto px-8 h-20 flex items-center gap-12 relative">
      {/* Logo - Left aligned */}
      <a href="https://shipfreight.ai/" className="flex items-center gap-3 group shrink-0">
        <img src={logo} alt="Ship AI" className="h-28 w-auto logo-hover" />
      </a>

      {/* Mobile Menu Button */}
      <Button variant="ghost" size="icon" className="lg:hidden ml-auto" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Desktop Navigation Links - Left aligned next to logo */}
      <div className="hidden lg:flex items-center gap-8">
        <Link to="/site/about" className="text-base font-semibold hover:text-primary transition-colors relative group whitespace-nowrap">
          About
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
        </Link>
        <Link to="/site/roles" className="text-base font-semibold hover:text-primary transition-colors relative group whitespace-nowrap">
          Shippers &amp; Carriers
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
        </Link>
        <Link to="/site/trust" className="text-base font-semibold hover:text-primary transition-colors relative group whitespace-nowrap">
          Trust & Safety
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
        </Link>
        <Link to="/site/roi-calculator" className="text-base font-semibold hover:text-primary transition-colors relative group whitespace-nowrap">
          Savings
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
        </Link>
        <Link to="/site/pricing" className="text-base font-semibold hover:text-primary transition-colors relative group whitespace-nowrap">
          Pricing
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
        </Link>
      </div>

      {/* Right Actions - Desktop */}
      <div className="hidden lg:flex items-center gap-3 shrink-0 ml-auto">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="transition-all hover:scale-105">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost" asChild className="transition-all hover:scale-105">
          <Link to="/site/contact" className="flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </Link>
        </Button>
        <Button variant="ghost" asChild className="transition-all hover:scale-105">
          <Link to="/site/auth?mode=login">Log in</Link>
        </Button>
        <Button variant="default" asChild className="shimmer transition-all hover:scale-105 hover:shadow-lg">
          <Link to="/site/auth?mode=signup">Get started</Link>
        </Button>
      </div>
    </div>

    {/* Mobile Menu */}
    {
      mobileMenuOpen && <div className="lg:hidden glass-card border-t border-border/50 animate-fade-in">
        <div className="container mx-auto px-8 py-6 flex flex-col gap-4">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="Ship AI" className="h-24 w-auto" />
          </div>

          {/* Mobile Navigation Links */}
          <Link to="/site/about" className="text-base font-semibold hover:text-primary transition-colors py-2 border-b border-border/50" onClick={() => setMobileMenuOpen(false)}>
            About
          </Link>
          <Link to="/site/roles" className="text-base font-semibold hover:text-primary transition-colors py-2 border-b border-border/50" onClick={() => setMobileMenuOpen(false)}>
            For Shippers & Carriers
          </Link>
          <Link to="/site/trust" className="text-base font-semibold hover:text-primary transition-colors py-2 border-b border-border/50" onClick={() => setMobileMenuOpen(false)}>
            Trust & Safety
          </Link>
          <Link to="/site/roi-calculator" className="text-base font-semibold hover:text-primary transition-colors py-2 border-b border-border/50" onClick={() => setMobileMenuOpen(false)}>
            ROI Calculator
          </Link>
          <Link to="/site/pricing" className="text-base font-semibold hover:text-primary transition-colors py-2 border-b border-border/50" onClick={() => setMobileMenuOpen(false)}>
            Pricing
          </Link>

          {/* Mobile Action Buttons */}
          <div className="flex flex-col gap-3 mt-4">
            <Button variant="ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-full">
              <Sun className="h-5 w-5 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/site/contact" onClick={() => setMobileMenuOpen(false)}>
                <Mail className="w-5 h-5 mr-2" />
                Contact
              </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/site/auth?mode=login" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
            </Button>
            <Button variant="default" asChild className="w-full shimmer">
              <Link to="/site/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>Get started</Link>
            </Button>
          </div>
        </div>
      </div>
    }
  </nav >;
};