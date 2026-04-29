import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { insforge } from "@/lib/insforge";

const ADMIN_EMAIL = "divyanshwatms@gmail.com";

interface BetaAccess {
  isBeta: boolean;
  isAdmin: boolean;
  loading: boolean;
}

export function useBetaAccess(): BetaAccess {
  const { user } = useAuth();
  const [isBeta, setIsBeta] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!user) {
      setIsBeta(false);
      setLoading(false);
      return;
    }

    if (isAdmin) {
      setIsBeta(true);
      setLoading(false);
      return;
    }

    insforge.database
      .from("beta_access")
      .select("*")
      .eq("email", user.email)
      .then(({ data, error }: { data: unknown[] | null; error: unknown }) => {
        if (!error && data && data.length > 0) {
          setIsBeta(true);
        } else {
          setIsBeta(false);
        }
        setLoading(false);
      });
  }, [user, isAdmin]);

  return { isBeta, isAdmin, loading };
}
