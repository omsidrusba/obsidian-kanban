import { describe, expect, it } from 'vitest';

import { addView, deleteView, renameView, updateView } from './views';

// Stored views as they sit in the board file, including data the current fields don't know about
const raw = [
  { name: 'Bugs', selection: { Type: ['#bug'], Ghost: ['#x'] } },
  { name: 'Docs', selection: { Area: ['#docs'] } },
  { name: '', selection: {} },
];

describe('view operations keep stored data the sanitizer would drop', () => {
  it('addView appends without touching existing entries', () => {
    expect(addView(raw, { name: 'Theme', selection: { Area: ['#theme'] } })).toEqual([
      ...raw,
      { name: 'Theme', selection: { Area: ['#theme'] } },
    ]);
  });
  it('updateView replaces only the target selection', () => {
    expect(updateView(raw, 'Docs', { Area: ['#theme'] })).toEqual([
      raw[0],
      { name: 'Docs', selection: { Area: ['#theme'] } },
      raw[2],
    ]);
  });
  it('renameView changes only the target name', () => {
    expect(renameView(raw, 'Bugs', 'All bugs')).toEqual([
      { name: 'All bugs', selection: { Type: ['#bug'], Ghost: ['#x'] } },
      raw[1],
      raw[2],
    ]);
  });
  it('deleteView removes only the target', () => {
    expect(deleteView(raw, 'Docs')).toEqual([raw[0], raw[2]]);
  });
  it('treats a non-array stored value as empty', () => {
    expect(addView('garbage', { name: 'A', selection: {} })).toEqual([
      { name: 'A', selection: {} },
    ]);
    expect(deleteView(undefined, 'A')).toEqual([]);
  });
});
