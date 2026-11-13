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

  try {
    const { userId, pin } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, pin')
      .eq('id', userId)
      .maybeSingle();

    const updates: Record<string, any> = {
      force_password_change: false
    };

    if (pin !== undefined && pin !== null && String(pin).trim() !== '') {
      const trimmedPin = String(pin).trim();
      if (!/^\d{4,6}$/.test(trimmedPin)) {
        return NextResponse.json({ error: 'O PIN deve conter de 4 a 6 dígitos numéricos.' }, { status: 400 });
      }
      const { hashCredential } = await import('@/lib/crypto');
      updates.pin = hashCredential(trimmedPin);
    } else if (existingProfile?.role === 'Produção' && !existingProfile?.pin) {
      return NextResponse.json(
        { error: 'Operadores de Produção precisam cadastrar um PIN numérico de 4 a 6 dígitos.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Erro ao atualizar force_password_change no banco via Admin API:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Exigência de troca de senha removida com sucesso.' });
  } catch (err: any) {
    console.error('Erro no endpoint clear-force-password:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
