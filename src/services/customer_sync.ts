/**
 * Serviço centralizado para sincronização da base de clientes do Conta Azul para o banco de dados do sistema.
 */

export interface SyncCustomersProgressCallback {
  (step: string, progress: number): void;
}

export interface SyncCustomersResult {
  success: boolean;
  imported: number;
  updated: number;
  error?: string;
}

/**
 * Dispara a importação completa de todos os clientes do Conta Azul, alimentando a tabela customers no banco.
 */
export async function syncAllCustomersFromContaAzul(
  onProgress?: SyncCustomersProgressCallback
): Promise<SyncCustomersResult> {
  try {
    const res = await fetch('/api/sync/import-customers', { method: 'POST' });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Falha no servidor ao sincronizar clientes (${res.status}): ${errText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('Leitura em streaming não suportada pelo navegador.');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: SyncCustomersResult = { success: false, imported: 0, updated: 0 };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line);
          if (chunk.step && onProgress) {
            onProgress(chunk.step, typeof chunk.progress === 'number' ? chunk.progress : 0);
          }
          if (chunk.success !== undefined) {
            if (chunk.success) {
              finalResult = {
                success: true,
                imported: chunk.imported || 0,
                updated: chunk.updated || 0,
                error: undefined
              };
            } else {
              finalResult = {
                success: false,
                imported: 0,
                updated: 0,
                error: chunk.error || 'Erro desconhecido na sincronização de clientes.'
              };
            }
          }
        } catch {
          // Ignora fragmentos parciais de JSON entre chunks
        }
      }
    }

    return finalResult;
  } catch (err: any) {
    return {
      success: false,
      imported: 0,
      updated: 0,
      error: err.message || 'Erro inesperado na sincronização de clientes.'
    };
  }
}
