export type Selection = Record<string, string[]>;

export interface FilterField {
  name: string;
  tags: string[];
}

export interface FilterView {
  name: string;
  selection: Selection;
}

export interface FilterState {
  activeView: string | null;
  selection: Selection;
}

export const NOT_SET = '__none__';
