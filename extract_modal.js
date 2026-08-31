const fs = require('fs');
const { execSync } = require('child_process');

const triggerStr = process.argv[2];
const componentName = process.argv[3];

if (!triggerStr || !componentName) {
  console.error('Usage: node extract_modal.js <TriggerString> <ComponentName>');
  process.exit(1);
}

let pageContent = fs.readFileSync('src/app/pedidos/page.tsx', 'utf8');
const lines = pageContent.split('\n');

const startLine = lines.findIndex(l => l.includes(`{${triggerStr} &&`));
if (startLine === -1) {
  console.error(`Could not find start for ${triggerStr}`);
  process.exit(1);
}

const isIIFE = lines[startLine].match(/&&\s*\(\(\)\s*=>\s*\{/) || lines[startLine].match(/&&\s*\(\(\)\s*=>\s*\(/);

let openBraces = 0;
let endLine = -1;
for (let i = startLine; i < lines.length; i++) {
  const line = lines[i];
  const openCount = (line.match(/\{/g) || []).length;
  const closeCount = (line.match(/\}/g) || []).length;
  openBraces += openCount - closeCount;
  
  if (i > startLine && openBraces === 0 && (line.includes(')}')) || (isIIFE && openBraces === 1 && line.includes('})()}'))) {
    if (isIIFE && line.includes('})()}')) {
       endLine = i;
       break;
    } else if (!isIIFE && line.includes(')}')) {
       endLine = i;
       break;
    }
  }
}

if (isIIFE && endLine === -1) {
  let open = 0;
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    open += (line.match(/\{/g) || []).length;
    open -= (line.match(/\}/g) || []).length;
    if (i > startLine && line.includes('})()}')) {
      endLine = i;
      break;
    }
  }
}

if (endLine === -1) {
  console.error('Could not find end bounds.');
  process.exit(1);
}

const jsxContent = lines.slice(startLine + 1, endLine).join('\n');
const tempFilePath = `src/components/modals/${componentName}.tsx`;

let initialComponentWithoutTsNocheck = `import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function ${componentName}(props: any) {
  const {
    // __PROPS__
  } = props;

${isIIFE ? jsxContent : `  return (\n    <>\n${jsxContent}\n    </>\n  );`}
}
`;

fs.writeFileSync(tempFilePath, initialComponentWithoutTsNocheck, 'utf8');

console.log('Running tsc to map dependencies...');
let tscOutput = '';
try {
  execSync(`npx tsc --noEmit --jsx react-jsx ${tempFilePath}`);
} catch (error) {
  tscOutput = error.stdout ? error.stdout.toString() : '';
  tscOutput += error.stderr ? error.stderr.toString() : '';
  if (!tscOutput && error.message) tscOutput = error.message;
}

const regex = /Cannot find name '([^']+)'/g;
let match;
const vars = new Set();
while ((match = regex.exec(tscOutput)) !== null) {
  vars.add(match[1]);
}

const toIgnore = ['React', 'Image', 'setTimeout', 'console', 'document', 'window', 'Math', 'Number', 'String', 'Boolean', 'Object', 'Array', 'Date', 'JSON', 'Promise', 'Error', 'Event', 'alert', 'confirm', 'prompt', 'process', 'module', 'require', 'localStorage'];
toIgnore.forEach(i => vars.delete(i));

const sortedVars = Array.from(vars).sort();
console.log('Dependencies found:', sortedVars.length);

const finalComponent = '// @ts-nocheck\n' + initialComponentWithoutTsNocheck.replace('// __PROPS__', sortedVars.length > 0 ? sortedVars.join(',\n    ') : '');
fs.writeFileSync(tempFilePath, finalComponent, 'utf8');

const injectionLine = `      {${triggerStr} && <${componentName} {...{ ${sortedVars.join(', ')} }} />}`;
lines.splice(startLine, (endLine - startLine) + 1, injectionLine);

const importIndex = lines.findIndex(l => l.includes('import { DeleteConfirmModal'));
if (importIndex !== -1 && !lines.join('\n').includes(componentName)) {
  lines.splice(importIndex + 1, 0, `import { ${componentName} } from '@/components/modals/${componentName}';`);
}

fs.writeFileSync('src/app/pedidos/page.tsx', lines.join('\n'), 'utf8');
console.log(`Successfully extracted ${componentName}`);
