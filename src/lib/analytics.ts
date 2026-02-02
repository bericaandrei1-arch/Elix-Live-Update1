export type AnalyticsEvent = {
  name: string;
  ts: number;
  props?: Record<string, unknown>;
};

const STORAGE_KEY = 'elix_analytics_v1';
const MAX_EVENTS = 500;

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  const ev: AnalyticsEvent = { name, ts: Date.now(), props };

  const existing = safeJsonParse<AnalyticsEvent[]>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
  );
  const next = [...(existing ?? []), ev].slice(-MAX_EVENTS);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    void ev;
  }

  if (import.meta.env.DEV) {
    console.debug('[analytics]', ev);
  }
}
