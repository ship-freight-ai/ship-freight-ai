import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Linkedin, Twitter, Github, Mail } from "lucide-react";

export const FooterSite = () => {
  return (
    <footer className="border-t border-border/50 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link to="/site" className="flex items-center gap-3 mb-4 group">
              <img src={logo} alt="Ship AI" className="h-10 w-auto transition-transform group-hover:scale-105" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Ship AI</span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-xs leading-relaxed">
              Brokerless Freight, AI-Powered. Connecting quality, insured carriers with shippers of all sizes.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a href="https://twitter.com/shipfreightai" target="_blank" rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com/company/shipfreightai" target="_blank" rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="mailto:hello@shipfreight.ai"
                className="p-2.5 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/site/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/site/roles" className="text-muted-foreground hover:text-primary transition-colors">
                  For Shippers & Carriers
                </Link>
              </li>
              <li>
                <Link to="/site/trust" className="text-muted-foreground hover:text-primary transition-colors">
                  Trust & Safety
                </Link>
              </li>
              <li>
                <Link to="/site/roi-calculator" className="text-muted-foreground hover:text-primary transition-colors">
                  Savings Calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/site/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/site/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/site/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/site/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ship AI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Made with ♥ for the freight industry
          </p>
        </div>
      </div>
    </footer>
  );
};
