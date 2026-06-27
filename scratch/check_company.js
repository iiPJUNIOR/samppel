const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = '/Users/paulojunior/samppel/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Environment variables missing on .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const COMPANY_ID = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';

async function checkAndInsertCompany() {
  console.log('Verificando se a empresa padrao existe no banco...');
  
  const { data: company, error: selectError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', COMPANY_ID)
    .maybeSingle();
    
  if (selectError) {
    console.error('Erro ao buscar a empresa:', selectError);
    process.exit(1);
  }
  
  if (company) {
    console.log('Empresa ja cadastrada:', company);
  } else {
    console.log('Empresa nao encontrada. Cadastrando...');
    const { data: newCompany, error: insertError } = await supabase
      .from('companies')
      .insert([{
        id: COMPANY_ID,
        name: 'Samppel Embalagens Ltda',
        cnpj: '12.345.678/0001-90'
      }])
      .select()
      .single();
      
    if (insertError) {
      console.error('Erro ao cadastrar a empresa:', insertError);
      process.exit(1);
    }
    console.log('Empresa cadastrada com sucesso:', newCompany);
  }
}

checkAndInsertCompany();
