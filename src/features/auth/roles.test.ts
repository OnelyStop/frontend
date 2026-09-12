import { beforeEach, describe, expect, it, vi } from "vitest";

// The layout asks on every route, so a second getUser() here is an auth round trip per render.
const getUser = vi.fn();
const currentUser = vi.fn();
const maybeSingle = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock("@/lib/auth.server", () => ({ currentUser }));
vi.mock("@/lib/observability.server", () => ({ captureError: vi.fn() }));

describe("getRole", () => {
  beforeEach(() => {
    vi.resetModules();
    getUser.mockReset();
    currentUser.mockReset();
    maybeSingle.mockReset();
  });

  it("reads the user from the cached lookup, never its own getUser", async () => {
    currentUser.mockResolvedValue({ id: "u1", email: "a@b.c" });
    maybeSingle.mockResolvedValue({ data: { role: "admin" }, error: null });

    const { getRole } = await import("./roles");
    expect(await getRole()).toBe("admin");
    expect(currentUser).toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("is null when nobody is signed in, without touching user_roles", async () => {
    currentUser.mockResolvedValue(null);

    const { getRole } = await import("./roles");
    expect(await getRole()).toBeNull();
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("fails closed on an unknown role or a read error", async () => {
    currentUser.mockResolvedValue({ id: "u1", email: "a@b.c" });
    const { getRole } = await import("./roles");

    maybeSingle.mockResolvedValue({ data: { role: "superuser" }, error: null });
    expect(await getRole()).toBeNull();

    maybeSingle.mockResolvedValue({ data: null, error: { message: "denied" } });
    expect(await getRole()).toBeNull();
  });
});
