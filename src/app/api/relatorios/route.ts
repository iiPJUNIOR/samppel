import { NextRequest, NextResponse } from 'next/server';
import { getSectorTransitionReport } from '@/services/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
  
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const customerId = searchParams.get('customerId') || undefined;
  const productId = searchParams.get('productId') || undefined;
  const machineId = searchParams.get('machineId') || undefined;

  try {
    const report = await getSectorTransitionReport(tenantId, {
      startDate,
      endDate,
      customerId,
      productId,
      machineId
    });

    if (report.error) {
      return NextResponse.json({ success: false, error: (report.error as any).message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: report.data
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Falha ao processar relatório.' },
      { status: 500 }
    );
  }
}
