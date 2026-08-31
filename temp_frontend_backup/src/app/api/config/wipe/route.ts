import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SupabaseAdmin não inicializado no servidor.' }, { status: 500 });
  }

  console.log('[API Admin] Iniciando redefinição da base de dados local...');

  try {
    // Lista de tabelas a serem limpas respeitando restrições de chaves estrangeiras
    const tables = [
      'sync_queue',
      'order_item_sector_history',
      'order_item_packaging_volumes',
      'order_item_packaging',
      'financial_transactions',
      'order_items',
      'orders',
      'customers',
      'products'
    ];

    const results: Record<string, string> = {};

    for (const t of tables) {
      try {
        let query = supabaseAdmin.from(t).delete();
        
        if (t === 'financial_transactions') {
          // Deleta transações com order_id ou receitas
          query = query.or('order_id.not.is.null,type.eq.RECEITA');
        } else {
          // Outras tabelas: deleta todos usando filtro dummy neq
          query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        }

        const { error } = await query;
        if (error) {
          results[t] = `Erro: ${error.message}`;
        } else {
          results[t] = 'Sucesso';
        }
      } catch (err: any) {
        results[t] = `Falha: ${err.message}`;
      }
    }

    return NextResponse.json({ 
      message: 'Portal Samppel zerado com sucesso localmente.', 
      details: results 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
