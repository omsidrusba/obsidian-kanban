import classcat from 'classcat';
import { Menu } from 'obsidian';
import { useContext } from 'preact/compat';

import { KanbanContext } from '../components/context';
import { c } from '../components/helpers';
import { t } from '../lang/helpers';
import { FilterChip } from './FilterChip';
import { FilterContext } from './FilterContext';
import { promptViewName } from './SaveViewModal';
import { isModified } from './match';
import { addView, deleteView, renameView, updateView } from './views';

export function FilterBar() {
  const filter = useContext(FilterContext);
  const { view } = useContext(KanbanContext);
  if (!filter) return null;

  const { views, state, fields } = filter;
  const current = views.find((v) => v.name === state.activeView);
  const modified = isModified(current, state.selection);
  const names = views.map((v) => v.name);

  const saveAsNew = async () => {
    const name = await promptViewName(view.app, '', names);
    if (!name) return;
    filter.editViews((raw) => addView(raw, { name, selection: state.selection }));
    filter.setState({ activeView: name, selection: state.selection });
  };

  const openMenu = (pos: { x: number; y: number }, name: string) => {
    const menu = new Menu();
    const target = views.find((v) => v.name === name);
    if (name === state.activeView && modified) {
      menu.addItem((i) =>
        i
          .setTitle(t('Update view'))
          .onClick(() => filter.editViews((raw) => updateView(raw, name, state.selection)))
      );
      menu.addItem((i) => i.setTitle(t('Save as new view…')).onClick(saveAsNew));
    }
    menu.addItem((i) =>
      i.setTitle(t('Rename view')).onClick(async () => {
        const next = await promptViewName(
          view.app,
          name,
          names.filter((n) => n !== name)
        );
        if (!next) return;
        filter.editViews((raw) => renameView(raw, name, next));
        if (state.activeView === name) {
          filter.setState({ activeView: next, selection: state.selection });
        }
      })
    );
    menu.addItem((i) =>
      i.setTitle(t('Delete view')).onClick(() => {
        if (!window.confirm(t('Delete this view?'))) return;
        filter.editViews((raw) => deleteView(raw, name));
        if (state.activeView === name) filter.applyView(null);
      })
    );
    if (target) menu.showAtPosition(pos);
  };

  return (
    <div className={c('filter-bar')}>
      <div className={c('filter-views')}>
        <button
          className={classcat([
            c('filter-view'),
            { 'is-active': !state.activeView && !filter.active },
          ])}
          onClick={() => filter.applyView(null)}
        >
          {t('All')}
        </button>
        {views.map((v) => (
          <button
            key={v.name}
            className={classcat([c('filter-view'), { 'is-active': v.name === state.activeView }])}
            onClick={() => filter.applyView(v.name)}
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu({ x: e.clientX, y: e.clientY }, v.name);
            }}
          >
            {v.name}
            {v.name === state.activeView && modified && (
              <span className={c('filter-modified')}>•</span>
            )}
          </button>
        ))}
        {current && (
          <button
            className={c('filter-view-menu')}
            aria-label={t('View options')}
            onClick={(e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              openMenu({ x: r.left, y: r.bottom }, current.name);
            }}
          >
            ⋯
          </button>
        )}
        {filter.active && (
          <button className={c('filter-view')} onClick={saveAsNew}>
            + {t('Save view')}
          </button>
        )}
      </div>
      <div className={c('filter-chips')}>
        {fields.map((f) => (
          <FilterChip key={f.name} field={f} />
        ))}
        {filter.active && (
          <button className={c('filter-clear')} onClick={() => filter.applyView(null)}>
            {t('Clear')}
          </button>
        )}
      </div>
    </div>
  );
}
