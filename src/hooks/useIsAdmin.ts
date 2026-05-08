import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAIL = "divyanshwatms@gmail.com";

export function useIsAdmin() {
  const { user } = useAuth();
  return user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
