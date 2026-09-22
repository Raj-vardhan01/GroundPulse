"use client";

import { useSyncExternalStore } from "react";

/* Two facts that only exist in the browser: which platform this is, and
   whether the app is already installed. Read through useSyncExternalStore
   rather than an effect, so the server renders the honest fallback and the
   client corrects it in one pass instead of a cascading re-render. */

export type Platform = "ios" | "android" | "desktop";

const never = () => () => {};

const readPlatform = (): Platform => {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) ? "ios" : /android/i.test(ua) ? "android" : "desktop";
};

export const usePlatform = (): Platform => useSyncExternalStore(never, readPlatform, () => "desktop");

const DISPLAY_MODE = "(display-mode: standalone)";

const readInstalled = () =>
  window.matchMedia(DISPLAY_MODE).matches ||
  // iOS Safari predates the display-mode query for installed web apps.
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

const subscribeInstalled = (cb: () => void) => {
  const mq = window.matchMedia(DISPLAY_MODE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export const useInstalled = () => useSyncExternalStore(subscribeInstalled, readInstalled, () => false);
