/**
 * Serviço centralizado para cálculo e validação de prazos de produção.
 */

/**
 * Extrai a data de prazo a partir das observações/notas do pedido ou item.
 * Suporta formatos:
 * - "Prazo: DD/MM/AAAA"
 * - "Prazo: AAAA-MM-DD"
 * - "Entrega: DD/MM/AAAA"
 * - "Entrega: AAAA-MM-DD"
 */
export function parseDeadlineFromNotes(notes: string | null): Date | null {
  if (!notes) return null;

  // Regex para capturar data no formato DD/MM/AAAA ou AAAA-MM-DD associado a "prazo" ou "entrega"
  const patterns = [
    /(?:prazo|entrega|prazo de entrega):\s*(\d{2})\/(\d{2})\/(\d{4})/i,
    /(?:prazo|entrega|prazo de entrega):\s*(\d{4})-(\d{2})-(\d{2})/i
  ];

  for (const pattern of patterns) {
    const match = notes.match(pattern);
    if (match) {
      if (match[3] && match[3].length === 4) {
        // DD/MM/AAAA
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // 0-indexed
        const year = parseInt(match[3], 10);
        const date = new Date(year, month, day, 23, 59, 59);
        if (!isNaN(date.getTime())) return date;
      } else {
        // AAAA-MM-DD
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

/**
 * Verifica se um card está em atraso com base na data limite e etapa atual.
 * Apenas colunas intermediárias (Produção, Manuseio, Embalagem, Expedição) são elegíveis para atraso automático.
 */
export function isCardOverdue(item: any, stages: any[]): boolean {
  const notes = item.notes || item.order?.notes || null;
  const deadline = parseDeadlineFromNotes(notes);
  if (!deadline) return false;

  // Se o prazo é maior ou igual ao momento atual, não está atrasado
  if (deadline.getTime() >= Date.now()) return false;

  // Verificar se o item está em uma etapa intermediária
  const currentStage = stages.find(s => s.id === item.stage_id);
  if (!currentStage) return false;

  // Colunas intermediárias/elegíveis para atraso
  const intermediateStages = ['Em produção', 'Manuseio', 'Em revisão', 'Expedição'];
  return intermediateStages.includes(currentStage.name);
}
