import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0e6b5c 0%, #17372f 100%)",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 108,
            height: 108,
            borderRadius: 34,
            background: "rgba(255,255,255,0.14)",
            border: "6px solid rgba(255,255,255,0.9)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 18,
              top: 47,
              width: 72,
              height: 14,
              borderRadius: 999,
              background: "#ffffff",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 47,
              top: 18,
              width: 14,
              height: 72,
              borderRadius: 999,
              background: "#ffffff",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 12,
              top: 12,
              width: 35,
              height: 35,
              borderTop: "12px solid #8ee2c1",
              borderRight: "12px solid #8ee2c1",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
