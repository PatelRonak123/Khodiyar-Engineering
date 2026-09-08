// Utility functions for report generation and CSV export

export function exportToCSV(filename: string, headers: string[], rows: (string | number | undefined | null)[][]): void {
  // Ensure CSV has UTF-8 BOM so Excel opens special characters and Indian currency cleanly
  const BOM = '\uFEFF';
  
  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const stringVal = String(val);
    // If string contains comma, quote, or newline, escape quotes and wrap in quotes
    if (/[",\n\r]/.test(stringVal)) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return `"${stringVal}"`;
  };

  const headerRow = headers.map(escapeCell).join(',');
  const dataRows = rows.map(row => row.map(escapeCell).join(','));
  const csvContent = BOM + [headerRow, ...dataRows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  
  // Format filename with .csv extension
  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatCurrencyINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatLakhs(amount: number): string {
  const inLakhs = amount / 100000;
  return `₹${inLakhs.toFixed(2)}L`;
}
