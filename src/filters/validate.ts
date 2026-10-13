import { normalizeTag } from './match';
import { FilterField } from './types';

export interface FieldRow {
  name: string;
  tags: string;
}

export type RowError = 'name' | 'duplicate' | null;

export function parseTags(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\s,]+/)
        .map(normalizeTag)
        .filter(Boolean)
    ),
  ];
}

/**
 * Validates the settings editor rows. Fields are returned only when every non-empty row is
 * valid, so the editor never saves a partial list that silently drops a row.
 */
export function validateFieldRows(rows: FieldRow[]): {
  fields: FilterField[] | null;
  errors: RowError[];
} {
  const seen = new Set<string>();
  const fields: FilterField[] = [];
  const errors: RowError[] = rows.map((row) => {
    const name = row.name.trim();
    const tags = parseTags(row.tags);
    if (!name) return tags.length ? 'name' : null;
    if (seen.has(name.toLowerCase())) return 'duplicate';
    seen.add(name.toLowerCase());
    fields.push({ name, tags });
    return null;
  });

  return { fields: errors.some(Boolean) ? null : fields, errors };
}

/** Returns a copy with the row at `index` moved one step (`-1` up, `1` down); edges are no-ops. */
export function moveRow<T>(rows: T[], index: number, step: -1 | 1): T[] {
  const to = index + step;
  if (to < 0 || to >= rows.length) return rows.slice();
  const next = rows.slice();
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}
