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
    filter.saveViews([...views, { name, selection: state.selection }]);
    filter.setState({ activeView: name, selection: state.selection });
  };

  const openMenu = (e: MouseEvent, name: string) => {
    const menu = new Menu();
    const target = views.find((v) => v.name === name);
    if (name === state.activeView && modified) {
      menu.addItem((i) =>
        i
          .setTitle(t('Update view'))
          .onClick(() =>
            filter.saveViews(
              views.map((v) => (v.name === name ? { ...v, selection: state.selection } : v))
            )
          )
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
        filter.saveViews(views.map((v) => (v.name === name ? { ...v, name: next } : v)));
        if (state.activeView === name) {
          filter.setState({ activeView: next, selection: state.selection });
        }
      })
    );
    menu.addItem((i) =>
      i.setTitle(t('Delete view')).onClick(() => {
        if (!window.confirm(t('Delete this view?'))) return;
        filter.saveViews(views.filter((v) => v.name !== name));
        if (state.activeView === name) filter.applyView(null);
      })
    );
    if (target) menu.showAtMouseEvent(e);
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
            onContextMenu={(e) => openMenu(e as unknown as MouseEvent, v.name)}
          >
            {v.name}
            {v.name === state.activeView && modified && (
              <span className={c('filter-modified')}>•</span>
            )}
          </button>
        ))}
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
