import { render, unmountComponentAtNode, useState } from 'preact/compat';

import { Icon } from '../components/Icon/Icon';
import { c } from '../components/helpers';
import { normalizeTag, sanitizeFields } from '../filters/match';
import { FilterField } from '../filters/types';
import { t } from '../lang/helpers';

function parseTags(text: string): string[] {
  return [...new Set(text.split(/[\s,]+/).map(normalizeTag).filter(Boolean))];
}

function FilterFieldEditor({
  initial,
  onChange,
}: {
  initial: FilterField[];
  onChange: (f: FilterField[]) => void;
}) {
  const [rows, setRows] = useState(initial.map((f) => ({ name: f.name, tags: f.tags.join(' ') })));
  const names = rows.map((r) => r.name.trim().toLowerCase()).filter(Boolean);
  const hasDup = new Set(names).size !== names.length;

  const commit = (next: typeof rows) => {
    setRows(next);
    const fields = next.map((r) => ({ name: r.name, tags: parseTags(r.tags) }));
    const clean = sanitizeFields(fields);
    if (clean.length === fields.filter((f) => f.name.trim()).length) onChange(clean);
  };

  return (
    <div className={c('filter-field-settings')}>
      {rows.map((row, i) => (
        <div key={i} className={c('filter-field-row')}>
          <input
            type="text"
            placeholder={t('Field name')}
            value={row.name}
            onChange={(e) =>
              commit(
                rows.map((r, j) =>
                  j === i ? { ...r, name: (e.target as HTMLInputElement).value } : r
                )
              )
            }
          />
          <input
            type="text"
            placeholder={t('Tags (space or comma separated)')}
            value={row.tags}
            onChange={(e) =>
              commit(
                rows.map((r, j) =>
                  j === i ? { ...r, tags: (e.target as HTMLInputElement).value } : r
                )
              )
            }
          />
          <a className="clickable-icon" onClick={() => commit(rows.filter((_, j) => j !== i))}>
            <Icon name="lucide-trash-2" />
          </a>
        </div>
      ))}
      {hasDup && <div className={c('filter-field-error')}>{t('Field names must be unique.')}</div>}
      <button onClick={() => setRows([...rows, { name: '', tags: '' }])}>{t('Add field')}</button>
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
