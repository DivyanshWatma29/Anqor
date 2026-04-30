import { useState, useEffect, useCallback } from "react";
import { m } from "framer-motion";
import { Shield, UserPlus, Trash2, Users, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBetaAccess } from "@/hooks/useBetaAccess";
import { insforge } from "@/lib/insforge";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

interface BetaMember {
  id: string;
  email: string;
  added_by: string;
  created_at: string;
}

const AdminPage = () => {
  const { user } = useAuth();
  const { isAdmin, loading: accessLoading } = useBetaAccess();
  const [members, setMembers] = useState<BetaMember[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    const { data, error } = await insforge.database
      .from("beta_access")
      .select("*")
      .order("created_at", { ascending: false }) as { data: BetaMember[] | null; error: unknown };

    if (!error && data) {
      setMembers(data);
    }
    setLoadingMembers(false);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchMembers();
    }
  }, [isAdmin, fetchMembers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    if (members.some((m) => m.email === email)) {
      toast.error("This email already has beta access");
      return;
    }

    setAdding(true);
    const { error } = await insforge.database
      .from("beta_access")
      .insert([{ email, added_by: user?.email || "admin" }]);

    if (error) {
      toast.error("Failed to add member");
    } else {
      toast.success(`${email} added to beta`);
      setNewEmail("");
      fetchMembers();
    }
    setAdding(false);
  };

  const handleRemove = async (member: BetaMember) => {
    setRemovingId(member.id);
    const { error } = await insforge.database
      .from("beta_access")
      .delete()
      .eq("id", member.id);

    if (error) {
      toast.error("Failed to remove member");
    } else {
      toast.success(`${member.email} removed from beta`);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    }
    setRemovingId(null);
  };

  if (accessLoading) {
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
          <h1 className="text-3xl font-bold text-foreground">Beta Access Management</h1>
          <p className="text-muted-foreground mt-2">
            Add or remove email addresses to control who can access all insurance models.
          </p>
        </m.div>

        {/* Add Member Form */}
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Add Beta Member</h2>
          </div>
          <form onSubmit={handleAdd} className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                name="beta_email"
                autoComplete="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="input-premium pl-10 w-full"
                required
              />
            </div>
            <button
              type="submit"
              disabled={adding || !newEmail.trim()}
              className="btn-premium px-6 py-2 text-sm disabled:opacity-50"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </button>
          </form>
        </m.div>

        {/* Members List */}
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Beta Members</h2>
            </div>
            <span className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</span>
          </div>

          {loadingMembers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No beta members yet. Add one above.
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{member.email}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Added {new Date(member.created_at).toLocaleDateString()} by {member.added_by}
                    </p>
                  </div>
                  <button
                    aria-label={`Remove ${member.email}`}
                    onClick={() => handleRemove(member)}
                    disabled={removingId === member.id}
                    className="ml-3 p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    title="Remove access"
                  >
                    {removingId === member.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </m.div>

        {/* Admin Info */}
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
