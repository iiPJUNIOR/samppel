export type PolarityType =
  | 'HIGH_IS_GOOD'
  | 'LOW_IS_GOOD'
  | 'ZERO_IS_BEST'
  | 'DUAL'
  | 'CONTROL_REF';

export interface MetricGuide {
  title: string;
  polarity: PolarityType;
  polarityLabel: string;
  whatIsIt: string;
  whenToAct: string;
  codeFixToAvoidPro: string;
}

export const METRIC_GUIDES = {
  // ── CABECALHO & CONTROLES GLOBAIS ─────────────────────────────────────────
  rpc_latency_cache: {
    title: 'Latencia RPC & Cache Anti-Autoconsumo (60s)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'LATENCIA: BOM SER BAIXA (< 250ms) | CACHE: BOM ESTAR ATIVO',
    whatIsIt:
      'Mostra quantos milissegundos levou a chamada consolidada no Postgres (1 unica query traz toda a tela) e se a resposta veio do cache em memoria de 60 segundos do servidor.',
    whenToAct:
      'Apenas se a latencia RPC passar constantemente de 800 ms, o que indicaria banco sobrecarregado.',
    codeFixToAvoidPro:
      'Manter toda a coleta condensada em 1 unica RPC SQL com cache de 60s garante que abrir esta tela nao gaste sua cota do Plano Free.',
  },
  auto_refresh_5m: {
    title: 'Atualizacao Automatica Inteligente (Auto 5m)',
    polarity: 'CONTROL_REF',
    polarityLabel: 'PADRAO RECOMENDADO: PAUSADO NO DIA A DIA',
    whatIsIt:
      'Quando ativado, recarrega os dados a cada 5 minutos SOMENTE se esta aba estiver aberta e visivel na tela (usa Page Visibility API). Se voce minimizar ou trocar de aba, ele para sozinho.',
    whenToAct:
      'Ative apenas quando estiver acompanhando uma manutencao ao vivo; deixe Pausado no restante do tempo.',
    codeFixToAvoidPro:
      'Em qualquer tela nova do sistema, nunca use setInterval cego em background; sempre valide document.visibilityState === "visible" no codigo.',
  },
  api_real_plan_status: {
    title: 'Plano Oficial via API Supabase & Regua Dupla (Pro -> Alvo Free)',
    polarity: 'CONTROL_REF',
    polarityLabel: 'PLANO ALVO: FREE (CUSTO ZERO) | CACHE API: 10 MINUTOS',
    whatIsIt:
      'Consulta diretamente a Supabase Management API v1 (/v1/organizations/{slug} e /v1/projects/{ref}/billing/addons) para exibir qual plano esta ativo de verdade na sua conta hoje (ex: PRO ATIVO neste mes), mantendo ao mesmo tempo a Regua Meta Free (500 MB / 1 GB / 5 GB / 50k MAU) ligada por padrao nos alertas.',
    whenToAct:
      'Enquanto estiver no mes do Pro pago, guie-se sempre pela Regua Meta Free para garantir que o consumo nunca passe dos limites gratuitos antes de virar o mes.',
    codeFixToAvoidPro:
      'Adicione SUPABASE_ACCESS_TOKEN (seu PAT sbp_...) apenas nas Environment Variables de servidor na Vercel. O cache de 10 minutos garante zero rate-limit e zero custo.',
  },
  downgrade_readiness_checklist: {
    title: 'Checklist Automatico de 6 Pre-Requisitos & Janela Ideal Pro -> Free',
    polarity: 'CONTROL_REF',
    polarityLabel: 'OBJETIVO: 6 DE 6 ITENS "PRONTO PARA FREE" ANTES DA VIRADA DO CICLO',
    whatIsIt:
      'Audita automaticamente via SQL + Management API todas as travas oficiais da Supabase para fazer downgrade do Pro para o Free sem erro: 1) Banco <= 500 MB; 2) Storage <= 1 GB; 3) MAU <= 50.000; 4) Zero add-ons pagos extras; 5) Vaga no limite global de 2 projetos Free ativos em toda a sua conta; 6) Egress controlado e atividade < 7 dias.',
    whenToAct:
      '1 a 2 dias ANTES da data de renovacao do ciclo Pro. Importante: na Supabase o downgrade tem efeito imediato (nao espera o fim do mes e dias restantes viram credito interno, nao estorno no cartao), mas se passar da data de renovacao cobra mais US$ 25.',
    codeFixToAvoidPro:
      'Se o item 5 apontar projetos Free ativos em outras organizacoes da sua conta, pause os projetos sem uso ate sobrar no maximo 1 projeto Free ativo fora desta organizacao antes de clicar em Downgrade.',
  },
  api_gateway_requests: {
    title: 'Requisicoes Oficiais no API Gateway (Ultimas 24h)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO E PROPORCIONAL A EQUIPE (Sem picos noturnos)',
    whatIsIt:
      'Puxa diretamente do endpoint oficial /analytics/endpoints/usage.api-counts da Supabase quantas requisicoes HTTP bateram em REST (PostgREST), Auth, Storage e Realtime nas ultimas 24 horas.',
    whenToAct:
      'No Plano Free as requisicoes de API sao ilimitadas, mas o volume de dados trafegado por elas conta nos 5 GB mensais de Egress. Agir apenas se REST ou Auth dispararem dezenas de milhares de chamadas por dia numa equipe pequena.',
    codeFixToAvoidPro:
      'Se REST subir demais, agrupe leituras repetidas em lote (.in()) e remova .select("*"). Se Auth subir demais, evite chamadas desnecessarias de getSession()/refreshSession() em polling.',
  },
  vm_hardware_metrics: {
    title: 'Telemetria Real da VM via Prometheus (RAM Fisica, Disco /data e Rede)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'RAM E DISCO DA VM: BOM SER BAIXO (< 80%)',
    whatIsIt:
      'Lido diretamente do endpoint oficial Prometheus da instancia Postgres (node_memory_*, node_filesystem_* e node_network_transmit_bytes_total). Mostra a memoria RAM fisica real da maquina virtual, o disco SSD provisionado e o acumulador bruto de rede da VM desde o ultimo boot. Nota: a Supabase nao expoe o valor consolidado de Egress faturado em GB na Management API publica; este numero de rede e do hardware da VM, enquanto a fatura oficial fica no link direto "Usage Oficial".',
    whenToAct:
      'Se a RAM Fisica usada ficar constantemente acima de 85% (risco de swap/lentidao no Nano Compute do Free).',
    codeFixToAvoidPro:
      'Reduzir conexoes simultaneas abertas, criar indices SQL para evitar sorts pesados em memoria e paginar respostas grandes mantem a RAM folgada mesmo no Compute gratuito do Free.',
  },
  kpi_mau_quota: {
    title: 'Usuarios Ativos Mensais — MAU (Teto Free: 50.000)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Abaixo de 50.000 MAU/mes = 100% gratuito)',
    whatIsIt:
      'Quantidade de usuarios unicos autenticados no Supabase Auth nos ultimos 30 dias (auth.users.last_sign_in_at). O Plano Free inclui ate 50.000 MAU gratuitos por mes (e o Pro ate 100.000).',
    whenToAct:
      'Em um ERP/Portal corporativo interno (dezenas de colaboradores), voce usara menos de 0,1% dessa cota e nunca precisara agir.',
    codeFixToAvoidPro:
      'Nunca crie usuarios descartaveis/anonimos automaticos no Supabase Auth a cada visita publica; mantenha login restrito apenas aos colaboradores reais.',
  },

  // ── PAINEL VEREDITO ANTI-ESTOURO (5 PILARES DO PLANO FREE) ────────────────
  section_free_shield: {
    title: 'Radar Anti-Upgrade Pro (Veredito Explicito de Cota Free)',
    polarity: 'CONTROL_REF',
    polarityLabel: 'OBJETIVO: MANTER OS 5 PILARES VERDES NO PLANO FREE',
    whatIsIt:
      'Cruza em tempo real os 5 limites fisicos que forcam empresas a pagar o Plano Pro (Disco 500 MB, Storage 1 GB, Egress 5 GB/mes, RAM/Conexoes e Loops Serverless) e responde diretamente se voce precisa agir hoje ou nao.',
    whenToAct:
      'Somente quando algum pilar mudar de "SEM ACAO AGORA" para "ACAO PREVENTIVA" (amarelo, >= 65% do teto) ou "AGIR AGORA" (vermelho, >= 85% do teto).',
    codeFixToAvoidPro:
      'Sempre que um pilar ficar amarelo, aplique a limpeza em 1 clique ou o ajuste de codigo indicado no proprio pilar — assim o consumo cai imediatamente sem gastar com upgrade.',
  },
  pilar_db_disk: {
    title: 'Pilar 1: Disco do Banco Postgres (Teto Free: 500 MB)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Ideal: abaixo de 350 MB / 70%)',
    whatIsIt:
      'Soma todo o espaco fisico ocupado pelas linhas e indices das suas tabelas no Supabase. No Plano Free, ao bater 500 MB o banco entra em modo somente-leitura (read-only).',
    whenToAct:
      'Acao preventiva ao passar de 325 MB (65%). Acao imediata acima de 425 MB (85%). Abaixo disso, nenhuma acao e necessaria.',
    codeFixToAvoidPro:
      '1) Expurgar logs antigos e sync_queue concluida em 1 clique; 2) No codigo, nunca gravar base64/PDF/imagem em colunas texto/JSONB; 3) Reduzir retencao de logs automaticos no cron diario.',
  },
  pilar_storage_files: {
    title: 'Pilar 2: Arquivos no Supabase Storage (Teto Free: 1 GB)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Ideal: abaixo de 700 MB / 70%)',
    whatIsIt:
      'Espaco ocupado por arquivos enviados aos buckets do Supabase Storage (imagens, comprovantes, anexos). O Plano Free inclui ate 1 GB gratuito.',
    whenToAct:
      'Acao preventiva ao passar de 650 MB (65%). Acao imediata acima de 850 MB (85%).',
    codeFixToAvoidPro:
      'Comprimir imagens no navegador antes do upload (converter para WebP / limitar resolucao), adicionar cacheControl: "31536000" e excluir anexos de pedidos antigos/cancelados.',
  },
  pilar_egress_n1: {
    title: 'Pilar 3: Trafego de Dados / Egress & Anti-N+1 (Teto Free: 5 GB/mes)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Poucas chamadas e poucas linhas/min)',
    whatIsIt:
      'Mede o volume de consultas repetidas e linhas trafegadas do banco para o navegador/servidor. O maior vilao que estoura os 5 GB mensais do Plano Free sao loops N+1 (fazer 500 queries pequenas ao abrir 1 tela) e SELECT *.',
    whenToAct:
      'Quando uma unica query passar de 25.000 chamadas desde o ultimo reset ou o ritmo continuo passar de 2.500 linhas/min.',
    codeFixToAvoidPro:
      'No codigo (src/services/), trocar .select("*") pelas colunas exatas, buscar itens relacionados em 1 unico lote com .in("order_id", ids), paginar tabelas (.range(0, 49)) e usar cache de 60s nas rotas.',
  },
  pilar_ram_connections: {
    title: 'Pilar 4: Memoria RAM (Cache Hit) & Pool de Conexoes',
    polarity: 'DUAL',
    polarityLabel: 'CACHE RAM: BOM SER ALTO (>= 98%) | CONEXOES: BOM SER BAIXO (< 35)',
    whatIsIt:
      'No Plano Free a RAM e a CPU do banco sao compartilhadas (Nano Compute). Quando o Cache Hit fica em 99%+, o Postgres responde direto da memoria RAM sem ler disco lento. Ja as conexoes simultaneas tem teto de 60 conexoes diretas.',
    whenToAct:
      'Se o Cache Hit cair abaixo de 97%, se as conexoes passarem de 42/60 (70%) ou se houver qualquer transacao zumbi (> 5 min) > 0.',
    codeFixToAvoidPro:
      'Para subir Cache Hit sem pagar Compute Pro: criar indice SQL (CREATE INDEX) nas colunas filtradas (.eq/.order) e rodar ANALYZE. Para baixar conexoes: usar cliente Supabase singleton e encerrar zumbis.',
  },
  pilar_serverless_loops: {
    title: 'Pilar 5: Automacao Serverless, Crons & Loops OAuth',
    polarity: 'ZERO_IS_BEST',
    polarityLabel: 'BOM SER ZERO (0 loops de erro, 0 itens travados)',
    whatIsIt:
      'Monitora se crons automaticos ou falhas de token do Conta Azul estao batendo repetidamente na Vercel e no Supabase sem sucesso, o que desperdicaria invocacoes serverless e banco.',
    whenToAct:
      'Se o Circuit Breaker abrir, se surgir erro END_TRIAL / falha de Refresh Token ou se houver >= 6 erros na ultima hora.',
    codeFixToAvoidPro:
      'Reconectar a conta comercial do Conta Azul em /configuracoes, manter o Circuit Breaker e a trava de 12 min ativos no codigo e manter apenas 1 agendador externo habilitado.',
  },

  // ── ABA 1: KPIS PRINCIPAIS & GRAFICOS ─────────────────────────────────────
  kpi_health_score: {
    title: 'Score de Saude Geral (0 a 100)',
    polarity: 'HIGH_IS_GOOD',
    polarityLabel: 'BOM SER ALTO (Ideal: 85 a 100)',
    whatIsIt:
      'Nota consolidada calculada automaticamente a partir de disco, N+1, conexoes, memoria RAM, seguranca RLS, integridade de pedidos e sincronizacao Conta Azul.',
    whenToAct:
      'Acima de 85: operacao saudavel. Entre 60 e 84: revise os alertas preventivos abaixo com calma. Abaixo de 60: ha alerta critico pedindo acao imediata.',
    codeFixToAvoidPro:
      'Siga os cards da secao "Diagnosticos Preventivos" logo abaixo — cada item descontado da nota traz a receita exata de codigo ou botao de correcao em 1 clique.',
  },
  kpi_db_disk: {
    title: 'Disco Postgres (Ocupacao Fisica Real)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Plano Free: manter abaixo de 350 MB)',
    whatIsIt:
      'Tamanho total do banco de dados no disco do Supabase (dados + indices + catalogos). O limite gratuito e de 500 MB.',
    whenToAct:
      'Enquanto estiver abaixo de 325 MB (65% do Free) com tendencia estavel, voce NAO precisa fazer nada. Acima de 350 MB, rode limpeza preventiva.',
    codeFixToAvoidPro:
      'Use a aba "Manutencao" para limpar logs (> 48h) e sync_queue concluida, e verifique na aba "Armazenamento" qual tabela ocupa mais espaco para criar rotina de arquivamento/limpeza no codigo.',
  },
  kpi_query_velocity: {
    title: 'Ritmo de Consultas & Linhas Trafegadas por Minuto',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Quanto menor, menos CPU e menos Egress)',
    whatIsIt:
      'Calcula quantas queries SQL e quantas linhas por minuto o sistema executou entre os dois ultimos snapshots. E o termometro direto de consumo de rede (Egress) e processador.',
    whenToAct:
      'Em operacao normal de fabrica (equipe interna), fica entre 0 e algumas centenas por minuto. Se disparar para milhares/min sem ninguem usando, ha polling ou loop N+1 no codigo.',
    codeFixToAvoidPro:
      'Abra a aba "Consultas & Detector N+1", ordene por "Mais Chamadas", identifique a tabela lider e agrupe a consulta no codigo TypeScript ou adicione cache.',
  },
  kpi_connections_ram: {
    title: 'Conexoes Simultaneas & Buffer Cache Hit RAM',
    polarity: 'DUAL',
    polarityLabel: 'CONEXOES: BOM SER BAIXO (< 35/60) | BUFFER RAM: BOM SER ALTO (>= 98%)',
    whatIsIt:
      'O numero grande (ex: 6/60) mostra quantos canais abertos existem agora no Postgres (menor e melhor). Abaixo, "Buffer RAM" mostra quantos % dos dados vieram direto da memoria ultrarrapida sem tocar no disco (maior e melhor, ideal 99%+), e "Zumbis" mostra conexoes travadas ha mais de 5 min (ideal 0).',
    whenToAct:
      'Agir se Conexoes passar de 42/60, se Buffer RAM cair abaixo de 97% ou se Zumbis for maior que 0.',
    codeFixToAvoidPro:
      'Se Zumbis > 0, clique em "Encerrar Zumbis" na aba Manutencao. Se Buffer RAM cair, crie indice SQL nas tabelas com muitos Seq Scans. Se Conexoes subir, use pooler Supavisor (porta 6543) e evite loops de conexoes diretas.',
  },
  kpi_ca_integration: {
    title: 'Saude Conta Azul, Crons & Fila Outbox',
    polarity: 'ZERO_IS_BEST',
    polarityLabel: 'ERROS E FALHAS: BOM SER ZERO (0) | TOKEN: ATIVO',
    whatIsIt:
      'Resume quantos erros a integracao com o Conta Azul registrou nas ultimas 24h, se ha itens encalhados na fila e quantas chamadas duplicadas de cron foram barradas pela nossa trava de economia.',
    whenToAct:
      'Se a badge ficar amarela/vermelha ("Token Expirado" com erro de refresh ou "Circuit Aberto") ou se os erros/24h comecarem a subir continuamente.',
    codeFixToAvoidPro:
      'Se o token falhar, reconecte em /configuracoes. O Circuit Breaker no codigo ja corta tentativas inuteis apos 3 falhas seguidas para proteger sua cota gratuita.',
  },
  section_diagnostics: {
    title: 'Motor de Diagnosticos Preventivos & Receitas de Codigo',
    polarity: 'ZERO_IS_BEST',
    polarityLabel: 'BOM TER ZERO APONTAMENTOS (Lista vazia = 100% nominal)',
    whatIsIt:
      'Analisa automaticamente todas as metricas do banco e gera alertas mastigados somente quando existe algo fora do ideal, classificando entre "PRECISA AGIR AGORA", "ACAO PREVENTIVA" ou "INFORMATIVO".',
    whenToAct:
      'Priorize itens marcados como CRITICO / PRECISA AGIR AGORA. Itens ATENCAO / ACAO PREVENTIVA podem ser resolvidos planejadamente sem risco de queda imediata.',
    codeFixToAvoidPro:
      'Cada card traz um quadro dedicado "Como resolver no codigo / banco (sem pagar o Pro)" alem do botao de execucao automatica em 1 clique quando aplicavel.',
  },
  section_sparklines: {
    title: 'Serie Temporal Automatica (Tendencia de Crescimento)',
    polarity: 'CONTROL_REF',
    polarityLabel: 'IDEAL: LINHAS ESTAVEIS OU DE SUBIDA SUAVE (SEM DEGRAUS VERTICAIS)',
    whatIsIt:
      'Graficos historicos gravados a cada 15 minutos ocupando menos de 300 KB no banco (auto-limpeza de 30 dias). Permitem enxergar se um problema comecou hoje apos um deploy ou se ja era antigo.',
    whenToAct:
      'Se notar uma rampa ingreme subindo rapido em Disco, Chamadas SQL ou Erros 24h.',
    codeFixToAvoidPro:
      'Compare o horario em que a curva subiu com o ultimo commit no Git (`git log`) para isolar exatamente qual mudanca de codigo aumentou o consumo.',
  },
  spark_db_size: {
    title: 'Tendencia: Evolucao de Disco do Banco (MB)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO E ESTAVEL (Linha reta horizontal)',
    whatIsIt:
      'Mostra se o tamanho em megabytes do banco esta estavel ou crescendo a cada dia.',
    whenToAct:
      'Se o grafico subir varios MB por dia continuamente em direcao aos 500 MB.',
    codeFixToAvoidPro:
      'Automatize DELETE de logs/filas antigas no cron diario (/api/sync/cron?mode=full) para que o disco fique em linha reta constante.',
  },
  spark_sql_calls: {
    title: 'Tendencia: Total Acumulado de Chamadas SQL',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SUBIR DEVAGAR (Rampa suave; salto vertical indica loop N+1)',
    whatIsIt:
      'Como e um contador acumulado, e normal subir levemente conforme a equipe usa o sistema. O que nao pode ocorrer sao saltos verticais abruptos.',
    whenToAct:
      'Se houver um salto brusco de dezenas de milhares de chamadas em poucos minutos.',
    codeFixToAvoidPro:
      'Va na aba "Consultas & Detector N+1", veja qual query disparou e troque chamadas repetidas no frontend/API por consulta unica em lote.',
  },
  spark_active_conn: {
    title: 'Tendencia: Conexoes Ativas Simultaneas',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Ideal: 1 a 10 conexoes ativas)',
    whatIsIt:
      'Quantidade de queries rodando exatamente no instante de cada coleta.',
    whenToAct:
      'Se ficar constantemente acima de 20 conexoes ativas simultaneas.',
    codeFixToAvoidPro:
      'Otimize queries lentas com indices SQL para que cada conexao abra, responda em < 10ms e libere a vaga imediatamente.',
  },
  spark_ca_errors: {
    title: 'Tendencia: Erros Conta Azul (Janela 24h)',
    polarity: 'ZERO_IS_BEST',
    polarityLabel: 'BOM SER ZERO (Linha colada na base em 0)',
    whatIsIt:
      'Volume de falhas na integracao Conta Azul nas ultimas 24 horas em cada ponto do tempo.',
    whenToAct:
      'Se sair de zero e continuar subindo a cada ciclo de 15 minutos.',
    codeFixToAvoidPro:
      'Verifique o erro exato na aba "Conta Azul, Crons & Filas" para corrigir payload, mapeamento ou renovar conexao OAuth.',
  },

  // ── ABA 2: CONSULTAS & DETECTOR N+1 ───────────────────────────────────────
  section_n1_detector: {
    title: 'Raio-X do pg_stat_statements & Detector Anti-N+1',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'OBJETIVO: ZERO QUERIES COM RISCO "CRITICO" POS-RESET',
    whatIsIt:
      'Lista as consultas SQL reais que mais exigem do seu banco Postgres. Foi exatamente esta visao que permitiu eliminar o gargalo historico de 1,5 milhao de chamadas em order_item_packaging.',
    whenToAct:
      'Sempre apos subir uma funcionalidade nova: clique em "Resetar Linha de Base Agora", use o sistema por algumas horas e confira se alguma query ficou amarela/vermelha.',
    codeFixToAvoidPro:
      'Substitua buscas dentro de loops por .in("coluna", arrayDeIds), remova .select("*") em tabelas largas e evite recarregar listas inteiras a cada clique no Kanban.',
  },
  baseline_reset: {
    title: 'Marco Zero / Linha de Base de Consultas',
    polarity: 'CONTROL_REF',
    polarityLabel: 'FERRAMENTA DE MEDICAO LIMPA POS-DEPLOY',
    whatIsIt:
      'O Postgres soma todas as queries desde o dia em que o servidor ligou ("Bruto Total"). Ao clicar em "Resetar Linha de Base", salvamos uma foto atual para que a coluna "Chamadas (Desde Reset)" mostre apenas o que aconteceu DAQUI PARA FRENTE.',
    whenToAct:
      'Clique sempre depois de corrigir uma query no codigo para comprovar que o problema parou de acontecer.',
    codeFixToAvoidPro:
      'Nao apaga nenhum dado do sistema — apenas redefine o cronometro de medicao de performance.',
  },
  col_n1_risk: {
    title: 'Coluna: Risco N+1',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM ESTAR "NORMAL" (Verde)',
    whatIsIt:
      'Classifica automaticamente a frequencia da query desde o ultimo reset: NORMAL (< 15 mil), ATENCAO (15 mil a 99 mil) ou CRITICO (>= 100 mil chamadas).',
    whenToAct:
      'Investigar no codigo qualquer consulta de aplicacao que entre em ATENCAO ou CRITICO em poucos dias.',
    codeFixToAvoidPro:
      'Agrupar chamadas repetidas num unico endpoint/query em lote ou memorizar (cache) catalogos fixos como etapas e produtos.',
  },
  col_calls_since_reset: {
    title: 'Coluna: Chamadas (Desde Reset)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Proporcional ao uso real da equipe)',
    whatIsIt:
      'Quantas vezes essa mesma consulta SQL rodou desde que voce clicou em "Resetar Linha de Base".',
    whenToAct:
      'Se uma query de tela rodar 500 vezes quando voce abre a pagina apenas 1 vez, isso e um N+1 classico.',
    codeFixToAvoidPro:
      'Use joins do Supabase (.select("*, items:order_items(*)")) ou busca bulk (.in()) em vez de 1 query por card.',
  },
  col_raw_calls: {
    title: 'Coluna: Bruto Total (Historico Acumulado)',
    polarity: 'CONTROL_REF',
    polarityLabel: 'APENAS HISTORICO ACUMULADO DO MOTOR POSTGRES',
    whatIsIt:
      'Contador vitalicio interno do Postgres desde o ultimo reinicio do servidor da Supabase (inclui gargalos antigos ja corrigidos no codigo).',
    whenToAct:
      'Nao se assuste se este numero for alto por causa do passado — guie suas decisoes pela coluna "Chamadas (Desde Reset)".',
    codeFixToAvoidPro:
      'Clique em "Resetar Linha de Base Agora" para isolar o trafego novo do historico antigo.',
  },
  col_rows_returned: {
    title: 'Coluna: Linhas Retornadas (Impacto Direto em Egress)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Protege a franquia de 5 GB de Egress Free)',
    whatIsIt:
      'Soma de linhas entregues por essa query desde o reset. Enviar milhoes de linhas pela rede e o que consome a cota mensal de 5 GB de Egress do Plano Free.',
    whenToAct:
      'Se uma query retorna milhares de linhas por chamada quando a tela exibe apenas 20 ou 50 itens.',
    codeFixToAvoidPro:
      'Adicione filtros .eq() / .gte() no banco (nunca baixe a tabela toda para filtrar com .filter() no JavaScript!) e use .limit() / paginacao.',
  },
  col_total_time_ms: {
    title: 'Coluna: Tempo Total Acumulado (ms de CPU)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Economiza CPU compartilhada do Plano Free)',
    whatIsIt:
      'Soma de todos os milissegundos de processador gastos por essa query (Chamadas x Tempo Medio). Mostra quem mais consome a CPU do banco.',
    whenToAct:
      'Queries no topo do modo "Maior Tempo Total (CPU)" sao as melhores candidatas para otimizacao.',
    codeFixToAvoidPro:
      'Se o tempo total e alto por muitas chamadas, reduza chamadas no codigo; se e alto por lentidao individual, crie um indice SQL.',
  },
  col_mean_max_ms: {
    title: 'Coluna: Latencia Media / Pico (ms)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Ideal: media abaixo de 15 ms)',
    whatIsIt:
      'Quanto tempo demora 1 execucao dessa query em media e qual foi o pior pico registrado.',
    whenToAct:
      'Se a media de uma consulta frequente passar de 50 ms.',
    codeFixToAvoidPro:
      'Crie um indice composto no Postgres para as colunas do WHERE/ORDER BY dessa query — a latencia costuma cair de >100ms para <2ms sem gastar nada.',
  },
  col_sql_preview: {
    title: 'Coluna: Consulta SQL Capturada',
    polarity: 'CONTROL_REF',
    polarityLabel: 'MAPA PARA ENCONTRAR A QUERY NO CODIGO FONTE',
    whatIsIt:
      'Trecho real do comando SQL executado. Olhe o nome da tabela apos "FROM" ou "UPDATE" para saber de qual modulo do codigo ela vem.',
    whenToAct:
      'Consultas internas com "pg_catalog" ou "set_config" sao do proprio Supabase/PostgREST; foque nas tabelas do schema public (orders, order_items, customers, logs).',
    codeFixToAvoidPro:
      'Procure pelo nome da tabela dentro de src/services/supabase_modules/ ou src/app/api/ para otimizar a chamada correspondente.',
  },

  // ── ABA 3: ARMAZENAMENTO, TABELAS & INDICES ───────────────────────────────
  storage_kpi_db_size: {
    title: 'Tamanho Fisico Total Postgres',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Teto Plano Free: 500 MB)',
    whatIsIt:
      'Volume exato em disco somando todas as tabelas, indices, schemas internos (auth, storage) e espaco de trabalho do Postgres.',
    whenToAct:
      'Apenas se ultrapassar 325 MB (65% do limite gratuito de 500 MB). Com ~20-50 MB voce tem mais de 90% do banco livre!',
    codeFixToAvoidPro:
      'Manter expurgo periodico de tabelas de log/auditoria/fila evita que o banco chegue a 500 MB mesmo apos anos de operacao.',
  },
  storage_kpi_buckets: {
    title: 'Supabase Storage (Arquivos em Buckets)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Teto Plano Free: 1 GB / 1.024 MB)',
    whatIsIt:
      'Soma do peso de todos os arquivos enviados aos buckets de Storage do Supabase (separado dos 500 MB do banco SQL).',
    whenToAct:
      'Acima de 650 MB (65% de 1 GB).',
    codeFixToAvoidPro:
      'Redimensione imagens no cliente antes de chamar supabase.storage.from(...).upload() e remova arquivos orfaos quando registros forem excluidos.',
  },
  storage_kpi_cache_hit: {
    title: 'Buffer Cache Hit (Tabelas / Indices em RAM)',
    polarity: 'HIGH_IS_GOOD',
    polarityLabel: 'BOM SER ALTO (Ideal: 98% a 100% — quanto mais perto de 100%, melhor!)',
    whatIsIt:
      'Percentual de leituras de dados e de indices que o Postgres encontrou prontas na memoria RAM sem precisar buscar no disco SSD.',
    whenToAct:
      'Se cair abaixo de 97% (significa que o banco esta varrendo tabelas inteiras no disco e ficando lento).',
    codeFixToAvoidPro:
      'Verifique na tabela abaixo quais tabelas grandes estao com "Eficiencia de Indice" baixa e adicione CREATE INDEX nas colunas de busca.',
  },
  storage_kpi_unused_idx: {
    title: 'Indices Secundarios Sem Uso (idx_scan = 0)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO OU ZERO (Menos peso morto em disco)',
    whatIsIt:
      'Quantidade de indices nao-obrigatorios que nunca foram usados em nenhuma busca, mas ocupam espaco em disco e deixam cada INSERT/UPDATE um pouco mais pesado.',
    whenToAct:
      'Apenas se um indice sem uso ocupar varios megabytes em disco apos semanas de uso real em producao.',
    codeFixToAvoidPro:
      'Se confirmado que nenhuma tela filtra por aquela coluna, uma migration simples `DROP INDEX nome_do_indice;` libera disco instantaneamente.',
  },
  col_table_total_size: {
    title: 'Coluna: Tamanho Total da Tabela',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER ENXUTO (Mostra quem mais consome seus 500 MB)',
    whatIsIt:
      'Soma de Dados + Indices + TOAST (textos grandes) dessa tabela especifica, ordenada da maior para a menor.',
    whenToAct:
      'Se uma tabela de logs, auditoria ou fila aparecer nos primeiros lugares ocupando dezenas de MB.',
    codeFixToAvoidPro:
      'Tabelas transacionais temporarias (logs/filas/snapshots) devem sempre ter politica de retencao automatica (DELETE WHERE created_at < NOW() - INTERVAL ...).',
  },
  col_data_vs_index: {
    title: 'Coluna: Peso dos Dados vs Peso dos Indices',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'EQUILIBRIO: INDICES NAO DEVEM SER MUITO MAIORES QUE OS DADOS',
    whatIsIt:
      'Separa quanto do tamanho vem das linhas gravadas (esquerda) e quanto vem das arvores de indices (direita).',
    whenToAct:
      'Em tabelas muito pequenas (KB) e normal o indice pesar parecido com os dados. Preocupe-se apenas se uma tabela grande tiver dezenas de MB de indices sem uso.',
    codeFixToAvoidPro:
      'Evite criar varios indices redundantes na mesma coluna; prefira poucos indices compostos certeiros.',
  },
  col_live_dead_rows: {
    title: 'Coluna: Linhas Vivas / Linhas Mortas (Dead Tuples)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'LINHAS MORTAS: BOM SER BAIXO (Perto de 0)',
    whatIsIt:
      'No Postgres, quando voce faz um UPDATE ou DELETE, a versao antiga da linha nao some na hora — ela vira uma "Linha Morta" ate o Autovacuum reciclar o espaco.',
    whenToAct:
      'Se uma tabela grande acumular milhares de linhas mortas sem o Autovacuum limpar.',
    codeFixToAvoidPro:
      'No codigo, evite dar UPDATE na mesma linha sem necessidade (so salve no banco se algum campo realmente mudou) e encerre transacoes zumbis que bloqueiam o Autovacuum.',
  },
  col_bloat_pct: {
    title: 'Coluna: Bloat % (Taxa de Gordura / Espaco Morto)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Verde < 15% | Atencao >= 15% | Alto >= 30%)',
    whatIsIt:
      'Proporcao de linhas mortas aguardando reciclagem em relacao ao total da tabela. Obs: em tabelas minusculas (ex: 5 linhas), 2 updates ja marcam 28% mas pesam apenas poucos KB (inofensivo).',
    whenToAct:
      'Somente quando o Bloat for >= 25% EM TABELAS GRANDES (acima de 1 MB).',
    codeFixToAvoidPro:
      'Clique em "Atualizar Estatisticas (ANALYZE)" e reduza updates repetitivos de polling/status no codigo.',
  },
  col_idx_efficiency: {
    title: 'Coluna: Eficiencia de Indice (%)',
    polarity: 'HIGH_IS_GOOD',
    polarityLabel: 'BOM SER ALTO EM TABELAS GRANDES (Ideal: 80% a 100%)',
    whatIsIt:
      'Mostra quantos % das buscas nessa tabela usaram Indice rapido em vez de ler a tabela inteira linha por linha (Seq Scan). Obs: em tabelas pequenas (< 100 linhas, como setores ou etapas), o Postgres escolhe Seq Scan de proposito porque ler 10 linhas na memoria e mais rapido que abrir um indice!',
    whenToAct:
      'Apenas se uma tabela GRANDE (> 500 linhas, como orders, order_items, customers, logs) tiver eficiencia baixa (< 50%).',
    codeFixToAvoidPro:
      'Veja por qual coluna o codigo filtra essa tabela (.eq("coluna", ...)) e adicione um CREATE INDEX nessa coluna via migration SQL.',
  },
  col_seq_vs_idx_scan: {
    title: 'Coluna: Seq Scan (Varredura Total) / Idx Scan (Busca por Indice)',
    polarity: 'DUAL',
    polarityLabel: 'TABELAS GRANDES: SEQ SCAN BAIXO E IDX SCAN ALTO',
    whatIsIt:
      'Esquerda: quantas vezes o Postgres leu a tabela de ponta a ponta (Seq Scan). Direita: quantas vezes foi direto ao registro via indice (Idx Scan).',
    whenToAct:
      'Se Seq Scan subir milhares de vezes por hora numa tabela com milhares de linhas.',
    codeFixToAvoidPro:
      'Evite filtros com `ilike "%termo%"` sem indice trigram (pg_trgm) em tabelas gigantes ou buscas sem clausula WHERE.',
  },
  col_table_churn: {
    title: 'Coluna: Churn (+Inserts / ~Updates / -Deletes)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'UPDATES EXCESSIVOS: BOM SER BAIXO (Evita desgaste de disco/bloat)',
    whatIsIt:
      'Volume acumulado de insercoes (+), atualizacoes (~) e exclusoes (-) sofridas pela tabela.',
    whenToAct:
      'Se notar dezenas de milhares de ~Updates numa tabela que quase nao muda na pratica.',
    codeFixToAvoidPro:
      'No codigo de sincronizacao (Conta Azul), faça upsert/update somente quando o hash ou os campos do pedido tiverem mudado de fato.',
  },
  col_last_autovacuum: {
    title: 'Coluna: Ultimo Autovacuum / Autoanalyze',
    polarity: 'CONTROL_REF',
    polarityLabel: 'INFORMATIVO (Faxina automatica interna do Postgres)',
    whatIsIt:
      'Data em que o robo interno do Postgres reciclou linhas mortas nessa tabela. Se aparecer "Pendente", significa apenas que a tabela ainda teve poucas alteracoes e nao precisou de faxina.',
    whenToAct:
      'Apenas se a tabela tiver milhares de linhas mortas e o Autovacuum nao rodar por dias (geralmente causado por transacao zumbi travada).',
    codeFixToAvoidPro:
      'Use o botao "Atualizar Estatisticas (ANALYZE)" para calibrar o otimizador SQL imediatamente apos grandes limpezas ou importacoes.',
  },
  section_unused_indexes: {
    title: 'Indices Secundarios Sem Leituras (idx_scan = 0)',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER ZERO OU POUCOS KB',
    whatIsIt:
      'Lista indices opcionais que ocupam disco mas ainda tiveram 0 buscas registradas.',
    whenToAct:
      'Somente se o "Tamanho Ocupado" for relevante (varios MB) e o sistema ja estiver rodando ha semanas com todos os fluxos em uso.',
    codeFixToAvoidPro:
      'Remover indices mortos via SQL (`DROP INDEX`) economiza espaco nos 500 MB do Plano Free sem perder nenhuma funcionalidade.',
  },

  // ── ABA 4: CONTA AZUL, CRONS & FILAS ──────────────────────────────────────
  section_ca_oauth: {
    title: 'Credenciais OAuth2 & Validador do Gateway Conta Azul',
    polarity: 'CONTROL_REF',
    polarityLabel: 'IDEAL: SECRET OK + REFRESH OK + ACCESS TOKEN VALIDO',
    whatIsIt:
      'Mostra a saude das chaves salvas para conversar com a API v2 da Conta Azul e permite testar ao vivo se o par client_id / client_secret esta aceito pelo servidor oficial.',
    whenToAct:
      'Se aparecer "Sem Refresh" ou se uma sincronizacao falhar com erro 401/400 de autenticacao. Nota: o Access Token dura 60 min; se expirar enquanto o sistema esta ocioso, ele renova sozinho na proxima chamada.',
    codeFixToAvoidPro:
      'Manter a renovacao de token sob demanda (lazy refresh) em vez de renovar a cada minuto economiza requisicoes serverless e escritas no banco.',
  },
  section_circuit_breaker: {
    title: 'Circuit Breaker (Disjuntor Automatico) & Trava de 12 Minutos',
    polarity: 'CONTROL_REF',
    polarityLabel: 'NORMAL: OPERACIONAL (FECHADO) | FALHAS: 0 / 3',
    whatIsIt:
      'Dupla protecao criada no codigo para nao gastar sua cota Free: 1) Se o OAuth do Conta Azul falhar 3 vezes seguidas, o Disjuntor ABRE e pausa novos crons automaticos; 2) Se 2 agendadores dispararem juntos em menos de 12 min, a trava barra a duplicata.',
    whenToAct:
      'Se o status mudar para "PAUSADO (ABERTO)" — significa que o disjuntor salvou sua cota e aguarda voce reconectar o Conta Azul.',
    codeFixToAvoidPro:
      'Apos reconectar o Conta Azul em /configuracoes, clique em "Reiniciar Circuit Breaker & Contador" para retomar a sincronizacao limpa.',
  },
  cb_dup_blocked: {
    title: 'Crons Duplicados Bloqueados pela Trava de 12 min',
    polarity: 'ZERO_IS_BEST',
    polarityLabel: 'IDEAL: 0 (Se > 0, a trava economizou sua cota!)',
    whatIsIt:
      'Conta quantas vezes um segundo agendador tentou rodar /api/sync/cron logo apos outro ja ter acabado de sincronizar.',
    whenToAct:
      'Se este numero subir todo dia, voce tem dois crons ativos ao mesmo tempo (ex: Vercel Cron + GitHub Actions).',
    codeFixToAvoidPro:
      'Desative o agendamento duplicado em um dos dois lugares (vercel.json ou .github/workflows/sync-cron.yml) para economizar invocacoes na Vercel.',
  },
  cb_oauth_failures: {
    title: 'Falhas OAuth Consecutivas (Gatilho do Disjuntor)',
    polarity: 'ZERO_IS_BEST',
    polarityLabel: 'BOM SER ZERO (0 / 3)',
    whatIsIt:
      'Contador de erros seguidos de autenticacao na Conta Azul. Ao bater 3/3, o sistema abre o Circuit Breaker automaticamente para estancar o loop de erros.',
    whenToAct:
      'Se sair de 0/3, verifique na aba ou em /configuracoes se a conta conectada na Conta Azul esta ativa.',
    codeFixToAvoidPro:
      'Qualquer sincronizacao bem-sucedida zera automaticamente este contador no codigo.',
  },
  section_sync_queue: {
    title: 'Fila Outbox de Sincronizacao Reversa (sync_queue)',
    polarity: 'ZERO_IS_BEST',
    polarityLabel: 'TRAVADOS (>15m) E FALHAS: BOM SER ZERO (0)',
    whatIsIt:
      'Fila de operacoes assincronas. "Travados >15m" indica um worker que caiu no meio; "Falhas" indica erro permanente; "Concluidos" e apenas historico passado.',
    whenToAct:
      'Se "Travados >15m" > 0, se "Falhas" > 0 ou se "Concluidos" passar de 500 registros acumulados.',
    codeFixToAvoidPro:
      'Use os botoes ao lado para destravar ou limpar historico concluido (>48h), mantendo a tabela minúscula e rapida no Plano Free.',
  },
  section_grouped_errors: {
    title: 'Erros Agrupados em conta_azul_integration_logs',
    polarity: 'ZERO_IS_BEST',
    polarityLabel: 'BOM SER ZERO (0 erros ativos)',
    whatIsIt:
      'Agrupa mensagens de erro identicas para voce bater o olho e saber qual operacao falhou e quantas vezes se repetiu, junto com o peso total da tabela em KB/MB.',
    whenToAct:
      'Se aparecerem erros recentes (hoje) ou se o tamanho da tabela de logs passar de 1,5 MB.',
    codeFixToAvoidPro:
      'Corrija a causa raiz apontada no resumo do erro e clique em "Limpar > 48h" para nao desperdiçar espaco dos 500 MB gratuitos com logs velhos.',
  },
  section_cron_audit: {
    title: 'Auditoria de Disparos de Cron (/api/sync/cron)',
    polarity: 'CONTROL_REF',
    polarityLabel: 'SAUDAVEL: "EXECUTED" A CADA ~15 MIN SEM FLOOD',
    whatIsIt:
      'Historico das ultimas 30 chamadas recebidas pela rota automatica de sincronizacao, mostrando quem chamou (GitHub Actions, Vercel Cron, Manual) e o desfecho.',
    whenToAct:
      'Se houver disparos a cada poucos segundos ou sequencia de status FAILED.',
    codeFixToAvoidPro:
      'Mantenha o intervalo de 15 minutos no agendador e a variavel CRON_SECRET ativa para bloquear chamadas externas nao autorizadas.',
  },

  // ── ABA 5: SEGURANCA, SESSOES & INTEGRIDADE ───────────────────────────────
  gov_pat_validity: {
    title: 'Validade do Personal Access Token (PAT) Supabase',
    polarity: 'HIGH_IS_GOOD',
    polarityLabel: 'DIAS RESTANTES: BOM SER ALTO (Renovar abaixo de 30 dias)',
    whatIsIt:
      'Contagem regressiva ate 04/01/2027 para expiracao do token administrativo usado nas ferramentas de manutencao/MCP do projeto Supabase.',
    whenToAct:
      'Quando faltar menos de 30 dias para 04/01/2027 (a badge ficara amarela automaticamente aos 45 dias).',
    codeFixToAvoidPro:
      'Gerar um novo PAT no painel da conta Supabase e totalmente gratuito e leva 1 minuto.',
  },
  gov_supabase_access_token: {
    title: 'Variavel SUPABASE_ACCESS_TOKEN (Management API v1 Server-Only)',
    polarity: 'CONTROL_REF',
    polarityLabel: 'IDEAL: "Configurada" NA VERCEL (NUNCA NEXT_PUBLIC_)',
    whatIsIt:
      'Permite que o backend de /api/admin/monitoring consulte diretamente https://api.supabase.com/v1 para descobrir seu Plano Real (Pro vs Free), Compute, Add-ons pagos, Requisicoes do API Gateway (24h) e a vaga no limite de 2 projetos Free ativos.',
    whenToAct:
      'Se aparecer "Nao definida", cadastre SUPABASE_ACCESS_TOKEN com o valor do seu PAT (sbp_...) em Vercel -> Project Settings -> Environment Variables (Production) e faca Redeploy ou novo push.',
    codeFixToAvoidPro:
      'Nunca adicione prefixo NEXT_PUBLIC_ nesta chave. Ela roda 100% blindada no servidor com cache de 10 minutos.',
  },
  gov_rls_exposed: {
    title: 'Tabelas Publicas sem Row Level Security (RLS)',
    polarity: 'ZERO_IS_BEST',
    polarityLabel: 'OBRIGATORIAMENTE ZERO (0 expostas)',
    whatIsIt:
      'Audita no catalogo do Postgres se alguma tabela criada em `public` esquecida sem blindagem RLS (o que permitiria leitura/escrita indevida via API publica anon/authenticated).',
    whenToAct:
      'IMEDIATAMENTE se este numero for diferente de 0!',
    codeFixToAvoidPro:
      'Rode no SQL: `ALTER TABLE public.nome_da_tabela ENABLE ROW LEVEL SECURITY;` e defina as politicas de acesso.',
  },
  gov_cron_secret: {
    title: 'Protecao CRON_SECRET na Rota Automatica',
    polarity: 'CONTROL_REF',
    polarityLabel: 'IDEAL: "Configurada" EM PRODUCAO (VERCEL)',
    whatIsIt:
      'Senha secreta verificada no cabecalho Authorization de /api/sync/cron para garantir que somente o seu agendador oficial dispare sincronizacoes.',
    whenToAct:
      'Se aparecer "Nao definida" quando estiver acessando pelo dominio oficial portalsamppel.vercel.app (em localhost e comum nao estar no .env.local).',
    codeFixToAvoidPro:
      'Cadastrar CRON_SECRET nas Environment Variables da Vercel (gratuito) evita que bots acionem sua rota e gastem cota serverless.',
  },
  gov_refresh_tokens: {
    title: 'Tamanho da Tabela Interna auth.refresh_tokens',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER BAIXO (Poucos KB ou menos de 5 MB)',
    whatIsIt:
      'Tabela interna do Supabase Auth que guarda tokens de renovacao de login dos usuarios. Conta dentro dos mesmos 500 MB do seu banco Free!',
    whenToAct:
      'Se crescer para dezenas de milhares de linhas ou passar de 15 MB numa equipe pequena.',
    codeFixToAvoidPro:
      'Se inflar no futuro, significa que algum script/teste esta chamando `signInWithPassword` em loop sem reaproveitar a sessao salva.',
  },
  gov_active_sessions: {
    title: 'Sessoes Ativas no Supabase Auth & Conexoes por Role',
    polarity: 'LOW_IS_GOOD',
    polarityLabel: 'BOM SER PROPORCIONAL A EQUIPE LOGADA',
    whatIsIt:
      'Mostra quantos navegadores/dispositivos possuem sessao valida aberta e como o pool de conexoes do banco esta dividido entre PostgREST (`authenticator`), Auth e Admin.',
    whenToAct:
      'Apenas se o numero de conexoes na tabela abaixo se aproximar de 50+ conexoes simultaneas.',
    codeFixToAvoidPro:
      'Evite criar multiplos clientes `createClient()` dentro de componentes React; importe sempre a instancia unica de `src/services/supabaseClient.ts`.',
  },
  section_business_sanity: {
    title: 'Sanity Checks de Integridade Operacional',
    polarity: 'ZERO_IS_BEST',
    polarityLabel: 'ANOMALIAS (5 LINHAS FINAIS): BOM SER TUDO ZERO (0)',
    whatIsIt:
      'Audita automaticamente erros silenciosos de regra de negocio: pedidos sem nenhum item, itens perdidos sem coluna no Kanban, creditos de estoque negativos, pedidos sem cliente ou CNPJs duplicados.',
    whenToAct:
      'Sempre que qualquer um dos 5 indicadores de anomalia sair de 0.',
    codeFixToAvoidPro:
      'Corrigir falhas de integridade com constraints UNIQUE/CHECK no banco e validacao previa na API evita bugs em cascata e retrabalho.',
  },

  // ── ABA 6: MANUTENCAO & PLAYBOOKS EM 1 CLIQUE ─────────────────────────────
  section_playbooks: {
    title: 'Playbooks de Limpeza e Otimizacao (Ficar no Free Sem Esforco)',
    polarity: 'CONTROL_REF',
    polarityLabel: 'USO SOB DEMANDA QUANDO UM ALERTA RECOMENDAR',
    whatIsIt:
      'Comandos cirurgicos no banco de dados prontos para liberar megabytes de disco, destravar filas, encerrar conexoes presas e recalibrar indices em 1 clique — sem precisar abrir terminal SQL.',
    whenToAct:
      'Voce NAO precisa clicar neles todos os dias! Use apenas quando o Radar Anti-Upgrade Pro ou um Diagnostico Preventivo recomendar, ou apos resolver um incidente.',
    codeFixToAvoidPro:
      'A janela recomendada de "Manter ultimas 48 horas" preserva todo o historico recente para auditoria enquanto mantem o banco enxuto abaixo de 50 MB.',
  },
  retention_window: {
    title: 'Janela de Retencao para Limpezas',
    polarity: 'CONTROL_REF',
    polarityLabel: 'RECOMENDADO: 48 HORAS OU 7 DIAS',
    whatIsIt:
      'Define quantas horas recentes de logs/filas serao preservadas ao rodar os botoes de limpeza abaixo. Tudo que for mais velho que essa janela sera apagado para liberar disco.',
    whenToAct:
      'Escolha 24h ou 48h se quiser liberar o maximo de espaco em disco nos 500 MB do Plano Free.',
    codeFixToAvoidPro:
      'Nenhum pedido, cliente, produto ou lancamento financeiro jamais e tocado por essas limpezas — apenas tabelas tecnicas de log e fila.',
  },
} as const satisfies Record<string, MetricGuide>;

export type MetricGuideKey = keyof typeof METRIC_GUIDES;

