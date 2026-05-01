import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBetaAccess } from "./useBetaAccess";
import { useAuth } from "@/contexts/AuthContext";
import { insforge } from "@/lib/insforge";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/insforge", () => ({
  insforge: {
    database: {
      from: vi.fn(),
    },
  },
}));

describe("useBetaAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return default values when no user is logged in", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    const { result } = renderHook(() => useBetaAccess());

    expect(result.current.isBeta).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(insforge.database.from).not.toHaveBeenCalled();
  });

  it("should grant beta access and admin status if user is admin", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: "divyanshwatms@gmail.com" },
    } as any);

    const { result } = renderHook(() => useBetaAccess());

    expect(result.current.isBeta).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(insforge.database.from).not.toHaveBeenCalled();
  });

  it("should check database for beta access if user is not admin", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: "user@example.com" },
    } as any);

    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockResolvedValue({ data: [{ email: "user@example.com" }], error: null });

    vi.mocked(insforge.database.from).mockReturnValue({
      select: selectMock,
      eq: eqMock,
    } as any);

    const { result } = renderHook(() => useBetaAccess());

    // Initially loading should be true, then it should resolve to true based on the mock
    expect(result.current.isAdmin).toBe(false);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isBeta).toBe(true);
    expect(insforge.database.from).toHaveBeenCalledWith("beta_access");
    expect(selectMock).toHaveBeenCalledWith("*");
    expect(eqMock).toHaveBeenCalledWith("email", "user@example.com");
  });

  it("should deny beta access if not found in database", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: "user@example.com" },
    } as any);

    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockResolvedValue({ data: [], error: null });

    vi.mocked(insforge.database.from).mockReturnValue({
      select: selectMock,
      eq: eqMock,
    } as any);

    const { result } = renderHook(() => useBetaAccess());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isBeta).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it("should deny beta access if database query returns an error", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: "user@example.com" },
    } as any);

    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockResolvedValue({ data: null, error: new Error("DB Error") });

    vi.mocked(insforge.database.from).mockReturnValue({
      select: selectMock,
      eq: eqMock,
    } as any);

    const { result } = renderHook(() => useBetaAccess());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isBeta).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });
});
