"use client";

import { useEffect } from "react";

/* Registered once, site-wide. Browsers only allow this on localhost or
   HTTPS, so over a plain LAN address it quietly does nothing and the app
   still works — it just has no offline floor. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const id = setTimeout(() => {
      /* The dev flag turns off asset caching inside the worker — see sw.js.
         Registering it in development anyway is deliberate: installing to a
         home screen is part of what we are building, and it needs a worker. */
      const url = process.env.NODE_ENV === "production" ? "/sw.js" : "/sw.js?dev=1";
      navigator.serviceWorker.register(url).catch(() => {});
    }, 1200);
    return () => clearTimeout(id);
  }, []);
  return null;
}
