import { FilterView, Selection } from './types';

// Operations on the views stored in the board settings. They work on the raw stored array, not
// on the sanitized list, so a save never erases selections for fields that are renamed or gone.
type Stored = Array<unknown>;

const asArray = (raw: unknown): Stored => (Array.isArray(raw) ? raw : []);

const isNamed = (v: unknown, name: string): v is FilterView =>
  typeof v === 'object' && v !== null && (v as FilterView).name === name;

export function addView(raw: unknown, view: FilterView): Stored {
  return [...asArray(raw), view];
}

export function updateView(raw: unknown, name: string, selection: Selection): Stored {
  return asArray(raw).map((v) => (isNamed(v, name) ? { ...v, selection } : v));
}

export function renameView(raw: unknown, name: string, next: string): Stored {
  return asArray(raw).map((v) => (isNamed(v, name) ? { ...v, name: next } : v));
}

export function deleteView(raw: unknown, name: string): Stored {
  return asArray(raw).filter((v) => !isNamed(v, name));
}
