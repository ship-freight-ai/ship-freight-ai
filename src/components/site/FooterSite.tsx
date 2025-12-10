import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export const FooterSite = () => {
  return (
    <footer className="border-t bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/site" className="flex items-center gap-2 text-xl font-bold mb-4">
              <img src={logo} alt="Ship AI" className="h-8 w-auto" />
              <span>Ship AI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Brokerless Freight, AI-Powerful.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/site/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/site/roles" className="text-muted-foreground hover:text-accent transition-colors">
                  For Shippers & Carriers
                </Link>
              </li>
              <li>
                <Link to="/site/trust" className="text-muted-foreground hover:text-accent transition-colors">
                  Trust & Safety
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/site/about" className="text-muted-foreground hover:text-accent transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/site/terms" className="text-muted-foreground hover:text-accent transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/site/privacy" className="text-muted-foreground hover:text-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Ship AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
