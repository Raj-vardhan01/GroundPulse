/* The one way anything is written to an owner's timeline. The owner app,
   the inspector app and the ops console all call this, so an event
   always has the same shape whoever caused it. */

import { now, uid } from "@/lib/store";
import type { Event, EventType } from "@/lib/types";

export type NewEvent = {
  ownerId: string;
  type: EventType;
  title: string;
  body: string;
  href: string;
  propertyId?: string | null;
  visitId?: string | null;
  action?: boolean;
};

export function pushEvent(d: { events: Event[] }, e: NewEvent) {
  d.events.push({
    id: uid(), ownerId: e.ownerId, propertyId: e.propertyId ?? null, visitId: e.visitId ?? null,
    type: e.type, title: e.title, body: e.body, href: e.href, at: now(), readAt: null, action: e.action ?? false,
  });
}
