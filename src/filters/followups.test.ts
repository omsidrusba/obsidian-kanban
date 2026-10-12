import { describe, expect, it } from 'vitest';

import { laneCountLabel, popoverAlignsRight, sanitizeFields, sanitizeViews } from './match';
import { moveRow } from './validate';

const collect = () => {
  const issues: string[] = [];
  return { issues, report: (msg: string) => issues.push(msg) };
};

describe('sanitizers report malformed settings', () => {
  it('stays quiet for valid or absent settings', () => {
    const { issues, report } = collect();
    sanitizeFields(undefined, report);
    sanitizeFields([{ name: 'Type', tags: ['#bug'] }], report);
    sanitizeViews(undefined, [], report);
    expect(issues).toEqual([]);
  });
  it('reports a non-array value', () => {
    const { issues, report } = collect();
    sanitizeFields('garbage', report);
    sanitizeViews({ name: 'x' }, [], report);
    expect(issues).toEqual([
      'filter-fields is not a list; ignoring it',
      'filter-views is not a list; ignoring it',
    ]);
  });
  it('reports each dropped field and view entry', () => {
    const { issues, report } = collect();
    sanitizeFields(
      [{ name: 'Type', tags: ['#bug'] }, { name: '', tags: [] }, { name: 'type', tags: [] }, null],
      report
    );
    sanitizeViews([{ name: 'A', selection: {} }, { selection: {} }, { name: 'a' }], [], report);
    expect(issues).toEqual([
      'filter-fields[1] has no name or no tag list; skipped',
      'filter-fields[2] duplicates the name "type"; skipped',
      'filter-fields[3] has no name or no tag list; skipped',
      'filter-views[1] has no name; skipped',
      'filter-views[2] duplicates the name "a"; skipped',
    ]);
  });
  it('does not report a view selection that refers to a removed field', () => {
    const { issues, report } = collect();
    sanitizeViews([{ name: 'A', selection: { Ghost: ['#x'] } }], [], report);
    expect(issues).toEqual([]);
  });
});

describe('moveRow', () => {
  const rows = ['a', 'b', 'c'];
  it('moves a row up and down', () => {
    expect(moveRow(rows, 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveRow(rows, 1, 1)).toEqual(['a', 'c', 'b']);
  });
  it('leaves the list unchanged at the edges', () => {
    expect(moveRow(rows, 0, -1)).toEqual(rows);
    expect(moveRow(rows, 2, 1)).toEqual(rows);
  });
  it('does not mutate the input', () => {
    moveRow(rows, 0, 1);
    expect(rows).toEqual(['a', 'b', 'c']);
  });
});

describe('laneCountLabel', () => {
  it('shows the plain total when not filtering', () => {
    expect(laneCountLabel(undefined, 12, 'of')).toBe('12');
  });
  it('shows visible of total while filtering, so a card limit reads unambiguously', () => {
    expect(laneCountLabel(3, 12, 'of')).toBe('3 of 12');
  });
});

describe('popoverAlignsRight', () => {
  it('opens to the right when it fits', () => {
    expect(popoverAlignsRight(20, 200, 390)).toBe(false);
  });
  it('flips to the left when it would run off the right edge', () => {
    expect(popoverAlignsRight(250, 200, 390)).toBe(true);
  });
});
