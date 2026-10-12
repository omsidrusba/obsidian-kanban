import { describe, expect, it } from 'vitest';

import { resolveActiveView } from './match';
import { validateFieldRows } from './validate';

describe('resolveActiveView', () => {
  const views = [{ name: 'Bugs', selection: { Type: ['#bug'] } }];
  it('keeps a view that exists', () => {
    expect(resolveActiveView('Bugs', views)).toBe('Bugs');
  });
  it('drops a view deleted or renamed elsewhere', () => {
    expect(resolveActiveView('Gone', views)).toBeNull();
    expect(resolveActiveView(null, views)).toBeNull();
  });
});

describe('validateFieldRows', () => {
  it('returns normalized fields when every row is valid', () => {
    expect(validateFieldRows([{ name: 'Type', tags: 'Bug, #enhancement' }])).toEqual({
      fields: [{ name: 'Type', tags: ['#bug', '#enhancement'] }],
      errors: [null],
    });
  });
  it('ignores fully empty rows', () => {
    expect(validateFieldRows([{ name: ' ', tags: '' }])).toEqual({ fields: [], errors: [null] });
  });
  it('flags a row with tags but no name instead of dropping it', () => {
    const r = validateFieldRows([
      { name: 'Type', tags: '#bug' },
      { name: '', tags: '#theme' },
    ]);
    expect(r.fields).toBeNull();
    expect(r.errors).toEqual([null, 'name']);
  });
  it('flags duplicate names case-insensitively on the later row', () => {
    const r = validateFieldRows([
      { name: 'Area', tags: '#docs' },
      { name: 'area', tags: '#theme' },
    ]);
    expect(r.fields).toBeNull();
    expect(r.errors).toEqual([null, 'duplicate']);
  });
});
