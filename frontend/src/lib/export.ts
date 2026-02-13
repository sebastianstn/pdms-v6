/**
 * Drucken & Export Utilities
 * Unterstützt: Drucken, CSV-Export, JSON-Export
 */

/** Druckt den aktuellen Seiteninhalt oder ein spezifisches Element */
export function printContent(elementId?: string) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PDMS — Druckansicht</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 2rem;
              color: #000;
              background: #fff;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1rem 0;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 0.5rem;
              text-align: left;
              font-size: 0.875rem;
            }
            th {
              background: #f3f4f6;
              font-weight: 600;
            }
            h1, h2, h3 {
              color: #1e293b;
            }
            .print-header {
              text-align: center;
              margin-bottom: 2rem;
              border-bottom: 2px solid #0ea5e9;
              padding-bottom: 1rem;
            }
            .print-footer {
              margin-top: 2rem;
              padding-top: 1rem;
              border-top: 1px solid #d1d5db;
              font-size: 0.75rem;
              color: #6b7280;
              text-align: center;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h2>PDMS Home-Spital</h2>
          </div>
          ${element.innerHTML}
          <div class="print-footer">
            Gedruckt am ${new Date().toLocaleString("de-CH")} — PDMS Home-Spital
          </div>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    } else {
        window.print();
    }
}

/** Exportiert Daten als CSV-Datei */
export function exportCSV<T extends Record<string, unknown>>(
    data: T[],
    filename: string,
    columns?: { key: keyof T; label: string }[],
) {
    if (data.length === 0) return;

    const cols = columns || Object.keys(data[0]).map((key) => ({
        key: key as keyof T,
        label: key,
    }));

    const header = cols.map((c) => `"${String(c.label)}"`).join(";");
    const rows = data.map((row) =>
        cols
            .map((c) => {
                const val = row[c.key];
                if (val === null || val === undefined) return '""';
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            })
            .join(";"),
    );

    const csv = [header, ...rows].join("\n");
    const BOM = "\uFEFF"; // UTF-8 BOM für Excel
    downloadFile(`${BOM}${csv}`, `${filename}.csv`, "text/csv;charset=utf-8");
}

/** Exportiert Daten als JSON-Datei */
export function exportJSON<T>(data: T, filename: string) {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${filename}.json`, "application/json");
}

/** Hilfsfunktion: Datei-Download auslösen */
function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
