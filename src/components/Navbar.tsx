import { useState } from "react";
import { useLocation } from "react-router-dom";
import { PrefetchLink as Link } from "../App";
import { m, AnimatePresence } from "framer-motion";
import { Shield, Moon, Sun, Menu, X, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";

const navLinks = [
  { label: "Dashboard", path: "/", requiresAuth: true },
  { label: "Predict Claim", path: "/predict", requiresAuth: false },
  { label: "Bulk Check", path: "/bulk-check", requiresAuth: false },
  { label: "Analytics", path: "/analytics", requiresAuth: true },
  { label: "About", path: "/about", requiresAuth: false },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark" || (theme === "system" && typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const visibleLinks = navLinks.filter((l) => !l.requiresAuth || user);

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <m.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 backdrop-blur-2xl border-b"
      style={{
        background: isDark
          ? "hsla(228, 20%, 7%, 0.8)"
          : "hsla(220, 20%, 97%, 0.8)",
        borderColor: isDark
          ? "hsla(228, 15%, 20%, 0.5)"
          : "hsla(220, 15%, 90%, 0.5)",
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--glow-purple))] flex items-center justify-center shadow-lg shadow-primary/25">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--glow-purple))] blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
            </div>
            <div className="hidden sm:block text-lg">
              <span className="font-bold text-foreground tracking-tight">
                FraudShield
              </span>
              <span className="text-primary font-extrabold">.ai</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-secondary/50">
            {visibleLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <m.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-lg bg-card shadow-sm border border-border/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300"
            >
              <m.div
                key={isDark ? "sun" : "moon"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </m.div>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-[hsl(var(--glow-purple))]/20 flex items-center justify-center border border-primary/20">
                  <span className="text-xs font-bold text-primary">{initials}</span>
                </div>
                <span className="hidden lg:block text-sm font-medium text-foreground max-w-[120px] truncate">
                  {user.name}
                </span>
                <button
                  onClick={signOut}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger/10 transition-all duration-300"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-all duration-300"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/50 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {visibleLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === link.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.nav>
  );
};

export default Navbar;
