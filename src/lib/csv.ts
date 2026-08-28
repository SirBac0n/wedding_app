// Minimal CSV cell escaping for export (RFC 4180): wrap in quotes and double
// up any embedded quotes whenever a value contains a comma, quote, or newline.
export function csvCell(value: string | null | undefined): string {
  const v = value ?? "";
  if (/[",\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function toCsvRow(values: (string | null | undefined)[]): string {
  return values.map(csvCell).join(",");
}
