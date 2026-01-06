export interface Table {
  id: string;
  name: string;
  columns: string[];
  rows: string[][];
}

export type TableUpdateDescription = string;
