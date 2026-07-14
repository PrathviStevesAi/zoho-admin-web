import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file.
 * @param data The data to export
 * @param columns The column definitions (optional)
 * @param fileName The name of the file to save
 */
export const exportToExcel = (data: any[], columns: any[], fileName: string) => {
  const exportData = columns && columns.length > 0
    ? data.map(row => {
      const obj: any = {};
      columns.forEach(col => {
        const header = typeof col.header === 'string' ? col.header : col.key;
        obj[header] = row[col.key] !== undefined ? row[col.key] : '';
      });
      return obj;
    })
    : data;

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
