import { describe, expect, it } from "vitest";
import { markdownToText, parseMarkdown } from "./markdown";

/* The renderer builds React nodes and never an HTML string, so raw markup can't
   execute by construction. These check that markup is carried as literal text
   and that unsafe link targets are dropped. */

describe("parseMarkdown", () => {
  const SAFE_KINDS = [
    "heading",
    "paragraph",
    "list",
    "code",
    "blockquote",
    "table",
    "hr",
  ];

  it("only ever emits inert block kinds, and carries markup as literal text", () => {
    const nodes = parseMarkdown("<script>alert(1)</script>\n\n<b>x</b>");
    expect(nodes.every((n) => SAFE_KINDS.includes(n.kind))).toBe(true);
    // the angle-bracket text survives as literal paragraph text, never a tag
    expect(markdownToText("<script>alert(1)</script>")).toContain(
      "<script>alert(1)</script>",
    );
  });

  it("drops a javascript: link target to plain text", () => {
    const [node] = parseMarkdown("see [click](javascript:stealCookies) here");
    expect(node.kind).toBe("paragraph");
    if (node.kind === "paragraph") {
      expect(node.text.some((t) => t.t === "link")).toBe(false);
      expect(node.text.map((t) => (t.t === "text" ? t.v : "")).join("")).toBe(
        "see click here",
      );
    }
  });

  it("keeps an http link", () => {
    const [node] = parseMarkdown("[x](https://example.org)");
    if (node.kind === "paragraph") {
      const link = node.text.find((t) => t.t === "link");
      expect(link && link.t === "link" && link.href).toBe(
        "https://example.org",
      );
    }
  });

  it("parses lists, bold and tables", () => {
    const nodes = parseMarkdown(
      "- one\n- **two**\n\n| A | B |\n| - | - |\n| 1 | 2 |",
    );
    expect(nodes[0]).toMatchObject({ kind: "list", ordered: false });
    expect(nodes[1]).toMatchObject({ kind: "table" });
    if (nodes[1].kind === "table") {
      expect(nodes[1].header).toHaveLength(2);
      expect(nodes[1].rows).toHaveLength(1);
    }
  });

  it("keeps fenced code verbatim", () => {
    const nodes = parseMarkdown("```\na < b && c > d\n```");
    expect(nodes[0]).toEqual({ kind: "code", text: "a < b && c > d" });
  });
});

describe("markdownToText", () => {
  it("flattens to plain prose for the tutor context", () => {
    const text = markdownToText(
      "# Heading\n\nSome **bold** and `code`.\n\n- a\n- b",
    );
    expect(text).toContain("Heading");
    expect(text).toContain("Some bold and code.");
    expect(text).toContain("- a");
  });
});
