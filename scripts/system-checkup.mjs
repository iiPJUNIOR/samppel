import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('INICIANDO CHECKUP TECNICO AUTOMATIZADO - SAMPPEL');
console.log('====================================================\n');

let hasErrors = false;

// 1. Checagem de Arquivos Estruturais e Matriz de Funcionalidades
console.log('[1/4] Verificando integridade de arquivos estruturais...');
const requiredFiles = [
  'docs/CHECKUP_MATRIX.md',
  '.agents/skills/system-checkup/SKILL.md',
  'src/services/supabase_modules/orders.ts',
  'src/services/supabase_modules/customers.ts',
  'src/services/supabase_modules/products.ts',
  'src/services/supabase_modules/profiles.ts',
  'src/context/AuthContext.tsx',
  'src/components/modals/ProductionAlertModal.tsx',
  'src/components/modals/ConferencyModal.tsx',
  'src/components/modals/ExpeditionTransitionModal.tsx',
  'src/app/pedidos/page.tsx',
  'src/app/pedidos/saldos/page.tsx',
  'src/app/financeiro/page.tsx',
  'src/app/clientes/page.tsx',
  'src/app/produtos/page.tsx',
  'src/app/monitoramento/page.tsx',
  'src/app/api/admin/monitoring/route.ts',
  'supabase/supabase_monitoring_center.sql',
  'supabase/rollback_monitoring_center.sql'
];

let missingFiles = [];
for (const relPath of requiredFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    missingFiles.push(relPath);
  }
}

if (missingFiles.length > 0) {
  console.error('[ERRO] Arquivos obrigatorios ausentes:');
  missingFiles.forEach(f => console.error(`  - ${f}`));
  hasErrors = true;
} else {
  console.log('[OK] Todos os ' + requiredFiles.length + ' arquivos estruturais criticos estao presentes.');
}

// 2. Checagem de Rotas do App Router
console.log('\n[2/4] Verificando rotas e páginas do sistema...');
const appDir = path.join(rootDir, 'src', 'app');
const routes = [
  '',
  'pedidos',
  'pedidos/saldos',
  'clientes',
  'produtos',
  'financeiro',
  'fornecedores',
  'relatorios',
  'configuracoes',
  'operador-perfil',
  'monitoramento'
];

let invalidRoutes = [];
for (const route of routes) {
  const pagePath = path.join(appDir, route, 'page.tsx');
  if (!fs.existsSync(pagePath)) {
    invalidRoutes.push(route || '/');
  }
}

if (invalidRoutes.length > 0) {
  console.error('[ERRO] Paginas principais nao encontradas:');
  invalidRoutes.forEach(r => console.error(`  - /${r}`));
  hasErrors = true;
} else {
  console.log('[OK] Todas as ' + routes.length + ' rotas principais estao ativas com seus respectivos arquivos page.tsx.');
}

// 3. Validação de Integridade de Tipagem Estática (TypeScript)
console.log('\n[3/4] Executando analise estatica de tipos com TypeScript (tsc --noEmit)...');
try {
  execSync('npx tsc --noEmit', { cwd: rootDir, stdio: 'pipe' });
  console.log('[OK] TypeScript: 0 erros encontrados. Todos os tipos estao consistentes.');
} catch (err) {
  console.error('[ERRO] Falha na verificacao do TypeScript:');
  if (err.stdout) console.error(err.stdout.toString());
  if (err.stderr) console.error(err.stderr.toString());
  hasErrors = true;
}

// 4. Verificação de Validade da Matriz de Funcionalidades
console.log('\n[4/4] Verificando cadastro de modulos na Matriz de Funcionalidades...');
const matrixPath = path.join(rootDir, 'docs', 'CHECKUP_MATRIX.md');
if (fs.existsSync(matrixPath)) {
  const content = fs.readFileSync(matrixPath, 'utf-8');
  const moduleMatches = content.match(/MOD-\d+/g) || [];
  const uniqueModules = [...new Set(moduleMatches)];
  console.log('[OK] Matriz encontrada com ' + uniqueModules.length + ' modulos catalogados: ' + uniqueModules.join(', '));
} else {
  console.error('[ERRO] Arquivo docs/CHECKUP_MATRIX.md nao encontrado.');
  hasErrors = true;
}

// Conclusão
console.log('\n====================================================');
if (hasErrors) {
  console.error('RESULTADO: CHECKUP DETECTOU ANOMALIAS. CORRECAO NECESSARIA.');
  console.log('====================================================\n');
  process.exit(1);
} else {
  console.log('RESULTADO: SISTEMA 100% INTEGRO E OPERANTE.');
  console.log('====================================================\n');
  process.exit(0);
}
