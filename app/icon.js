import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "30%",
        }}
      >
        <span
          style={{
            color: "#F0A500",
            fontSize: 20,
            fontWeight: 900,
            fontFamily: "sans-serif",
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
