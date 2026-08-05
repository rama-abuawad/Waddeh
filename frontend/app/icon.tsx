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
          background: "linear-gradient(145deg, #0e6b5c, #17372f)",
          color: "white",
          fontSize: 276,
          fontWeight: 800,
          paddingBottom: 34,
        }}
      >
        و
      </div>
    ),
    size,
  );
}
