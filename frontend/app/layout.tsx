import type { Metadata, Viewport } from "next";
import "./globals.css";

import PwaRegister from "./pwa-register";

export const metadata: Metadata = {
  title: "وضّح | Waddeh",
  description: "وضّح يحوّل النصوص العربية الصعبة إلى عربية واضحة وترجمة إنجليزية دقيقة.",
  applicationName: "وضّح",
  manifest: "/manifest.webmanifest",
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
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
