const fs = require('fs');
let code = fs.readFileSync('src/views/Archive.tsx', 'utf8');

// Replace MonthAccordion with MonthCard
code = code.replace(/interface MonthAccordionProps[\s\S]*?MonthAccordion\.displayName = "MonthAccordion";/, `
import { Modal } from "../components/ui/Modal";

interface MonthCardProps {
  month: MonthData;
  onClick: () => void;
  onDeleteClick: (e: React.MouseEvent) => void;
}

const MonthCard: React.FC<MonthCardProps> = memo(({ month, onClick, onDeleteClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onClick={onClick}
      className="bg-white/60 dark:bg-[var(--surface-1)]/60 backdrop-blur-md rounded-card border border-[var(--border-hairline)] shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:border-[var(--accent-color)]/30 transition-all duration-300 cursor-pointer p-4 sm:p-5 flex flex-col group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-color)]/0 to-[var(--accent-color)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-color)]/10 dark:bg-[var(--accent-color)]/20 text-[var(--accent-color)] flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
            {month.monthId.split("-")[1]}
          </div>
          <div className="text-left min-w-0">
            <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight truncate tracking-tight">
              {capitalize(formatMonthId(month.monthId))}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">
              {month.entries.length} {pluralize(month.entries.length, ["банк", "банка", "банков"])}
            </p>
          </div>
        </div>
        
        <button
          onClick={onDeleteClick}
          className="p-2 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-control transition-[color,background-color,transform] cursor-pointer active:scale-90"
          title="Удалить месяц"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
});
MonthCard.displayName = "MonthCard";
`);

// Replace Archive logic
code = code.replace(/const \[expandedMonths, setExpandedMonths\] = useState.*?;\n/s, `
    const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
    const selectedMonth = useMemo(() => filteredData.find(m => m.monthId === selectedMonthId), [filteredData, selectedMonthId]);
`);

code = code.replace(/const toggleMonth = useCallback.*?\}, \[\]\);\n/s, ``);

code = code.replace(/<div className="flex flex-col gap-2 sm:gap-3">\n.*?<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\);\n\s*\},\n\);\n\nArchive\.displayName/s, `
        {/* Grid View */}
        {filteredData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 pb-[80px] md:pb-0">
            {filteredData.map((month) => (
              <MonthCard
                key={month.monthId}
                month={month}
                onClick={() => setSelectedMonthId(month.monthId)}
                onDeleteClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMonthClick(month.monthId);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center pb-[100px] md:pb-12 animate-fade-down">
            <div className="w-16 h-16 bg-[var(--surface-0)] dark:bg-[var(--surface-2)] border border-[var(--border-hairline)] rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-[var(--text-primary)] font-bold text-lg mb-2">
              Ничего не найдено
            </h3>
            <p className="text-[var(--text-secondary)] text-sm max-w-[280px]">
              Попробуйте изменить параметры поиска или фильтрации
            </p>
          </div>
        )}
        
        {/* Month Details Modal */}
        <Modal
          isOpen={!!selectedMonthId}
          onClose={() => setSelectedMonthId(null)}
          title={selectedMonth ? capitalize(formatMonthId(selectedMonth.monthId)) : ""}
          isBottomSheet={true}
        >
          {selectedMonth && (
            <div className="flex flex-col gap-4">
              <div className="flex p-1 gap-1 bg-[var(--fill)] rounded-control border border-[var(--border-hairline)] shadow-[0_2px_8px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_8px_rgb(0,0,0,0.1)] translate-z-0">
                  <button
                    onClick={() => handleExportImage(selectedMonth.monthId)}
                    className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-control hover:bg-[var(--fill-hover)] hover:shadow-sm border border-transparent transition-[background-color,border-color,box-shadow,transform] group cursor-pointer active:scale-95"
                    title="Изображение (PNG)"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform mb-0.5" />
                    <span className="text-[9px] font-semibold text-[var(--text-secondary)] leading-none">
                      PNG
                    </span>
                  </button>

                  <button
                    onClick={() => handleExportExcel(selectedMonth)}
                    className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-control hover:bg-[var(--fill-hover)] hover:shadow-sm border border-transparent transition-[background-color,border-color,box-shadow,transform] group cursor-pointer active:scale-90"
                    title="Таблица (Excel)"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[var(--accent-color)] group-hover:scale-110 transition-transform mb-0.5" />
                    <span className="text-[9px] font-semibold text-[var(--text-secondary)] leading-none">
                      Excel
                    </span>
                  </button>

                  <button
                    onClick={() => handleExport(selectedMonth.monthId)}
                    className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-control hover:bg-[var(--fill-hover)] hover:shadow-sm border border-transparent transition-[background-color,border-color,box-shadow,transform] group cursor-pointer active:scale-95"
                    title="Документ (PDF)"
                  >
                    <FileText className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform mb-0.5" />
                    <span className="text-[9px] font-semibold text-[var(--text-secondary)] leading-none">
                      PDF
                    </span>
                  </button>
                </div>
                
                <CashbackTable
                  id={\`archive-table-\${selectedMonth.monthId}\`}
                  monthId={selectedMonth.monthId}
                  entries={selectedMonth.entries}
                  customBanks={customBanks}
                  globalLogoShape={globalLogoShape}
                  onExportPDF={() => handleExport(selectedMonth.monthId)}
                  onExportExcel={() => handleExportExcel(selectedMonth)}
                  onExportImage={() => handleExportImage(selectedMonth.monthId)}
                />
            </div>
          )}
        </Modal>
      </div>
    );
  },
);
Archive.displayName`);

fs.writeFileSync('src/views/Archive.tsx', code);
