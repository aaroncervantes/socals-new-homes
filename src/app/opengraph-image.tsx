import { ImageResponse } from "next/og";

export const alt = "SoCal’s New Homes — new construction homes in Southern California";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f3efe7",
          color: "#1b1916",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: "#643528" }}>
          New construction
        </div>
        <div style={{ fontSize: 84, marginTop: 20, lineHeight: 1.05 }}>SoCal’s New Homes</div>
        <div style={{ fontSize: 32, marginTop: 28, color: "#5c564e", maxWidth: 860 }}>
          New construction homes in Southern California
        </div>
      </div>
    ),
    size,
  );
}
