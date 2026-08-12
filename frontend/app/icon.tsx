import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
            width: 288,
            height: 288,
            borderRadius: 96,
            background: "rgba(255,255,255,0.14)",
            border: "14px solid rgba(255,255,255,0.86)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 46,
              top: 122,
              width: 196,
              height: 44,
              borderRadius: 999,
              background: "#ffffff",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 118,
              top: 46,
              width: 44,
              height: 196,
              borderRadius: 999,
              background: "#ffffff",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 38,
              top: 38,
              width: 92,
              height: 92,
              borderTop: "32px solid #8ee2c1",
              borderRight: "32px solid #8ee2c1",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
