/* ════════════════════════════════════════════════════════════════
   Every read the owner app makes, scoped by owner in one place so no
   page can accidentally render somebody else's property.
   ════════════════════════════════════════════════════════════════ */

import { db } from "@/lib/store";
import type { Issue, Property, Report, Subscription, Visit } from "@/lib/types";

const byDateDesc = (a: string, b: string) => (a < b ? 1 : -1);

/** A property with everything the cards and the detail page need. */
export type PropertyView = {
  property: Property;
  score: number | null;
  lastReport: Report | null;
  nextVisit: Visit | null;
  liveVisit: Visit | null;
  openIssues: Issue[];
  visits: Visit[];
  reports: Report[];
  subscription: Subscription | null;
};

export async function properties(ownerId: string) {
  const d = await db();
  return d.properties.filter((p) => p.ownerId === ownerId && !p.archivedAt);
}

export async function propertyViews(ownerId: string): Promise<PropertyView[]> {
  const d = await db();
  const mine = d.properties.filter((p) => p.ownerId === ownerId && !p.archivedAt);
  return mine.map((property) => {
    const visits = d.visits.filter((v) => v.propertyId === property.id).sort((a, b) => byDateDesc(a.scheduledFor, b.scheduledFor));
    const reports = d.reports.filter((r) => r.propertyId === property.id).sort((a, b) => byDateDesc(a.publishedAt, b.publishedAt));
    const openIssues = d.issues.filter((i) => i.propertyId === property.id && i.decision === "pending");
    const lastReport = reports[0] ?? null;
    return {
      property,
      score: lastReport?.score ?? null,
      lastReport,
      nextVisit: visits.filter((v) => ["scheduled", "assigned"].includes(v.status)).sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : 1))[0] ?? null,
      liveVisit: visits.find((v) => ["en_route", "on_site", "submitted"].includes(v.status)) ?? null,
      openIssues,
      visits,
      reports,
      subscription: d.subscriptions.find((s) => s.ownerId === ownerId && s.propertyId === property.id) ?? null,
    };
  });
}

export async function propertyView(ownerId: string, id: string) {
  const all = await propertyViews(ownerId);
  return all.find((v) => v.property.id === id) ?? null;
}

export async function visitView(ownerId: string, id: string) {
  const d = await db();
  const visit = d.visits.find((v) => v.id === id && v.ownerId === ownerId);
  if (!visit) return null;
  return {
    visit,
    property: d.properties.find((p) => p.id === visit.propertyId)!,
    inspector: d.inspectors.find((i) => i.id === visit.inspectorId) ?? null,
    report: visit.reportId ? d.reports.find((r) => r.id === visit.reportId) ?? null : null,
  };
}

export async function reportView(ownerId: string, id: string) {
  const d = await db();
  const report = d.reports.find((r) => r.id === id && r.ownerId === ownerId);
  if (!report) return null;
  return {
    report,
    property: d.properties.find((p) => p.id === report.propertyId)!,
    visit: d.visits.find((v) => v.id === report.visitId)!,
    inspector: d.inspectors.find((i) => i.id === report.inspectorId) ?? null,
    issues: d.issues.filter((i) => i.reportId === report.id),
    subscription: d.subscriptions.find((s) => s.propertyId === report.propertyId) ?? null,
  };
}

export async function openIssues(ownerId: string) {
  const d = await db();
  return d.issues.filter((i) => i.ownerId === ownerId && i.decision === "pending");
}

export async function timeline(ownerId: string, propertyId?: string) {
  const d = await db();
  return d.events
    .filter((e) => e.ownerId === ownerId && (!propertyId || e.propertyId === propertyId))
    .sort((a, b) => byDateDesc(a.at, b.at));
}

export async function unread(ownerId: string) {
  const d = await db();
  return d.events.filter((e) => e.ownerId === ownerId && !e.readAt).sort((a, b) => byDateDesc(a.at, b.at));
}

export async function visits(ownerId: string) {
  const d = await db();
  return d.visits.filter((v) => v.ownerId === ownerId).sort((a, b) => byDateDesc(a.scheduledFor, b.scheduledFor));
}

export async function invoices(ownerId: string) {
  const d = await db();
  return d.invoices.filter((i) => i.ownerId === ownerId).sort((a, b) => byDateDesc(a.createdAt, b.createdAt));
}

export async function subscriptions(ownerId: string) {
  const d = await db();
  return d.subscriptions.filter((s) => s.ownerId === ownerId);
}

export async function inspectorsById() {
  const d = await db();
  return Object.fromEntries(d.inspectors.map((i) => [i.id, i]));
}

/** The one number the dashboard leads with. */
export function portfolioScore(views: PropertyView[]) {
  const scored = views.filter((v) => v.score !== null);
  if (!scored.length) return null;
  return Math.round(scored.reduce((n, v) => n + (v.score ?? 0), 0) / scored.length);
}
