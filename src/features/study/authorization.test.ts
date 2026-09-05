import { beforeEach, describe, expect, it, vi } from "vitest";

/* The spec is emphatic: note / progress routes scope on the
   server-resolved user id and never trust one from the request body (§11).
   These call the real route handlers with the data layer and auth stubbed, and
   assert the wiring: 401 when signed out, and the authenticated id — not a body
   field — is what reaches the query. */

const {
  currentUserId,
  createNote,
  updateNote,
  deleteNote,
  listNotes,
  topicIdFromSlug,
  upsertProgress,
} = vi.hoisted(() => ({
  currentUserId: vi.fn<() => Promise<string | null>>(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  listNotes: vi.fn(),
  topicIdFromSlug: vi.fn(),
  upsertProgress: vi.fn(),
}));

vi.mock("@/lib/auth.server", () => ({ currentUserId }));
vi.mock("./queries.server", () => ({
  createNote,
  updateNote,
  deleteNote,
  listNotes,
  topicIdFromSlug,
  upsertProgress,
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ ok: true, retryAfterMs: 0 }),
}));

import {
  POST as notesPost,
  GET as notesGet,
} from "@/app/api/v1/study/topics/[topicId]/notes/route";
import {
  PATCH as notePatch,
  DELETE as noteDelete,
} from "@/app/api/v1/study/notes/[noteId]/route";
import { POST as progressPost } from "@/app/api/v1/study/topics/[topicId]/progress/route";

const TOPIC = "11111111-1111-1111-1111-111111111111";
const AUTH_USER = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ATTACKER = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const req = (body: unknown) =>
  new Request("http://t/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const params = <T>(p: T) => ({ params: Promise.resolve(p) });

beforeEach(() => {
  vi.clearAllMocks();
  currentUserId.mockResolvedValue(AUTH_USER);
  createNote.mockResolvedValue({ id: "n1", topicId: TOPIC });
  updateNote.mockResolvedValue({ id: "n1" });
  deleteNote.mockResolvedValue(true);
  listNotes.mockResolvedValue([]);
  upsertProgress.mockResolvedValue({ progressPercent: 40, completedAt: null });
});

describe("notes: create", () => {
  it("401s when signed out and never touches the data layer", async () => {
    currentUserId.mockResolvedValue(null);
    const res = await notesPost(
      req({ bodyMarkdown: "x" }),
      params({ topicId: TOPIC }),
    );
    expect(res.status).toBe(401);
    expect(createNote).not.toHaveBeenCalled();
  });

  it("scopes on the authenticated id, ignoring a userId in the body", async () => {
    const res = await notesPost(
      req({ bodyMarkdown: "trap", userId: ATTACKER, visibility: "public" }),
      params({ topicId: TOPIC }),
    );
    expect(res.status).toBe(201);
    expect(createNote).toHaveBeenCalledTimes(1);
    expect(createNote.mock.calls[0][0]).toBe(AUTH_USER);
    expect(createNote.mock.calls[0][1]).toBe(TOPIC);
    // the route never forwards a visibility field — private is enforced in the query
    expect(createNote.mock.calls[0][2]).not.toHaveProperty("visibility");
  });

  // The colour column carries a CHECK; without this a bad value was a 500.
  it("rejects an unknown colour before the data layer", async () => {
    const res = await notesPost(
      req({ bodyMarkdown: "x", color: "magenta" }),
      params({ topicId: TOPIC }),
    );
    expect(res.status).toBe(400);
    expect(createNote).not.toHaveBeenCalled();
  });
});

describe("notes: list / patch / delete", () => {
  it("list scopes on the authenticated id", async () => {
    await notesGet(new Request("http://t/x"), params({ topicId: TOPIC }));
    expect(listNotes.mock.calls[0][0]).toBe(AUTH_USER);
  });

  it("patch passes the authenticated id, not the note owner from anywhere else", async () => {
    const res = await notePatch(
      req({ bodyMarkdown: "edit", userId: ATTACKER }),
      params({ noteId: "n1" }),
    );
    expect(res.status).toBe(200);
    expect(updateNote.mock.calls[0][0]).toBe(AUTH_USER);
    expect(updateNote.mock.calls[0][1]).toBe("n1");
  });

  it("delete passes the authenticated id", async () => {
    const res = await noteDelete(
      new Request("http://t/x", { method: "DELETE" }),
      params({ noteId: "n1" }),
    );
    expect(res.status).toBe(204);
    expect(deleteNote.mock.calls[0][0]).toBe(AUTH_USER);
  });

  it("propagates an optimistic-concurrency conflict as 409", async () => {
    updateNote.mockResolvedValue({ error: "conflict" });
    const res = await notePatch(
      req({ bodyMarkdown: "edit" }),
      params({ noteId: "n1" }),
    );
    expect(res.status).toBe(409);
  });
});

describe("progress", () => {
  it("401s when signed out and never touches the data layer", async () => {
    currentUserId.mockResolvedValue(null);
    const res = await progressPost(
      req({ progressPercent: 50 }),
      params({ topicId: TOPIC }),
    );
    expect(res.status).toBe(401);
    expect(upsertProgress).not.toHaveBeenCalled();
  });

  it("scopes on the authenticated id, ignoring a userId in the body", async () => {
    const res = await progressPost(
      req({ progressPercent: 50, userId: ATTACKER }),
      params({ topicId: TOPIC }),
    );
    expect(res.status).toBe(200);
    expect(upsertProgress.mock.calls[0][0]).toBe(AUTH_USER);
    expect(upsertProgress.mock.calls[0][1]).toBe(TOPIC);
  });

  it("404s for a UUID-shaped topic that does not exist, not a 500", async () => {
    upsertProgress.mockResolvedValue({ error: "topic_not_found" });
    const res = await progressPost(
      req({ progressPercent: 50 }),
      params({ topicId: "22222222-2222-2222-2222-222222222222" }),
    );
    expect(res.status).toBe(404);
  });
});
