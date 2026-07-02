const fs = require('fs');
const file = 'src/versions.json';
const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

data.push({
  "version": "1.13.4",
  "date": "2026-07-02",
  "changes": [
    "Дизайн-система: Восстановлены корректные радиусы скругления модальных окон (Справочник, История версий) на мобильных и десктоп устройствах.",
    "Дизайн-система: Полностью унифицировано использование переменных цвета (--surface-0, --surface-1, --surface-2) на всех экранах приложения для идеального соответствия тёмной и светлой темы."
  ]
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('Updated versions.json');
