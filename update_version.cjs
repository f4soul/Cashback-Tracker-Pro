const fs = require('fs');
const file = 'src/versions.json';
const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

data.push({
  "version": "1.13.5",
  "date": "2026-07-03",
  "changes": [
    "Плавность интерфейса (Safari): переработан механизм анимации списков при поиске и фильтрации банков и категорий. Заменен конфликтный режим AnimatePresence (popLayout) на более нативный LayoutGroup (layout='position'), что полностью устранило дергание, мерцание и скачки элементов в браузерах Safari."
  ]
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('Updated versions.json');
