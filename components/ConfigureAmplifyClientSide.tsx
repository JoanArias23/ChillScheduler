"use client";

import { Amplify } from "aws-amplify";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    __AMPLIFY_CONFIGURED__?: boolean;
  }
}

export default function ConfigureAmplifyClientSide() {
  const [configured, setConfigured] = useState<boolean>(
    typeof window !== "undefined" ? !!window.__AMPLIFY_CONFIGURED__ : false
  );

  useEffect(() => {
    let cancelled = false;
    async function configure() {
      try {
        // Attempt to load Amplify Gen 2 outputs if present at runtime
        const res = await fetch("/amplify_outputs.json", { cache: "no-store" });
        if (!res.ok) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Amplify outputs not found; running in disconnected mode");
          }
          return;
        }
        const outputs = await res.json();
        Amplify.configure(outputs);
        if (!cancelled) {
          window.__AMPLIFY_CONFIGURED__ = true;
          setConfigured(true);
        }
      } catch (err) {
        console.error("Failed to configure Amplify:", err);
      }
    }
    configure();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

