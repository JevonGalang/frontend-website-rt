import fs from 'fs';
import path from 'path';

function searchFiles(dir) {
  let files = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(searchFiles(fullPath));
    } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = searchFiles('src');
console.log('--- STORAGE AUDIT ---');
allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const localRefs = [];
  const sessionRefs = [];

  lines.forEach((line, idx) => {
    if (line.includes('localStorage')) {
      localRefs.push({ line: idx + 1, text: line.trim() });
    }
    if (line.includes('sessionStorage')) {
      sessionRefs.push({ line: idx + 1, text: line.trim() });
    }
  });

  if (localRefs.length > 0 || sessionRefs.length > 0) {
    console.log(`\nFile: ${file}`);
    console.log(`  sessionStorage (${sessionRefs.length} refs):`);
    sessionRefs.slice(0, 5).forEach(r => console.log(`    L${r.line}: ${r.text}`));
    if (sessionRefs.length > 5) console.log(`    ... and ${sessionRefs.length - 5} more`);
    
    console.log(`  localStorage (${localRefs.length} refs):`);
    localRefs.slice(0, 5).forEach(r => console.log(`    L${r.line}: ${r.text}`));
    if (localRefs.length > 5) console.log(`    ... and ${localRefs.length - 5} more`);
  }
});
