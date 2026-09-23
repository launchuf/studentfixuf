// Storage adapter for the Supabase auth session. Self-hosted builds just use localStorage.
export function brokeredPreviewStorage() {
  if (typeof window === "undefined") return undefined;
  return localStorage;
}
