import { describe, expect, it } from 'vitest';

import {
  isActive,
  isModified,
  matchesFilters,
  normalizeTag,
  sanitizeFields,
  sanitizeSelection,
  sanitizeViews,
} from './match';
import { NOT_SET } from './types';

const fields = [
  { name: 'Type', tags: ['#bug', '#enhancement'] },
  { name: 'Severity', tags: ['#urgent', '#high', '#normal', '#low'] },
  { name: 'Area', tags: ['#theme', '#docs'] },
];

describe('normalizeTag', () => {
  it('lowercases, trims and adds #', () => {
    expect(normalizeTag(' Bug ')).toBe('#bug');
    expect(normalizeTag('#Bug')).toBe('#bug');
    expect(normalizeTag('#area/Theme')).toBe('#area/theme');
  });
  it('returns empty string for blank input', () => {
    expect(normalizeTag('   ')).toBe('');
    expect(normalizeTag('#')).toBe('');
  });
});

describe('matchesFilters', () => {
  it('passes everything when nothing is selected', () => {
    expect(matchesFilters(['#bug'], fields, {})).toBe(true);
    expect(matchesFilters(undefined, fields, { Type: [] })).toBe(true);
  });
  it('ORs within a field', () => {
    const sel = { Type: ['#bug', '#enhancement'] };
    expect(matchesFilters(['#enhancement'], fields, sel)).toBe(true);
  });
  it('ANDs across fields', () => {
    const sel = { Type: ['#bug'], Severity: ['#urgent'] };
    expect(matchesFilters(['#bug', '#urgent'], fields, sel)).toBe(true);
    expect(matchesFilters(['#bug', '#high'], fields, sel)).toBe(false);
  });
  it('compares case-insensitively', () => {
    expect(matchesFilters(['#BUG'], fields, { Type: ['#bug'] })).toBe(true);
  });
  it('supports Not set', () => {
    const sel = { Severity: [NOT_SET] };
    expect(matchesFilters(['#enhancement'], fields, sel)).toBe(true);
    expect(matchesFilters(['#bug', '#urgent'], fields, sel)).toBe(false);
  });
  it('ORs Not set with tags', () => {
    const sel = { Severity: [NOT_SET, '#urgent'] };
    expect(matchesFilters(['#bug', '#urgent'], fields, sel)).toBe(true);
    expect(matchesFilters(['#enhancement'], fields, sel)).toBe(true);
    expect(matchesFilters(['#bug', '#low'], fields, sel)).toBe(false);
  });
  it('ignores selections for unknown fields', () => {
    expect(matchesFilters(['#bug'], fields, { Ghost: ['#x'] })).toBe(true);
  });
  it('ignores card tags that belong to no field', () => {
    expect(matchesFilters(['#bug', '#blocked'], fields, { Type: ['#bug'] })).toBe(true);
  });
});

describe('sanitize', () => {
  it('drops malformed fields and normalizes tags', () => {
    const raw = [
      { name: 'Type', tags: ['Bug', '#enhancement', ''] },
      { name: '', tags: ['#x'] },
      { name: 'type', tags: ['#dup'] }, // duplicate name (case-insensitive)
      { name: 'Area', tags: 'not-an-array' },
      null,
    ];
    expect(sanitizeFields(raw)).toEqual([{ name: 'Type', tags: ['#bug', '#enhancement'] }]);
    expect(sanitizeFields('garbage')).toEqual([]);
  });
  it('drops unknown fields and values from a selection', () => {
    expect(sanitizeSelection({ Type: ['#bug', '#ghost', NOT_SET], Ghost: ['#x'] }, fields)).toEqual(
      { Type: ['#bug', NOT_SET] }
    );
    expect(sanitizeSelection(null, fields)).toEqual({});
  });
  it('keeps views with a name and sanitizes their selection', () => {
    const raw = [
      { name: 'Bugs', selection: { Type: ['#bug'], Ghost: ['#x'] } },
      { name: '', selection: {} },
      { name: 'bugs', selection: {} }, // duplicate
    ];
    expect(sanitizeViews(raw, fields)).toEqual([{ name: 'Bugs', selection: { Type: ['#bug'] } }]);
  });
});

describe('isActive / isModified', () => {
  it('detects an active selection', () => {
    expect(isActive({})).toBe(false);
    expect(isActive({ Type: [] })).toBe(false);
    expect(isActive({ Type: ['#bug'] })).toBe(true);
  });
  it('compares a view to a selection ignoring order and empty fields', () => {
    const view = { name: 'B', selection: { Type: ['#bug', '#enhancement'] } };
    expect(isModified(view, { Type: ['#enhancement', '#bug'], Area: [] })).toBe(false);
    expect(isModified(view, { Type: ['#bug'] })).toBe(true);
    expect(isModified(undefined, {})).toBe(false);
    expect(isModified(undefined, { Type: ['#bug'] })).toBe(true);
  });
});
