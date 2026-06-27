const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkLogs() {
  const { data: logs, error } = await supabaseAdmin
    .from('conta_azul_integration_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching logs:', error);
    return;
  }

  console.log('--- RECENT INTEGRATION LOGS ---');
  for (const log of logs) {
    console.log(`Date: ${log.created_at}`);
    console.log(`Action: ${log.action}`);
    console.log(`Status: ${log.status}`);
    console.log(`Error Message: ${log.error_message}`);
    console.log(`Response: ${JSON.stringify(log.response)}`);
    console.log('------------------------------');
  }
}

checkLogs();
