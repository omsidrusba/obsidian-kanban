import { render, unmountComponentAtNode, useRef, useState } from 'preact/compat';

import { Icon } from '../components/Icon/Icon';
import { c } from '../components/helpers';
import { FilterField } from '../filters/types';
import { FieldRow, validateFieldRows } from '../filters/validate';
import { t } from '../lang/helpers';

type KeyedRow = FieldRow & { id: number };

function FilterFieldEditor({
  initial,
  onChange,
}: {
  initial: FilterField[];
  onChange: (f: FilterField[]) => void;
}) {
  // Stable row ids so focus stays on the right input after a row is removed
  const nextId = useRef(0);
  const withId = (row: FieldRow): KeyedRow => ({ ...row, id: nextId.current++ });
  const [rows, setRows] = useState<KeyedRow[]>(() =>
    initial.map((f) => withId({ name: f.name, tags: f.tags.join(' ') }))
  );
  const { errors } = validateFieldRows(rows);

  const commit = (next: KeyedRow[]) => {
    setRows(next);
    // Save only a complete, valid list; invalid rows stay on screen with an inline error
    const { fields } = validateFieldRows(next);
    if (fields) onChange(fields);
  };

  const setRow = (id: number, patch: Partial<FieldRow>) =>
    commit(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className={c('filter-field-settings')}>
      {rows.map((row, i) => (
        <div key={row.id} className={c('filter-field-row-wrapper')}>
          <div className={c('filter-field-row')}>
            <input
              type="text"
              placeholder={t('Field name')}
              value={row.name}
              onChange={(e) => setRow(row.id, { name: (e.target as HTMLInputElement).value })}
            />
            <input
              type="text"
              placeholder={t('Tags (space or comma separated)')}
              value={row.tags}
              onChange={(e) => setRow(row.id, { tags: (e.target as HTMLInputElement).value })}
            />
            <a
              className="clickable-icon"
              aria-label={t('Delete')}
              onClick={() => commit(rows.filter((r) => r.id !== row.id))}
            >
              <Icon name="lucide-trash-2" />
            </a>
          </div>
          {errors[i] && (
            <div className={c('filter-field-error')}>
              {errors[i] === 'name'
                ? t('Give this field a name.')
                : t('Field names must be unique.')}
            </div>
          )}
        </div>
      ))}
      <button onClick={() => setRows([...rows, withId({ name: '', tags: '' })])}>
        {t('Add field')}
      </button>
    </div>
  );
}

export function renderFilterFieldSettings(
  el: HTMLElement,
  fields: FilterField[],
  onChange: (f: FilterField[]) => void
) {
  render(<FilterFieldEditor initial={fields} onChange={onChange} />, el);
}

export function cleanUpFilterFieldSettings(el: HTMLElement) {
  unmountComponentAtNode(el);
}
