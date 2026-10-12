import classcat from 'classcat';
import { useContext, useState } from 'preact/compat';
import useOnclickOutside from 'react-cool-onclickoutside';

import { Icon } from '../components/Icon/Icon';
import { KanbanContext } from '../components/context';
import { c } from '../components/helpers';
import { TagColor } from '../components/types';
import { t } from '../lang/helpers';
import { FilterContext } from './FilterContext';
import { FilterField, NOT_SET } from './types';

export function formatTag(tag: string): string {
  if (tag === NOT_SET) return t('Not set');
  const s = tag.replace(/^#/, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function FilterChip({ field }: { field: FilterField }) {
  const filter = useContext(FilterContext);
  const { stateManager } = useContext(KanbanContext);
  const [open, setOpen] = useState(false);
  const ref = useOnclickOutside(() => setOpen(false));
  if (!filter) return null;

  const colors = (stateManager.getSetting('tag-colors') || []) as TagColor[];
  const colorOf = (tag: string) => colors.find((k) => k.tagKey?.toLowerCase() === tag);
  const selected = filter.state.selection[field.name] ?? [];
  const label = selected.length
    ? `${field.name}: ${selected.slice(0, 2).map(formatTag).join(', ')}${
        selected.length > 2 ? ` +${selected.length - 2}` : ''
      }`
    : field.name;

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    filter.setSelection({ ...filter.state.selection, [field.name]: next });
  };

  return (
    <div ref={ref} className={c('filter-chip-wrapper')}>
      <button
        className={classcat([c('filter-chip'), { 'is-active': selected.length > 0 }])}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        aria-expanded={open}
      >
        {label} <Icon name="chevron-down" />
      </button>
      {open && (
        <div
          className={c('filter-popover')}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        >
          {[...field.tags, NOT_SET].map((tag) => {
            const col = colorOf(tag);
            return (
              <label key={tag} className={c('filter-option')}>
                <input
                  type="checkbox"
                  checked={selected.includes(tag)}
                  onChange={() => toggle(tag)}
                />
                <span
                  className={c('filter-option-label')}
                  style={col ? { color: col.color, background: col.backgroundColor } : undefined}
                >
                  {formatTag(tag)}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
