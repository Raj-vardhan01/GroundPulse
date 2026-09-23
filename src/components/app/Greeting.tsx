"use client";

import { useSyncExternalStore } from "react";

/* "Good morning" has to be the owner's morning. The server's clock is
   UTC on Vercel and the owner is in Dubai or London, so the greeting is
   worked out in the browser; the server renders a neutral word first. */
const never = () => () => {};
const readHour = () => new Date().getHours();

export function Greeting({ name }: { name: string }) {
  const hour = useSyncExternalStore(never, readHour, () => -1);
  const hello = hour < 0 ? "Hello" : hour < 5 ? "Still up" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return <>{hello}{name ? `, ${name}` : ""}</>;
}
