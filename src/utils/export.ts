import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { MonthData, Bank } from '../types';
import { getBankDetails } from '../constants';

export const exportToExcel = (
  data: MonthData,
  customBanks: Bank[],
  filename: string,
) => {
  try {
    const rows: any[] = [];

    data.entries.forEach((entry) => {
      let bank = getBankDetails(entry.bankId, entry.customBankName);
      if (!bank && entry.bankId.startsWith('custom_')) {
        bank = customBanks.find((b) => b.id === entry.bankId);
      }

      const bankName = bank?.name || 'Неизвестный банк';

      entry.categories.forEach((category) => {
        rows.push({
          Банк: bankName,
          Категория: category.name,
          Процент: category.percent,
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Кэшбек');

    // Auto-size columns
    const maxWidths = rows.reduce((acc, row) => {
      Object.keys(row).forEach((key) => {
        const val = row[key] ? row[key].toString() : '';
        acc[key] = Math.max(acc[key] || key.length, val.length);
      });
      return acc;
    }, {});

    worksheet['!cols'] = Object.keys(maxWidths).map((key) => ({
      wch: maxWidths[key] + 2,
    }));

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const dataBlob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    saveAs(dataBlob, filename);
  } catch (error) {
    console.error('Error generating Excel:', error);
    alert('Произошла ошибка при создании Excel');
  }
};

export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const isDark = document.documentElement.classList.contains('dark');

    // Add a temporary class to ensure the element renders well for PDF
    element.classList.add('pdf-export-mode');

    // Wait a brief moment for the class to apply and layout to settle
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get dimensions after the class is applied
    const rect = element.getBoundingClientRect();
    const pdfWidth = rect.width;
    const pdfHeight = rect.height;

    const dataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: 4, // Maximum quality for PDF
      cacheBust: true,
      includeQueryParams: true,
      fetchRequestInit: { cache: 'no-cache' },
      backgroundColor: isDark ? '#111827' : '#ffffff',
      width: pdfWidth,
      height: pdfHeight,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
        opacity: '1',
        visibility: 'visible',
        position: 'static',
        left: '0',
      },
    });

    element.classList.remove('pdf-export-mode');

    // Create PDF with custom dimensions to fit the content exactly
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [pdfWidth, pdfHeight],
      compress: true,
      precision: 16,
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Произошла ошибка при создании PDF');
    element.classList.remove('pdf-export-mode');
  }
};

export const exportToImage = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const isDark = document.documentElement.classList.contains('dark');

    // Add a temporary class to ensure the element renders well
    element.classList.add('pdf-export-mode');

    // Wait a brief moment for the class to apply and layout to settle
    await new Promise((resolve) => setTimeout(resolve, 100));

    const dataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: 5, // Maximum quality for images
      cacheBust: true,
      includeQueryParams: true,
      fetchRequestInit: { cache: 'no-cache' },
      backgroundColor: isDark ? '#111827' : '#ffffff',
      style: {
        opacity: '1',
        visibility: 'visible',
        position: 'static',
        left: '0',
      },
    });

    element.classList.remove('pdf-export-mode');

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error generating Image:', error);
    alert('Произошла ошибка при создании изображения');
    element.classList.remove('pdf-export-mode');
  }
};
