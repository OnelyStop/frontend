import { beforeEach, describe, expect, it, vi } from "vitest";

/* The spec is emphatic: note / progress / chat routes scope on the
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
  listMessages,
  answerInConversation,
} = vi.hoisted(() => ({
  currentUserId: vi.fn<() => Promise<string | null>>(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  listNotes: vi.fn(),
  topicIdFromSlug: vi.fn(),
  listMessages: vi.fn(),
  answerInConversation: vi.fn(),
}));

vi.mock("./auth.server", () => ({ currentUserId }));
vi.mock("./queries.server", () => ({
  createNote,
  updateNote,
  deleteNote,
  listNotes,
  topicIdFromSlug,
  listMessages,
}));
vi.mock("./tutor.server", () => ({ answerInConversation }));
vi.mock("./rate-limit", () => ({
  rateLimit: () => ({ ok: true, retryAfterMs: 0 }),
}));

import {
  POST as notesPost,
  GET as notesGet,
} from "@/app/api/study/topics/[topicId]/notes/route";
import {
  PATCH as notePatch,
  DELETE as noteDelete,
} from "@/app/api/study/notes/[noteId]/route";
import { POST as messagesPost } from "@/app/api/study/chat/conversations/[conversationId]/messages/route";

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
  listMessages.mockResolvedValue([]);
  answerInConversation.mockResolvedValue({ answer: "ok", citedBlockKeys: [] });
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

describe("chat messages", () => {
  it("401s when signed out", async () => {
    currentUserId.mockResolvedValue(null);
    const res = await messagesPost(
      req({ question: "hi" }),
      params({ conversationId: "c1" }),
    );
    expect(res.status).toBe(401);
    expect(answerInConversation).not.toHaveBeenCalled();
  });

  it("passes the authenticated id and caps the question length", async () => {
    const res = await messagesPost(
      req({ question: "q".repeat(5000), userId: ATTACKER }),
      params({ conversationId: "c1" }),
    );
    expect(res.status).toBe(200);
    expect(answerInConversation.mock.calls[0][0]).toBe(AUTH_USER);
    expect(answerInConversation.mock.calls[0][1]).toBe("c1");
    expect(answerInConversation.mock.calls[0][2].question.length).toBe(1000);
  });
});
