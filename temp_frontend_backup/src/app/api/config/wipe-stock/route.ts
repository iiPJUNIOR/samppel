import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'SupabaseAdmin não inicializado no servidor.' }, { status: 500 });
  }

  console.log('[API Admin] Iniciando limpeza e redefinição de produtos e estoques...');

  try {
    const results: Record<string, any> = {};

    // 1. Limpar transações de estoque
    try {
      const { error } = await supabaseAdmin
        .from('stock_transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      results['stock_transactions'] = error ? `Erro: ${error.message}` : 'Sucesso';
    } catch (e: any) {
      results['stock_transactions'] = `Falha: ${e.message}`;
    }

    // 2. Limpar estoque personalizado de clientes
    try {
      const { error } = await supabaseAdmin
        .from('customer_product_stock')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      results['customer_product_stock'] = error ? `Erro: ${error.message}` : 'Sucesso';
    } catch (e: any) {
      results['customer_product_stock'] = `Falha: ${e.message}`;
    }

    // 3. Limpar créditos de estoque de clientes
    try {
      const { error } = await supabaseAdmin
        .from('customer_stock_credits')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      results['customer_stock_credits'] = error ? `Erro: ${error.message}` : 'Sucesso';
    } catch (e: any) {
      results['customer_stock_credits'] = `Falha: ${e.message}`;
    }

    // 4. Limpar ajustes de saldo de pedidos
    try {
      const { error } = await supabaseAdmin
        .from('order_balance_adjustments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      results['order_balance_adjustments'] = error ? `Erro: ${error.message}` : 'Sucesso';
    } catch (e: any) {
      results['order_balance_adjustments'] = `Falha: ${e.message}`;
    }

    // 5. Deduplicação e unificação de produtos duplicados
    const { data: allProducts } = await supabaseAdmin.from('products').select('*');
    if (allProducts && allProducts.length > 0) {
      const groups: Record<string, any[]> = {};
      allProducts.forEach(p => {
        const key = p.conta_azul_id ? `ca_${p.conta_azul_id}` : (p.sku ? `sku_${p.sku}` : `name_${p.name.trim().toLowerCase()}`);
        groups[key] = groups[key] || [];
        groups[key].push(p);
      });

      let removedDuplicates = 0;
      for (const [key, list] of Object.entries(groups)) {
        if (list.length > 1) {
          list.sort((a, b) => (b.stock_quantity || 0) - (a.stock_quantity || 0));
          const canonical = list[0];
          const duplicates = list.slice(1);

          for (const dup of duplicates) {
            await supabaseAdmin.from('orders').update({ product_id: canonical.id }).eq('product_id', dup.id);
            await supabaseAdmin.from('order_items').update({ product_id: canonical.id }).eq('product_id', dup.id);
            await supabaseAdmin.from('products').delete().eq('id', dup.id);
            removedDuplicates++;
          }
        }
      }
      results['duplicates_removed'] = removedDuplicates;
    }

    // 6. Zerar quantidade de estoque físico de todos os produtos
    const { error: resetErr } = await supabaseAdmin
      .from('products')
      .update({ stock_quantity: 0 })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    results['stock_quantity_reset'] = resetErr ? `Erro: ${resetErr.message}` : 'Sucesso';

    return NextResponse.json({ 
      message: 'Catálogo de produtos deduplicado e estoques zerados com sucesso.', 
      details: results 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
