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

/** Receives a human-readable description of each malformed settings entry that was skipped. */
export type IssueReporter = (msg: string) => void;

export function sanitizeFields(raw: unknown, report?: IssueReporter): FilterField[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    report?.('filter-fields is not a list; ignoring it');
    return [];
  }
  const seen = new Set<string>();
  const out: FilterField[] = [];
  for (const [i, f] of raw.entries()) {
    const name = isObj(f) && typeof f.name === 'string' ? f.name.trim() : '';
    if (!name || !Array.isArray((f as { tags?: unknown }).tags)) {
      report?.(`filter-fields[${i}] has no name or no tag list; skipped`);
      continue;
    }
    if (seen.has(name.toLowerCase())) {
      report?.(`filter-fields[${i}] duplicates the name "${name}"; skipped`);
      continue;
    }
    const rawTags = (f as { tags: unknown[] }).tags;
    const tags = [...new Set(rawTags.map((t) => normalizeTag(String(t))).filter(Boolean))];
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

export function sanitizeViews(
  raw: unknown,
  fields: FilterField[],
  report?: IssueReporter
): FilterView[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    report?.('filter-views is not a list; ignoring it');
    return [];
  }
  const seen = new Set<string>();
  const out: FilterView[] = [];
  for (const [i, v] of raw.entries()) {
    const name = isObj(v) && typeof v.name === 'string' ? v.name.trim() : '';
    if (!name) {
      report?.(`filter-views[${i}] has no name; skipped`);
      continue;
    }
    if (seen.has(name.toLowerCase())) {
      report?.(`filter-views[${i}] duplicates the name "${name}"; skipped`);
      continue;
    }
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

/** Lane header count: the plain total, or "visible of total" while a filter is active. */
export function laneCountLabel(visible: number | undefined, total: number, of: string): string {
  return visible === undefined ? String(total) : `${visible} ${of} ${total}`;
}
