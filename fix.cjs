const fs = require('fs');
const glob = require('glob');

const replaceInFile = (file) => {
  const content = fs.readFileSync(file, 'utf-8');
  let updated = content;
  
  updated = updated.replace(/bg-\[#FAFAFA\] dark:bg-\[var\(--surface-1\)\]/g, 'bg-[var(--surface-0)] dark:bg-[var(--surface-1)]');
  updated = updated.replace(/bg-\[#FAFAFA\] dark:bg-\[var\(--surface-0\)\]/g, 'bg-[var(--surface-0)] dark:bg-[var(--surface-0)]');
  updated = updated.replace(/bg-\[#FAFAFA\]/g, 'bg-[var(--surface-0)]');
  
  updated = updated.replace(/dark:bg-\[#0A0A0A\]/g, 'dark:bg-[var(--surface-0)]');
  updated = updated.replace(/bg-\[#0A0A0A\]/g, 'bg-[var(--surface-0)]');
  
  updated = updated.replace(/dark:hover:bg-\[#1A1A1A\]/g, 'dark:hover:bg-[var(--surface-2)]');
  
  updated = updated.replace(/rounded-\[1\.25rem\]/g, 'rounded-3xl');

  if (content !== updated) {
    fs.writeFileSync(file, updated);
    console.log('Updated', file);
  }
};

glob.sync('src/**/*.{ts,tsx}').forEach(replaceInFile);
