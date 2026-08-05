"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // The website remains fully usable if offline support cannot start.
      });
    }
  }, []);

  return null;
}
