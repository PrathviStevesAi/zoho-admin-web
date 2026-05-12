import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file.
 * @param data The data to export
 * @param columns The column definitions (optional)
 * @param fileName The name of the file to save
 */
export const exportToExcel = (data: any[], columns: any[], fileName: string) => {
  // If columns are provided, map the data to use headers as keys
  const exportData = columns && columns.length > 0 
    ? data.map(row => {
        const obj: any = {};
        columns.forEach(col => {
          // Use header as key, fallback to key if header is missing
          const header = typeof col.header === 'string' ? col.header : col.key;
          obj[header] = row[col.key] !== undefined ? row[col.key] : '';
        });
        return obj;
      })
    : data;

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // Create a blob and trigger download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
