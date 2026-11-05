import { MonthData, Bank, CategoryItem } from "../types";
import { getBankDetails } from "../constants";
import { formatPercentValue } from "./format";
import { sortCategoriesAsc } from "./sorting";
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

/**
 * Генерирует таблицу стилей OpenXML (xl/styles.xml) для аккуратного оформления Excel:
 * - Выравнивание объединённых ячеек банков по центру (по вертикали и горизонтали)
 * - Центрирование колонки «%»
 * - Тонкие внутренние линии между категориями одного банка и более плотные разделители между банками
 */
const buildExcelStylesXml = (): string => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <!-- 0: Regular base -->
    <font><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/><family val="2"/></font>
    <!-- 1: Header Bold -->
    <font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/><family val="2"/></font>
    <!-- 2: Regular Category & Percent -->
    <font><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/><family val="2"/></font>
    <!-- 3: Bank Name Bold -->
    <font><b/><sz val="11"/><color rgb="FF1E293B"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <!-- 2: Header fill (light slate) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 3: Bank cell fill (clean subtle slate) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <!-- 1: Uniform crisp border on all cells as in user workbook -->
    <border>
      <left style="thin"><color rgb="FF000000"/></left>
      <right style="thin"><color rgb="FF000000"/></right>
      <top style="thin"><color rgb="FF000000"/></top>
      <bottom style="thin"><color rgb="FF000000"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="6">
    <!-- 0: Default -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <!-- 1: Unused baseline -->
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <!-- 2: Header (Center, Center, Fill, Border, Bold) -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 3: Bank Name (Center, Center, Bold, Fill, Border, WrapText) -->
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <!-- 4: Percent (Center, Center, Border) -->
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 5: Category (Left, Center, Border) -->
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Обычный" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>`;

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

      const sheetRows: string[][] = [["Банк", "%", "Категория"]];
      const merges: Array<{
        s: { r: number; c: number };
        e: { r: number; c: number };
      }> = [];

      let maxBankLen = 10;
      let maxPercentLen = 5;
      let maxCatLen = 16;

      data.entries.forEach((entry) => {
        let bank = getBankDetails(entry.bankId, entry.customBankName);
        if (!bank && entry.bankId.startsWith("custom_")) {
          bank = customBanks.find((b) => b.id === entry.bankId);
        }

        const bankName = bank?.name || entry.customBankName || "Неизвестный банк";
        maxBankLen = Math.max(maxBankLen, bankName.length);

        const sortedCategories = sortCategoriesAsc(
          entry.categories,
        ) as CategoryItem[];

        if (sortedCategories.length === 0) return;

        const startRowIdx = sheetRows.length; // 1-based row in sheet is startRowIdx + 1

        sortedCategories.forEach((category, idx) => {
          const catName =
            typeof category === "string" ? category : category.name;
          const rawPercent =
            typeof category === "string"
              ? ""
              : formatPercentValue(category.percent);
          const formattedPercent = rawPercent ? `${rawPercent}%` : "—";

          maxPercentLen = Math.max(maxPercentLen, formattedPercent.length);
          maxCatLen = Math.max(maxCatLen, catName.length);

          sheetRows.push([
            idx === 0 ? bankName : "",
            formattedPercent,
            catName,
          ]);
        });

        const endRowIdx = sheetRows.length - 1;
        if (endRowIdx > startRowIdx) {
          merges.push({
            s: { r: startRowIdx, c: 0 },
            e: { r: endRowIdx, c: 0 },
          });
        }
      });

      const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
      worksheet["!merges"] = merges;
      if (sheetRows.length > 1) {
        worksheet["!autofilter"] = {
          ref: `A1:C${sheetRows.length}`,
        };
      }

      worksheet["!cols"] = [
        { wch: Math.max(12, maxBankLen + 3) },
        { wch: Math.max(7, maxPercentLen + 3) },
        { wch: Math.max(20, maxCatLen + 4) },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Кэшбек");

      const rawBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      // Обогащаем сгенерированный архив XLSX точными стилями ячеек и высотой строк
      let finalBuffer: ArrayBuffer | Uint8Array = rawBuffer;
      try {
        const cfb = XLSX.CFB.read(new Uint8Array(rawBuffer), { type: "array" });
        const stylesEntry = XLSX.CFB.find(cfb, "/xl/styles.xml");
        const sheetEntry = XLSX.CFB.find(cfb, "/xl/worksheets/sheet1.xml");

        if (stylesEntry && sheetEntry && sheetEntry.content) {
          const encoder = new TextEncoder();
          const decoder = new TextDecoder("utf-8");

          stylesEntry.content = encoder.encode(buildExcelStylesXml());

          let sheetXml = decoder.decode(
            sheetEntry.content instanceof Uint8Array
              ? sheetEntry.content
              : new Uint8Array(sheetEntry.content as ArrayBuffer),
          );

      // Не задаём фиксированный customHeight ht="...", чтобы Excel и Google Sheets рассчитывали идеальную высоту строк автоматически
          // Добавляем тег <cols> с bestFit="1" и точной шириной по символам контента
          const colAWidth = Math.max(13, maxBankLen + 4);
          const colBWidth = Math.max(7.5, maxPercentLen + 3);
          const colCWidth = Math.max(19, maxCatLen + 4);

          const colsXml = `<cols><col min="1" max="1" width="${colAWidth}" bestFit="1" customWidth="1"/><col min="2" max="2" width="${colBWidth}" bestFit="1" customWidth="1"/><col min="3" max="3" width="${colCWidth}" bestFit="1" customWidth="1"/></cols>`;

          if (sheetXml.includes("<cols>")) {
            sheetXml = sheetXml.replace(/<cols>[\s\S]*?<\/cols>/, colsXml);
          } else {
            sheetXml = sheetXml.replace("<sheetData>", `${colsXml}<sheetData>`);
          }

          // Привязываем точный индекс стиля s="...":
          // s="2" - шапка (центр, жирный, заливка, рамка)
          // s="3" - колонка А (банк: центр, жирный, заливка, рамка, перенос строк)
          // s="4" - колонка B (%: центр, рамка)
          // s="5" - колонка C (категория: слева, рамка)
          sheetXml = sheetXml.replace(
            /<c r="([ABC])(\d+)"([^>]*)>/g,
            (_match, col: string, rowNumStr: string, restAttrs: string) => {
              const rowNum = parseInt(rowNumStr, 10);
              let styleIdx: number;

              if (rowNum === 1) {
                styleIdx = 2;
              } else {
                if (col === "A") styleIdx = 3;
                else if (col === "B") styleIdx = 4;
                else styleIdx = 5;
              }

              const cleanedAttrs = restAttrs.replace(/\s+s="\d+"/, "");
              return `<c r="${col}${rowNum}" s="${styleIdx}"${cleanedAttrs}>`;
            },
          );

          sheetEntry.content = encoder.encode(sheetXml);
          finalBuffer = XLSX.CFB.write(cfb, {
            fileType: "zip",
            type: "array",
          }) as ArrayBuffer;
        }
      } catch (styleErr) {
        console.warn("Excel style enrichment skipped:", styleErr);
      }

      const dataBlob = new Blob([finalBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });
      saveAs(dataBlob, filename);
      return true;
    })();

    await toast.promise(exportPromise, {
      loading: "Подготовка таблицы Excel...",
      success: "Таблица Excel сохранена",
      error: "Не удалось сохранить Excel",
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
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
      backgroundColor: isDark ? "#0B1220" : "#ffffff",
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
    loading: "Подготовка документа PDF...",
    success: "Документ PDF сохранён",
    error: "Не удалось сохранить PDF",
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
    loading: "Создание изображения PNG...",
    success: "Изображение PNG сохранено",
    error: "Не удалось сохранить изображение",
  });
};
