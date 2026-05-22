import fs from 'fs';
import path from 'path';

const LOGOS_DIR = path.join(process.cwd(), 'src', 'assets', 'logos');
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'components', 'bankLogosSpriteData.ts');

function buildSprite() {
  try {
    console.log('Building SVG sprite for bank logos...');
    
    if (!fs.existsSync(LOGOS_DIR)) {
      console.error(`Logos directory does not exist: ${LOGOS_DIR}`);
      return;
    }

    const files = fs.readdirSync(LOGOS_DIR);
    const svgFiles = files.filter(file => file.endsWith('.svg') && file !== 'sprite.svg' && file !== 'bank-icon.svg');

    let spriteContent = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position: absolute; width: 0; height: 0; overflow: hidden;">\n';

    for (const file of svgFiles) {
      const fileName = path.basename(file, '.svg');
      const filePath = path.join(LOGOS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Extract viewBox
      const viewBoxMatch = content.match(/viewBox=["']([^"']+)["']/i);
      const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 100 100';

      // Remove the outer svg tags
      let innerXml = content
        .replace(/<svg[^>]*>/i, '')
        .replace(/<\/svg>/i, '')
        .trim();

      // Avoid conflict in IDs (gradients, clip paths, masks etc.)
      const idRegex = /id=["']([^"']+)["']/gi;
      let match;
      const idsToReplace = [];

      while ((match = idRegex.exec(innerXml)) !== null) {
        idsToReplace.push(match[1]);
      }

      // De-duplicate ids to replace
      const uniqueIds = [...new Set(idsToReplace)];

      // Rewrite IDs and their references to avoid conflict across multiple logos
      for (const id of uniqueIds) {
        // Simple and robust prefixing
        const escapedId = id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const newId = `${fileName}_${id}`;
        
        // Replace id="..." 
        innerXml = innerXml.replace(new RegExp(`id=["']${escapedId}["']`, 'gi'), `id="${newId}"`);
        
        // Replace url(#...) references
        innerXml = innerXml.replace(new RegExp(`url\\(#${escapedId}\\)`, 'gi'), `url(#${newId})`);
        innerXml = innerXml.replace(new RegExp(`url\\('#${escapedId}'\\)`, 'gi'), `url('#${newId}')`);
        
        // Replace href="#..." references (for gradient or clipPath Reuse if any)
        innerXml = innerXml.replace(new RegExp(`href=["']#${escapedId}["']`, 'gi'), `href="#${newId}"`);
        innerXml = innerXml.replace(new RegExp(`xlink:href=["']#${escapedId}["']`, 'gi'), `xlink:href="#${newId}"`);
      }

      spriteContent += `  <symbol id="${fileName}" viewBox="${viewBox}">\n    ${innerXml}\n  </symbol>\n`;
    }

    // Now write the bank-icon SVG if it exists (or embed natively)
    const bankIconPath = path.join(LOGOS_DIR, 'bank-icon.svg');
    if (fs.existsSync(bankIconPath)) {
      const content = fs.readFileSync(bankIconPath, 'utf-8');
      const viewBoxMatch = content.match(/viewBox=["']([^"']+)["']/i);
      const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 100 100';
      const innerXml = content
        .replace(/<svg[^>]*>/i, '')
        .replace(/<\/svg>/i, '')
        .trim();
      spriteContent += `  <symbol id="bank-icon" viewBox="${viewBox}">\n    ${innerXml}\n  </symbol>\n`;
    }

    spriteContent += '</svg>\n';

    const tsContent = `// Auto-generated SVG Sprite\nexport const bankLogosSpriteData = ${JSON.stringify(spriteContent)};\n`;

    fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');
    console.log(`Successfully built SVG sprite with ${svgFiles.length} logos at: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error compiling SVG sprite:', error);
  }
}

buildSprite();
