export function csvEscape(value: string): string {
  if (/[;"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Build a Dutch Excel-friendly CSV (semicolon + UTF-8 BOM). */
export function toCsv(rows: string[][]): string {
  const body = rows.map((row) => row.map(csvEscape).join(";")).join("\r\n");
  return `\uFEFF${body}\r\n`;
}
