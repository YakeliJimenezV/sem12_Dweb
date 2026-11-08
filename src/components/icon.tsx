import type { ReactNode } from "react";
export type IconName = "book" | "home" | "users" | "chart" | "tag" | "search" | "plus" | "edit" | "trash" | "eye" | "arrow" | "close" | "calendar" | "pages";
const paths: Record<IconName, ReactNode> = {
  book: <><path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z"/><path d="M12 5v15"/></>,
  home: <><path d="m3 10 9-8 9 8M5 9v12h14V9M9 21v-8h6v8"/></>,
  users: <><circle cx="9" cy="7" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 3a4 4 0 0 1 0 8M22 21v-3a7 7 0 0 0-4-6"/></>,
  chart: <><path d="M3 2v19h19M7 17v-5M12 17V8M17 17V4"/></>,
  tag: <><path d="m2 12 10-10h9v9L11 21Z"/><circle cx="17" cy="6" r="1"/></>,
  search: <><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></>,
  plus: <path d="M12 4v16M4 12h16"/>, edit: <><path d="m4 16-1 5 5-1L21 7l-4-4ZM14 6l4 4"/></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></>,
  arrow: <path d="m10 5-7 7 7 7M3 12h18"/>, close: <path d="m5 5 14 14M19 5 5 19"/>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M8 15h2M14 15h2"/></>,
  pages: <><path d="m12 2 10 6-10 6L2 8ZM2 12l10 6 10-6M2 16l10 6 10-6"/></>,
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
