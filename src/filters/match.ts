import { FilterField, FilterView, NOT_SET, Selection } from './types';

export function normalizeTag(t: string): string {
  const s = String(t ?? '')
    .trim()
    .toLowerCase()
    .replace(/^#+/, '');
  return s ? `#${s}` : '';
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function sanitizeFields(raw: unknown): FilterField[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: FilterField[] = [];
  for (const f of raw) {
    if (!isObj(f) || typeof f.name !== 'string' || !Array.isArray(f.tags)) continue;
    const name = f.name.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    const tags = [...new Set(f.tags.map((t) => normalizeTag(String(t))).filter(Boolean))];
    seen.add(name.toLowerCase());
    out.push({ name, tags });
  }
  return out;
}

export function sanitizeSelection(sel: unknown, fields: FilterField[]): Selection {
  if (!isObj(sel)) return {};
  const out: Selection = {};
  for (const field of fields) {
    const raw = sel[field.name];
    if (!Array.isArray(raw)) continue;
    const allowed = new Set([...field.tags, NOT_SET]);
    const vals = [
      ...new Set(raw.map((v) => (v === NOT_SET ? NOT_SET : normalizeTag(String(v))))),
    ].filter((v) => allowed.has(v));
    if (vals.length) out[field.name] = vals;
  }
  return out;
}

export function sanitizeViews(raw: unknown, fields: FilterField[]): FilterView[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: FilterView[] = [];
  for (const v of raw) {
    if (!isObj(v) || typeof v.name !== 'string') continue;
    const name = v.name.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push({ name, selection: sanitizeSelection(v.selection, fields) });
  }
  return out;
}

export function isActive(sel: Selection): boolean {
  return Object.values(sel).some((v) => v && v.length > 0);
}

export function matchesFilters(
  itemTags: string[] | undefined,
  fields: FilterField[],
  sel: Selection
): boolean {
  const tags = new Set((itemTags ?? []).map(normalizeTag));
  for (const field of fields) {
    const wanted = sel[field.name];
    if (!wanted || wanted.length === 0) continue;
    const hasAnyFieldTag = field.tags.some((t) => tags.has(t));
    const ok = wanted.some((w) => (w === NOT_SET ? !hasAnyFieldTag : tags.has(w)));
    if (!ok) return false;
  }
  return true;
}

const key = (sel: Selection) =>
  JSON.stringify(
    Object.keys(sel)
      .filter((k) => sel[k]?.length)
      .sort()
      .map((k) => [k, [...sel[k]].sort()])
  );

export function isModified(view: FilterView | undefined, sel: Selection): boolean {
  return key(view?.selection ?? {}) !== key(sel);
}

export function resolveActiveView(activeView: string | null, views: FilterView[]): string | null {
  return activeView && views.some((v) => v.name === activeView) ? activeView : null;
}
