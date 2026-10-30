/**
 * Servico de fila de sincronizacao em background.
 * Por definicao arquitetural (M1-A), o Conta Azul atua como fonte primaria
 * (sentido Conta Azul -> Portal Samppel), portanto o envio reverso automatico
 * permanece desativado sem geracao de IDs ou logs simulados.
 */
export class SyncQueueService {
  private tenantId: string;

  constructor(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
    this.tenantId = tenantId;
  }

  public async processQueue(): Promise<{ processed: number; successes: number; failures: number }> {
    void this.tenantId;
    return { processed: 0, successes: 0, failures: 0 };
  }
}

export default SyncQueueService;
