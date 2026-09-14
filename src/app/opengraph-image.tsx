import { ImageResponse } from "next/og";
import { MARK_FULL } from "@/design-system/lib/mark";

// Satori renders a data-URI <img> reliably; its inline <svg> support is partial.
const MARK_TILE = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#131316"/><g transform="translate(32 32) scale(.72) translate(-32 -32)"><path fill="#fff" fill-rule="evenodd" d="${MARK_FULL}"/></g></svg>`,
).toString("base64")}`;

export const alt =
  "onelystop — mocks, drills, current affairs and descriptive marking for IBPS, SBI and RBI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// System fonts only: loading a woff here costs a fetch on every card render.
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#fbfbfa",
        padding: 72,
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <img src={MARK_TILE} width={56} height={56} alt="" />
        <div style={{ fontSize: 34, color: "#16161a", letterSpacing: -0.5 }}>
          onelystop
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxWidth: 900,
        }}
      >
        <div
          style={{
            fontSize: 76,
            lineHeight: 1.05,
            color: "#16161a",
            letterSpacing: -2.5,
          }}
        >
          Clear every sectional target
        </div>
        <div style={{ fontSize: 30, lineHeight: 1.4, color: "#5f5f68" }}>
          Mocks, drills, current affairs and descriptive marking for IBPS, SBI
          and RBI — built around negative marking and what to skip.
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, fontSize: 22, color: "#93939c" }}>
        <span>IBPS PO</span>
        <span>·</span>
        <span>SBI PO</span>
        <span>·</span>
        <span>IBPS Clerk</span>
      </div>
    </div>,
    size,
  );
}
