// Seat layout helpers. A layout is a 2D grid where each cell is either
// a seat label string (e.g. "1A") or null (aisle / empty space).
//
// Example 2+2 layout for a 40-seat bus (10 rows):
//   [
//     ["1A","1B",null,"1C","1D"],
//     ["2A","2B",null,"2C","2D"],
//     ...
//   ]

export type SeatCell = string | null;
export type SeatLayout = SeatCell[][];

export function countSeats(layout: SeatLayout): number {
  let n = 0;
  for (const row of layout) for (const cell of row) if (cell) n++;
  return n;
}

export function allSeatLabels(layout: SeatLayout): string[] {
  const out: string[] = [];
  for (const row of layout) for (const cell of row) if (cell) out.push(cell);
  return out;
}

export function generate2Plus2Layout(rows: number): SeatLayout {
  const grid: SeatLayout = [];
  for (let r = 1; r <= rows; r++) {
    grid.push([`${r}A`, `${r}B`, null, `${r}C`, `${r}D`]);
  }
  return grid;
}

export function generate2Plus1Layout(rows: number): SeatLayout {
  const grid: SeatLayout = [];
  for (let r = 1; r <= rows; r++) {
    grid.push([`${r}A`, `${r}B`, null, `${r}C`]);
  }
  return grid;
}
