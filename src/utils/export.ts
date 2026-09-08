import { MonthData, Bank } from "../types";
import { getBankDetails } from "../constants";
import { toast } from "sonner";

/**
 * Прогрев dynamic import для ускорения отклика при клике на кнопки экспорта
 */
export const preloadExportModule = (
  type: "excel" | "pdf" | "image" | "all",
) => {
  if (type === "excel" || type === "all") {
    void import("xlsx");
    void import("file-saver");
  }
  if (type === "pdf" || type === "all") {
    void import("jspdf");
    void import("html-to-image");
  }
  if (type === "image" || type === "all") {
    void import("html-to-image");
  }
};

export const exportToExcel = async (
  data: MonthData,
  customBanks: Bank[],
  filename: string,
): Promise<void> => {
  try {
    const exportPromise = (async () => {
      const [xlsxModule, { saveAs }] = await Promise.all([
        import("xlsx"),
        import("file-saver"),
      ]);

      type XlsxModule = typeof import("xlsx") & {
        default?: typeof import("xlsx");
      };
      const typedXlsx = xlsxModule as XlsxModule;
      const XLSX = typedXlsx.default?.utils ? typedXlsx.default : typedXlsx;

      interface ExcelRow {
        Банк: string;
        Категория: string;
        Процент: string | number;
      }

      const rows: ExcelRow[] = [];

      data.entries.forEach((entry) => {
        let bank = getBankDetails(entry.bankId, entry.customBankName);
        if (!bank && entry.bankId.startsWith("custom_")) {
          bank = customBanks.find((b) => b.id === entry.bankId);
        }

        const bankName = bank?.name || "Неизвестный банк";

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
      XLSX.utils.book_append_sheet(workbook, worksheet, "Кэшбек");

      // Auto-size columns
      const maxWidths = rows.reduce<Record<string, number>>((acc, row) => {
        (Object.keys(row) as (keyof ExcelRow)[]).forEach((key) => {
          const val = row[key] != null ? String(row[key]) : "";
          acc[key] = Math.max(acc[key] || key.length, val.length);
        });
        return acc;
      }, {});

      worksheet["!cols"] = Object.keys(maxWidths).map((key) => ({
        wch: maxWidths[key] + 2,
      }));

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const dataBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });
      saveAs(dataBlob, filename);
      return true;
    })();

    await toast.promise(exportPromise, {
      loading: "Генерация Excel...",
      success: "Excel файл успешно создан",
      error: "Ошибка при создании Excel",
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    toast.error("Произошла ошибка при создании Excel");
  }
};

const captureElementAsPng = async (
  elementId: string,
  targetWidth: number,
): Promise<{ dataUrl: string; width: number; height: number }> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  const { toPng } = await import("html-to-image");
  const isDark = document.documentElement.classList.contains("dark");

  // Clone the element to avoid visual jumps in the main UI
  const clone = element.cloneNode(true) as HTMLElement;
  clone.classList.add("pdf-export-mode");

  // Use position: fixed to avoid triggering scrollbars
  Object.assign(clone.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: `${targetWidth}px`,
    opacity: "0",
    pointerEvents: "none",
    zIndex: "-9999",
    visibility: "visible",
    display: "block",
    transform: "none",
    overflow: "hidden", // Prevent any internal scrollbars
  });

  document.body.appendChild(clone);

  try {
    // Wait for fonts to be ready
    if (document.fonts) {
      await document.fonts.ready;
    }

    const rect = clone.getBoundingClientRect();
    const width = rect.width || targetWidth;
    const height = rect.height || 800;

    const dataUrl = await toPng(clone, {
      quality: 1,
      pixelRatio: 2,
      cacheBust: true,
      includeQueryParams: true,
      fetchRequestInit: { cache: "no-cache" },
      backgroundColor: isDark ? "#111827" : "#ffffff",
      width: width,
      height: height,
      style: {
        transform: "none",
        opacity: "1",
        visibility: "visible",
      },
    });

    if (!dataUrl || dataUrl === "data:,") {
      throw new Error("Failed to generate image data");
    }

    return { dataUrl, width, height };
  } finally {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
};

export const exportToPDF = async (
  elementId: string,
  filename: string,
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const exportPromise = (async () => {
    try {
      const windowWidth = window.innerWidth;
      let targetWidth = 1200; // Desktop default
      if (windowWidth < 768) {
        targetWidth = 400; // Mobile
      } else if (windowWidth < 1024) {
        targetWidth = 800; // Tablet
      }

      const [{ dataUrl, width, height }, jspdfModule] = await Promise.all([
        captureElementAsPng(elementId, targetWidth),
        import("jspdf"),
      ]);

      type JsPdfModule = typeof import("jspdf") & {
        default?: typeof import("jspdf").jsPDF;
      };
      const typedJsPdf = jspdfModule as JsPdfModule;
      const JsPDFClass = typedJsPdf.default || typedJsPdf.jsPDF;

      const pdf = new JsPDFClass({
        orientation: width > height ? "landscape" : "portrait",
        unit: "px",
        format: [width, height],
        compress: true,
        precision: 16,
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      pdf.save(filename);
      return true;
    } catch (err) {
      console.error("PDF Export Error:", err);
      throw err;
    }
  })();

  await toast.promise(exportPromise, {
    loading: "Генерация PDF...",
    success: "PDF файл успешно создан",
    error: "Ошибка при создании PDF",
  });
};

export const exportToImage = async (
  elementId: string,
  filename: string,
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const exportPromise = (async () => {
    try {
      const windowWidth = window.innerWidth;
      let targetWidth = 1200; // Desktop default
      if (windowWidth < 768) {
        targetWidth = 400; // Mobile
      } else if (windowWidth < 1024) {
        targetWidth = 800; // Tablet
      }

      const { dataUrl } = await captureElementAsPng(elementId, targetWidth);

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
      return true;
    } catch (err) {
      console.error("Image Export Error:", err);
      throw err;
    }
  })();

  await toast.promise(exportPromise, {
    loading: "Генерация изображения...",
    success: "Изображение успешно создано",
    error: "Ошибка при создании изображения",
  });
};
