import { m } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const NotFound = () => {
  return (
    <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4">
      {/* Background effects */}
      <div className="absolute inset-0 dot-grid opacity-20" />
      <div className="glow-orb w-[500px] h-[500px] -top-48 -right-48 bg-[hsl(var(--glow-primary))] opacity-[0.06] animate-pulse-glow" />
      <div className="glow-orb w-[600px] h-[600px] -bottom-48 -left-48 bg-[hsl(var(--glow-purple))] opacity-[0.05] animate-float" />
      <div className="glow-orb w-[300px] h-[300px] top-1/4 left-1/3 bg-[hsl(var(--glow-cyan))] opacity-[0.04] animate-float-delayed" />

      <div className="relative text-center max-w-lg mx-auto">
        {/* Large 404 */}
        <m.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
        >
          <h1 className="text-[8rem] sm:text-[10rem] font-extrabold leading-none gradient-text select-none">
            404
          </h1>
        </m.div>

        {/* Icon + Message */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-2 space-y-4"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-[hsl(var(--glow-purple))]/20 flex items-center justify-center border border-primary/20">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Page Not Found
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </m.div>

        {/* Action buttons */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
        >
          <Link
            to="/"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-[hsl(var(--glow-purple))] text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02]"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <Link
            to="/predict"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary/80 text-foreground font-medium text-sm border border-border/50 hover:bg-secondary transition-all duration-300"
          >
            Analyze a Claim
          </Link>
        </m.div>
      </div>
    </div>
  );
};

export default NotFound;
