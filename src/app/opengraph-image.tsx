import { ImageResponse } from "next/og";

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
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "#5b52f0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 7,
            paddingLeft: 14,
          }}
        >
          <div
            style={{
              width: 24,
              height: 6,
              borderRadius: 3,
              background: "#fff",
            }}
          />
          <div
            style={{
              width: 17,
              height: 6,
              borderRadius: 3,
              background: "rgba(255,255,255,0.7)",
            }}
          />
        </div>
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
        <span>RBI Grade B</span>
      </div>
    </div>,
    size,
  );
}
