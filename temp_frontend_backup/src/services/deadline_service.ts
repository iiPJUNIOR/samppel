/**
 * Serviço centralizado para cálculo e validação da Data de Expedição e Prazos de Produção.
 */

/**
 * Adiciona dias a uma data base, podendo considerar Dias Úteis ou Corridos.
 */
export function addDaysToDate(startDate: Date, days: number, isBusinessDays: boolean = false): Date {
  const result = new Date(startDate.getTime());
  if (isNaN(result.getTime()) || days <= 0) return result;

  if (!isBusinessDays) {
    result.setDate(result.getDate() + days);
    return result;
  }

  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // 0 = Domingo, 6 = Sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result;
}

/**
 * Extrai intervalo ou quantidade de dias de escopo das observações.
 * Suporta: "25 a 30 dias", "25-30 dias", "15 dias", "prazo 20 d.u."
 */
export function detectScopeDays(notes: string | null): { minDays: number; maxDays: number; hasRange: boolean } | null {
  if (!notes) return null;

  // Regex para faixas de dias: ex "25 a 30 dias", "25 - 30 dias", "15 ate 20 dias"
  const rangeMatch = notes.match(/(\d{1,3})\s*(?:a|-|até)\s*(\d{1,3})\s*dias?/i);
  if (rangeMatch) {
    const minDays = parseInt(rangeMatch[1], 10);
    const maxDays = parseInt(rangeMatch[2], 10);
    if (!isNaN(minDays) && !isNaN(maxDays)) {
      return { minDays: Math.min(minDays, maxDays), maxDays: Math.max(minDays, maxDays), hasRange: true };
    }
  }

  // Regex para dias simples: ex "15 dias", "escopo: 20 dias", "prazo 10 d.ú."
  const singleMatch = notes.match(/(?:prazo|escopo|produção)?\s*:?\s*(\d{1,3})\s*(?:dias?|d\.?ú\.?)/i);
  if (singleMatch) {
    const days = parseInt(singleMatch[1], 10);
    if (!isNaN(days) && days > 0) {
      return { minDays: days, maxDays: days, hasRange: false };
    }
  }

  return null;
}

/**
 * Extrai a data de prazo fixada a partir das observações/notas (caso haja formato de data DD/MM/AAAA).
 */
export function parseDeadlineFromNotes(notes: string | null): Date | null {
  if (!notes) return null;

  const patterns = [
    /(?:prazo|entrega|prazo de entrega):\s*(\d{2})\/(\d{2})\/(\d{4})/i,
    /(?:prazo|entrega|prazo de entrega):\s*(\d{4})-(\d{2})-(\d{2})/i
  ];

  for (const pattern of patterns) {
    const match = notes.match(pattern);
    if (match) {
      if (match[3] && match[3].length === 4) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        const date = new Date(year, month, day, 23, 59, 59);
        if (!isNaN(date.getTime())) return date;
      } else {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const date = new Date(year, month, day, 23, 59, 59);
        if (!isNaN(date.getTime())) return date;
      }
    }
  }

  return null;
}

export interface ExpeditionCalculationResult {
  expeditionDate: Date | null;
  baseDate: Date | null;
  scopeDays: number;
  hasRange: boolean;
  minDays: number;
  maxDays: number;
  isFixedDate: boolean;
}

/**
 * Calcula a Data de Expedição com base na Data do Primeiro Pagamento + Dias de Escopo.
 */
export function calculateExpeditionDate(
  item: any,
  order?: any,
  options?: { isBusinessDays?: boolean; chosenDays?: number }
): ExpeditionCalculationResult {
  const orderObj = order || item?.order || {};
  const notes = [item?.notes, orderObj?.notes, orderObj?.internal_notes].filter(Boolean).join('\n');

  // 1. Caso haja uma data fixa no texto
  const fixedDate = parseDeadlineFromNotes(notes);
  if (fixedDate) {
    return {
      expeditionDate: fixedDate,
      baseDate: null,
      scopeDays: 0,
      hasRange: false,
      minDays: 0,
      maxDays: 0,
      isFixedDate: true
    };
  }

  // 2. Determina a Data Base (Primeiro Pagamento ou Início de Produção ou Data do Pedido)
  let baseDateStr = orderObj.first_payment_date || orderObj.production_start_date || orderObj.order_date || orderObj.created_at;
  let baseDate: Date | null = null;
  if (baseDateStr) {
    const parsed = new Date(baseDateStr);
    if (!isNaN(parsed.getTime())) {
      baseDate = parsed;
    }
  }

  if (!baseDate) {
    baseDate = new Date();
  }

  // 3. Detecta os dias de escopo
  const scopeInfo = detectScopeDays(notes);
  const minDays = scopeInfo ? scopeInfo.minDays : 15;
  const maxDays = scopeInfo ? scopeInfo.maxDays : 15;
  const hasRange = scopeInfo ? scopeInfo.hasRange : false;

  const scopeDays = options?.chosenDays !== undefined ? options.chosenDays : maxDays;
  const isBusinessDays = options?.isBusinessDays === true; // Padrão: Dias Corridos (DC)

  const expeditionDate = addDaysToDate(baseDate, scopeDays, isBusinessDays);

  return {
    expeditionDate,
    baseDate,
    scopeDays,
    hasRange,
    minDays,
    maxDays,
    isFixedDate: false
  };
}

/**
 * Verifica se um card está em atraso com base na Data de Expedição calculada.
 */
export function isCardOverdue(item: any, stages: any[], options?: { isBusinessDays?: boolean; chosenDays?: number }): boolean {
  if (item.order?.conta_azul_status === 'Em andamento') return false;

  const res = calculateExpeditionDate(item, undefined, options);
  if (!res.expeditionDate) return false;

  if (res.expeditionDate.getTime() >= Date.now()) return false;

  const currentStage = stages.find(s => s.id === item.stage_id);
  if (!currentStage) return false;

  const intermediateStages = ['Em produção', 'Manuseio', 'Em revisão', 'Expedição'];
  return intermediateStages.includes(currentStage.name);
}
