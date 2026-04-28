import { Shield, Github, Twitter, Mail } from "lucide-react";
import { PrefetchLink as Link } from "../App";

const DashboardFooter = () => {
  return (
    <footer className="relative border-t border-border/50 mt-12">
      {/* Top gradient line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          {/* Brand */}
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--glow-purple))] flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">
                FraudShield<span className="text-primary">.ai</span>
              </span>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Enterprise-grade insurance fraud detection platform built with advanced
              machine learning models for intelligent risk analysis.
            </p>
            <p className="text-sm text-muted-foreground">
              Built with ♥ for smarter insurance.
            </p>
          </div>

          {/* Navigation */}
          <div className="md:text-right flex flex-col md:items-end">
            <h4 className="text-xs font-bold text-foreground mb-4 uppercase tracking-widest">Platform</h4>
            <div className="space-y-2.5">
              {[
                { label: "Dashboard", path: "/" },
                { label: "Predict Claim", path: "/predict" },
                { label: "Analytics", path: "/analytics" },
                { label: "About", path: "/about" },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border/50 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 FraudShield.ai. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {[Github, Twitter, Mail].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
