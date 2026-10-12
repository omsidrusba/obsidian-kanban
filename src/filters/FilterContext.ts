import update from 'immutability-helper';
import { createContext, useCallback, useMemo, useState } from 'preact/compat';
import { KanbanView } from 'src/KanbanView';
import { StateManager } from 'src/StateManager';

import { Board, Item } from '../components/types';
import {
  isActive,
  matchesFilters,
  resolveActiveView,
  sanitizeFields,
  sanitizeSelection,
  sanitizeViews,
} from './match';
import { FilterField, FilterState, FilterView, Selection } from './types';

export interface FilterContextProps {
  fields: FilterField[];
  views: FilterView[];
  state: FilterState;
  active: boolean;
  visible: Set<Item>;
  setSelection: (sel: Selection) => void;
  setState: (next: FilterState) => void;
  applyView: (name: string | null) => void;
  /** Edits the stored views (raw, unsanitized) and writes the board file. */
  editViews: (op: (raw: unknown) => unknown[]) => void;
}

export const FilterContext = createContext<FilterContextProps | null>(null);

const EMPTY: FilterState = { activeView: null, selection: {} };

export function useFilterValue(
  board: Board,
  view: KanbanView,
  stateManager: StateManager
): FilterContextProps | null {
  const rawFields = stateManager.useSetting('filter-fields');
  const rawViews = stateManager.useSetting('filter-views');
  const fields = useMemo(() => sanitizeFields(rawFields), [rawFields]);
  const views = useMemo(() => sanitizeViews(rawViews, fields), [rawViews, fields]);

  const [state, setStateRaw] = useState<FilterState>(() => {
    const saved = view.viewSettings['filter-state'];
    return saved
      ? {
          activeView: saved.activeView ?? null,
          selection: sanitizeSelection(saved.selection, fields),
        }
      : EMPTY;
  });

  const persist = useCallback(
    (next: FilterState) => {
      setStateRaw(next);
      // Leaf view state only: switching filters never rewrites the board file
      view.setViewState('filter-state', next);
    },
    [view]
  );

  const setSelection = useCallback(
    (selection: Selection) => persist({ activeView: state.activeView, selection }),
    [persist, state.activeView]
  );

  const applyView = useCallback(
    (name: string | null) => {
      const v = views.find((x) => x.name === name);
      persist(v ? { activeView: v.name, selection: v.selection } : EMPTY);
    },
    [persist, views]
  );

  const editViews = useCallback(
    (op: (raw: unknown) => unknown[]) => {
      stateManager.setState((b: Board) =>
        update(b, {
          data: {
            settings: {
              'filter-views': { $set: op(b.data.settings['filter-views']) as FilterView[] },
            },
          },
        })
      );
    },
    [stateManager]
  );

  const selection = useMemo(() => sanitizeSelection(state.selection, fields), [state, fields]);
  const active = isActive(selection);

  const visible = useMemo(() => {
    const set = new Set<Item>();
    if (!active) return set;
    board.children.forEach((lane) =>
      lane.children.forEach((item) => {
        if (matchesFilters(item.data.metadata.tags, fields, selection)) set.add(item);
      })
    );
    return set;
  }, [board, fields, selection, active]);

  if (fields.length === 0) return null;
  return {
    fields,
    views,
    state: { activeView: resolveActiveView(state.activeView, views), selection },
    active,
    visible,
    setSelection,
    setState: persist,
    applyView,
    editViews,
  };
}
