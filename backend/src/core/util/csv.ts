// Characters that make a spreadsheet treat the cell as a formula.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

const quoteField = (value: string) => {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

/** Escapes a text cell for CSV: doubles quotes, quotes separators, and neutralizes formula injection. */
export function csvTextCell(value: string | null | undefined): string {
  let text = value ?? '';
  if (FORMULA_PREFIX.test(text)) {
    text = `'${text}`;
  }
  return quoteField(text);
}

/** Numeric cell — never formula-escaped, never quoted. */
export function csvNumberCell(value: number | null | undefined): string {
  return String(value ?? 0);
}

export function csvRow(cells: string[]): string {
  return cells.join(',');
}
