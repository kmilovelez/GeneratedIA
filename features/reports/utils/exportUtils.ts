
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type ExportFormat = 'PDF' | 'EXCEL';

export const generateExport = (data: any[], title: string, format: ExportFormat) => {
  if (!data || data.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  const fileName = `${title.toLowerCase().replace(/ /g, '_')}_${Date.now()}`;

  if (format === 'EXCEL') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } else {
    // PDF Generation
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    
    // Extract headers from the first object
    const headers = Object.keys(data[0]);
    const rows = data.map(row => Object.values(row));

    autoTable(doc, { 
      head: [headers], 
      body: rows, 
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 133, 244] } // Blue header
    });
    
    doc.save(`${fileName}.pdf`);
  }
};
