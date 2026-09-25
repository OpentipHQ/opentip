"use client";

import { useEffect } from "react";
import { SplashKit } from "splash-kit";

export default function PwaSplash() {
  useEffect(() => {
    SplashKit({
      background: "#ffffff",
      images: [
        { src: "/Opentip.png", position: "center", size: 0.35 },
      ],
      duration: 2000,
      fade: 400,
      onDismiss: () => {
        const blocking = document.getElementById("pwa-splash-blocking");
        if (blocking) blocking.remove();
      },
    });
  }, []);

  return null;
}
