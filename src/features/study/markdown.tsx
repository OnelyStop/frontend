import type { ReactNode } from "react";

// Renders to React nodes, never innerHTML: study content is validated, but a
// validator gap must not become script execution.

type Inline =
  | { t: "text"; v: string }
  | { t: "strong"; v: Inline[] }
  | { t: "em"; v: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; v: Inline[] };

export type MdNode =
  | { kind: "heading"; level: number; text: Inline[] }
  | { kind: "paragraph"; text: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "code"; text: string }
  | { kind: "blockquote"; text: Inline[] }
  | { kind: "table"; header: Inline[][]; rows: Inline[][][] }
  | { kind: "hr" };

const SAFE_HREF = /^(https?:|mailto:)/i;

function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let rest = src;

  const pushText = (v: string) => {
    if (!v) return;
    const last = out[out.length - 1];
    if (last?.t === "text") last.v += v;
    else out.push({ t: "text", v });
  };

  while (rest.length) {
    const code = rest.match(/^`([^`]+)`/);
    if (code) {
      out.push({ t: "code", v: code[1] });
      rest = rest.slice(code[0].length);
      continue;
    }
    const link = rest.match(/^\[([^\]]+)\]\(([^)\s]+)\)/);
    if (link) {
      if (SAFE_HREF.test(link[2])) {
        out.push({ t: "link", href: link[2], v: parseInline(link[1]) });
      } else {
        pushText(link[1]);
      }
      rest = rest.slice(link[0].length);
      continue;
    }
    const strong = rest.match(/^\*\*([^*]+)\*\*/);
    if (strong) {
      out.push({ t: "strong", v: parseInline(strong[1]) });
      rest = rest.slice(strong[0].length);
      continue;
    }
    const em = rest.match(/^(?:\*([^*]+)\*|_([^_]+)_)/);
    if (em) {
      out.push({ t: "em", v: parseInline(em[1] ?? em[2]) });
      rest = rest.slice(em[0].length);
      continue;
    }
    pushText(rest[0]);
    rest = rest.slice(1);
  }
  return out;
}

const splitRow = (line: string): string[] =>
  line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());

export function parseMarkdown(src: string): MdNode[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const nodes: MdNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (/^```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++; // closing fence
      nodes.push({ kind: "code", text: buf.join("\n") });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      nodes.push({
        kind: "heading",
        level: heading[1].length,
        text: parseInline(heading[2].trim()),
      });
      i++;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      nodes.push({ kind: "hr" });
      i++;
      continue;
    }

    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) &&
      lines[i + 1].includes("-")
    ) {
      const header = splitRow(line).map(parseInline);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitRow(lines[i]).map(parseInline));
        i++;
      }
      nodes.push({ kind: "table", header, rows });
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      nodes.push({ kind: "blockquote", text: parseInline(buf.join(" ")) });
      continue;
    }

    const bullet = line.match(/^\s*([-*])\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const items: Inline[][] = [];
      while (i < lines.length) {
        const b = lines[i].match(/^\s*([-*])\s+(.*)$/);
        const n = lines[i].match(/^\s*\d+\.\s+(.*)$/);
        if (ordered && n) items.push(parseInline(n[1]));
        else if (!ordered && b) items.push(parseInline(b[2]));
        else if (lines[i].trim() === "") break;
        else break;
        i++;
      }
      nodes.push({ kind: "list", ordered, items });
      continue;
    }

    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      if (
        /^(#{1,6}\s|```|\s*>|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i]) ||
        /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
      )
        break;
      buf.push(lines[i]);
      i++;
    }
    nodes.push({ kind: "paragraph", text: parseInline(buf.join(" ")) });
  }

  // Authors blank-line between list items, which splits one list into many;
  // merge them so an ordered list keeps counting instead of restarting at 1.
  const merged: MdNode[] = [];
  for (const node of nodes) {
    const prev = merged[merged.length - 1];
    if (
      node.kind === "list" &&
      prev?.kind === "list" &&
      prev.ordered === node.ordered
    ) {
      prev.items.push(...node.items);
    } else {
      merged.push(node);
    }
  }
  return merged;
}

function Inlines({ nodes }: { nodes: Inline[] }): ReactNode {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return <span key={i}>{n.v}</span>;
      case "strong":
        return (
          <strong key={i} className="text-ink font-medium">
            <Inlines nodes={n.v} />
          </strong>
        );
      case "em":
        return (
          <em key={i}>
            <Inlines nodes={n.v} />
          </em>
        );
      case "code":
        return (
          <code
            key={i}
            className="bg-panel text-ink-2 rounded px-1.5 py-0.5 text-[0.9em]"
          >
            {n.v}
          </code>
        );
      case "link":
        return (
          <a
            key={i}
            href={n.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-brand underline underline-offset-2"
          >
            <Inlines nodes={n.v} />
          </a>
        );
    }
  });
}

const HEADING_CLASS = [
  "",
  "mt-8 text-[22px] tracking-[-0.02em]",
  "mt-8 text-[19px] tracking-[-0.02em]",
  "mt-6 text-[16px] font-medium",
  "mt-6 text-[15px] font-medium",
  "mt-4 text-[14px] font-medium",
  "mt-4 text-[13px] font-medium",
];

export function Markdown({ source }: { source: string }): ReactNode {
  const nodes = parseMarkdown(source);
  return (
    <div className="text-ink-2 space-y-4 text-[15px] leading-[1.7]">
      {nodes.map((node, i) => {
        switch (node.kind) {
          case "heading": {
            const Tag = `h${Math.min(node.level + 1, 6)}` as "h2";
            return (
              <Tag key={i} className={HEADING_CLASS[node.level]}>
                <Inlines nodes={node.text} />
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={i}>
                <Inlines nodes={node.text} />
              </p>
            );
          case "list":
            return node.ordered ? (
              <ol key={i} className="list-decimal space-y-1.5 pl-5">
                {node.items.map((it, j) => (
                  <li key={j}>
                    <Inlines nodes={it} />
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={i} className="list-disc space-y-1.5 pl-5">
                {node.items.map((it, j) => (
                  <li key={j}>
                    <Inlines nodes={it} />
                  </li>
                ))}
              </ul>
            );
          case "code":
            return (
              <pre
                key={i}
                className="rounded-ctl border-line bg-panel text-ink-2 overflow-x-auto border p-4 text-[13px]"
              >
                <code>{node.text}</code>
              </pre>
            );
          case "blockquote":
            return (
              <blockquote
                key={i}
                className="border-brand text-ink-3 border-l-2 pl-4"
              >
                <Inlines nodes={node.text} />
              </blockquote>
            );
          case "table":
            return (
              <div key={i} className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-[14px]">
                  <thead>
                    <tr className="border-line text-ink-3 border-y">
                      {node.header.map((c, j) => (
                        <th key={j} className="px-3 py-2.5 font-normal">
                          <Inlines nodes={c} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {node.rows.map((row, j) => (
                      <tr
                        key={j}
                        className="border-line border-b last:border-0"
                      >
                        {row.map((c, k) => (
                          <td key={k} className="px-3 py-2.5">
                            <Inlines nodes={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "hr":
            return <hr key={i} className="border-line border-0 border-t" />;
        }
      })}
    </div>
  );
}
