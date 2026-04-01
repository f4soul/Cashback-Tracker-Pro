import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { MonthData, Bank } from '../types';
import { getBankDetails } from '../constants';
import { toast } from 'sonner';

export const exportToExcel = (data: MonthData, customBanks: Bank[], filename: string) => {
  try {
    toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          const rows: any[] = [];

          data.entries.forEach(entry => {
            let bank = getBankDetails(entry.bankId, entry.customBankName);
            if (!bank && entry.bankId.startsWith('custom_')) {
              bank = customBanks.find(b => b.id === entry.bankId);
            }
            
            const bankName = bank?.name || 'Неизвестный банк';

            entry.categories.forEach(category => {
              rows.push({
                'Банк': bankName,
                'Категория': category.name,
                'Процент': category.percent
              });
            });
          });

          const worksheet = XLSX.utils.json_to_sheet(rows);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Кэшбек');

          // Auto-size columns
          const maxWidths = rows.reduce((acc, row) => {
            Object.keys(row).forEach(key => {
              const val = row[key] ? row[key].toString() : '';
              acc[key] = Math.max(acc[key] || key.length, val.length);
            });
            return acc;
          }, {});

          worksheet['!cols'] = Object.keys(maxWidths).map(key => ({
            wch: maxWidths[key] + 2
          }));

          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
          saveAs(dataBlob, filename);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      }),
      {
        loading: 'Генерация Excel...',
        success: 'Excel файл успешно создан',
        error: 'Ошибка при создании Excel',
      }
    );
  } catch (error) {
    console.error('Error generating Excel:', error);
    toast.error('Произошла ошибка при создании Excel');
  }
};

export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  toast.promise(
    new Promise(async (resolve, reject) => {
      let clone: HTMLElement | null = null;
      try {
        const isDark = document.documentElement.classList.contains('dark');
        
        // Determine target width based on device type
        const windowWidth = window.innerWidth;
        let targetWidth = 1200; // Desktop default
        if (windowWidth < 768) {
          targetWidth = 400; // Mobile
        } else if (windowWidth < 1024) {
          targetWidth = 800; // Tablet
        }
        
        // Clone the element to avoid visual jumps in the main UI
        clone = element.cloneNode(true) as HTMLElement;
        clone.classList.add('pdf-export-mode');
        
        // Use position: fixed to avoid triggering scrollbars
        Object.assign(clone.style, {
          position: 'fixed',
          top: '0',
          left: '0',
          width: `${targetWidth}px`,
          opacity: '0',
          pointerEvents: 'none',
          zIndex: '-9999',
          visibility: 'visible',
          display: 'block',
          transform: 'none',
          overflow: 'hidden', // Prevent any internal scrollbars
        });
        
        document.body.appendChild(clone);
        
        // Wait for fonts and layout to settle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const rect = clone.getBoundingClientRect();
        const pdfWidth = rect.width || targetWidth;
        const pdfHeight = rect.height || 800;
        
        const dataUrl = await toPng(clone, {
          quality: 1,
          pixelRatio: 2,
          cacheBust: true,
          includeQueryParams: true,
          fetchRequestInit: { cache: 'no-cache' },
          backgroundColor: isDark ? '#111827' : '#ffffff',
          width: pdfWidth,
          height: pdfHeight,
          style: {
            transform: 'none',
            opacity: '1',
            visibility: 'visible',
          }
        });
        
        if (!dataUrl || dataUrl === 'data:,') {
          throw new Error('Failed to generate image data');
        }

        document.body.removeChild(clone);
        clone = null;

        const pdf = new jsPDF({
          orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
          unit: 'px',
          format: [pdfWidth, pdfHeight],
          compress: true,
          precision: 16
        });
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(filename);
        resolve(true);
      } catch (err) {
        console.error('PDF Export Error:', err);
        if (clone && document.body.contains(clone)) {
          document.body.removeChild(clone);
        }
        reject(err);
      }
    }),
    {
      loading: 'Генерация PDF...',
      success: 'PDF файл успешно создан',
      error: 'Ошибка при создании PDF',
    }
  );
};

export const exportToImage = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  toast.promise(
    new Promise(async (resolve, reject) => {
      let clone: HTMLElement | null = null;
      try {
        const isDark = document.documentElement.classList.contains('dark');
        
        // Determine target width based on device type
        const windowWidth = window.innerWidth;
        let targetWidth = 1200; // Desktop default
        if (windowWidth < 768) {
          targetWidth = 400; // Mobile
        } else if (windowWidth < 1024) {
          targetWidth = 800; // Tablet
        }
        
        // Clone the element to avoid visual jumps in the main UI
        clone = element.cloneNode(true) as HTMLElement;
        clone.classList.add('pdf-export-mode');
        
        Object.assign(clone.style, {
          position: 'fixed',
          top: '0',
          left: '0',
          width: `${targetWidth}px`,
          opacity: '0',
          pointerEvents: 'none',
          zIndex: '-9999',
          visibility: 'visible',
          display: 'block',
          transform: 'none',
          overflow: 'hidden',
        });
        
        document.body.appendChild(clone);
        
        // Wait for fonts and layout to settle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const rect = clone.getBoundingClientRect();
        const width = rect.width || targetWidth;
        const height = rect.height || 800;

        const dataUrl = await toPng(clone, {
          quality: 1,
          pixelRatio: 2,
          cacheBust: true,
          includeQueryParams: true,
          fetchRequestInit: { cache: 'no-cache' },
          backgroundColor: isDark ? '#111827' : '#ffffff',
          width: width,
          height: height,
          style: {
            transform: 'none',
            opacity: '1',
            visibility: 'visible',
          }
        });
        
        if (!dataUrl || dataUrl === 'data:,') {
          throw new Error('Failed to generate image data');
        }

        document.body.removeChild(clone);
        clone = null;
        
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
        resolve(true);
      } catch (err) {
        console.error('Image Export Error:', err);
        if (clone && document.body.contains(clone)) {
          document.body.removeChild(clone);
        }
        reject(err);
      }
    }),
    {
      loading: 'Генерация изображения...',
      success: 'Изображение успешно создано',
      error: 'Ошибка при создании изображения',
    }
  );
};
