import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "وضّح | Waddeh",
    short_name: "وضّح",
    description: "تبسيط النصوص العربية وترجمتها بوضوح.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f2",
    theme_color: "#0e6b5c",
    lang: "ar",
    dir: "rtl",
    orientation: "any",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
