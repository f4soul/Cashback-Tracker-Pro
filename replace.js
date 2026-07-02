const fs = require('fs');
const glob = require('glob');

const replaceInFile = (file) => {
  const content = fs.readFileSync(file, 'utf-8');
  if (content.includes('radius-app')) {
    const updated = content.replace(/rounded-\[var\(--radius-app\)]/g, 'rounded-3xl');
    fs.writeFileSync(file, updated);
    console.log('Updated', file);
  }
};

glob.sync('src/**/*.{ts,tsx,css,json}').forEach(replaceInFile);
