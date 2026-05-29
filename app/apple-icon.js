import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #E45826 0%, #2D2B24 60%, #1B1A17 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "38px",
        }}
      >
        <span
          style={{
            color: "#F0A500",
            fontSize: 110,
            fontWeight: 900,
            fontFamily: "sans-serif",
            lineHeight: 1,
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
