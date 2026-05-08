import { m } from "framer-motion";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Navigate } from "react-router-dom";

const AdminPage = () => {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative py-12 sm:py-20">
      <div className="absolute inset-0 dot-grid opacity-20" />
      <div className="glow-orb w-[400px] h-[400px] -top-32 -right-32 bg-[hsl(var(--glow-primary))] opacity-[0.05]" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Shield className="w-3.5 h-3.5" />
            Admin Panel
          </div>
          <h1 className="text-3xl font-bold text-foreground">Administration</h1>
          <p className="text-muted-foreground mt-2">
            Platform management and configuration.
          </p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            All 5 insurance models are live in production. No beta gating active.
          </p>
        </m.div>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-xs text-muted-foreground"
        >
          Signed in as <span className="font-medium text-foreground">{user?.email}</span> (Admin)
        </m.div>
      </div>
    </div>
  );
};

export default AdminPage;
