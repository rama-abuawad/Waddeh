import type { Metadata, Viewport } from "next";
import "./globals.css";

import PwaRegister from "./pwa-register";

export const metadata: Metadata = {
  title: "وضّح | Waddeh",
  description: "وضّح يحوّل النصوص العربية الصعبة إلى عربية واضحة وترجمة إنجليزية دقيقة.",
  applicationName: "وضّح",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/brand/Waddeh_Brand/waddeh-icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "512x512", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "وضّح",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0e6b5c",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
