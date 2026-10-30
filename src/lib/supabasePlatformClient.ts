/**
 * Cliente Server-Only para APIs Oficiais da Plataforma Supabase (MOD-16):
 * 1) Supabase Management API v1 (https://api.supabase.com/v1) via SUPABASE_ACCESS_TOKEN (PAT)
 * 2) Supabase Prometheus Metrics API (/v1/projects/{ref}/analytics/endpoints/metrics
 *    com fallback para https://{ref}.supabase.co/customer/v1/privileged/metrics)
 *
 * Seguranca e Economia:
 * - Executado exclusivamente no servidor (nunca importado em componentes client).
 * - Cache em memoria de 10 minutos (600s) para zero auto-consumo e zero rate-limit (HTTP 429).
 * - Timeout estrito de 4.5s por requisicao e degradacao elegante caso SUPABASE_ACCESS_TOKEN
 *   ainda nao esteja configurada nas variaveis de ambiente da Vercel.
 */

const PLATFORM_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const FETCH_TIMEOUT_MS = 4500;

export interface NormalizedBillingAddon {
  type: string;
  identifier: string;
  name: string;
  priceDescription: string;
  isCompute: boolean;
  isExtraPaidOrBlocksFree: boolean;
}

export interface FreeOrgProjectSummary {
  orgId: string;
  orgName: string;
  projectRef: string;
  projectName: string;
  region: string;
  status: string;
  isActive: boolean;
}

export interface ApiGatewayUsageCounts {
  available: boolean;
  windowLabel: string;
  restRequests: number;
  authRequests: number;
  storageRequests: number;
  realtimeRequests: number;
  totalRequests: number;
  bucketsCount: number;
}

export interface VmPrometheusMetrics {
  available: boolean;
  source: 'management_api' | 'privileged_customer_endpoint' | 'unavailable';
  reason?: string;
  ramTotalBytes: number | null;
  ramAvailableBytes: number | null;
  ramUsedBytes: number | null;
  ramUsedPct: number | null;
  diskTotalBytes: number | null;
  diskAvailBytes: number | null;
  diskUsedBytes: number | null;
  diskUsedPct: number | null;
  networkTxBytesTotal: number | null;
  networkRxBytesTotal: number | null;
}

export interface SupabasePlatformSnapshot {
  collectedAt: string;
  cached: boolean;
  cacheAgeSec: number;
  managementApi: {
    configured: boolean;
    reachable: boolean;
    reason?: string;
    organizationId: string | null;
    organizationName: string | null;
    detectedPlan: 'free' | 'pro' | 'team' | 'enterprise' | 'unknown';
    projectName: string | null;
    projectStatus: string | null;
    postgresEngineVersion: string | null;
    computeSizeLabel: string | null;
    computeIdentifier: string | null;
    selectedAddons: NormalizedBillingAddon[];
    extraPaidOrBlockingAddonsCount: number;
    activeProjectsInCurrentOrg: number;
    totalProjectsInCurrentOrg: number;
    otherFreeOrgsActiveProjectsCount: number;
    allFreeOrgsActiveProjectsCount: number;
    freeOrgProjects: FreeOrgProjectSummary[];
    apiGatewayUsage: ApiGatewayUsageCounts;
  };
  vmMetrics: VmPrometheusMetrics;
}

let platformCache: { timestamp: number; snapshot: SupabasePlatformSnapshot } | null = null;

async function fetchJsonWithTimeout(
  url: string,
  headers: Record<string, string>
): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const text = await res.text();
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

async function fetchTextWithTimeout(
  url: string,
  headers: Record<string, string>
): Promise<{ ok: boolean; status: number; text: string }> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const text = res.ok ? await res.text() : '';
    return { ok: res.ok, status: res.status, text };
  } catch {
    return { ok: false, status: 0, text: '' };
  }
}

function normalizePlan(rawPlan: unknown): 'free' | 'pro' | 'team' | 'enterprise' | 'unknown' {
  const p = String(rawPlan || '')
    .trim()
    .toLowerCase();
  if (p === 'free') return 'free';
  if (p === 'pro') return 'pro';
  if (p === 'team') return 'team';
  if (p === 'enterprise') return 'enterprise';
  return 'unknown';
}

function isProjectActiveStatus(status: unknown): boolean {
  const s = String(status || '')
    .trim()
    .toUpperCase();
  if (!s) return false;
  return !s.includes('INACTIVE') && !s.includes('PAUSED') && !s.includes('REMOVED');
}

function parseAddonsPayload(raw: any): {
  computeSizeLabel: string | null;
  computeIdentifier: string | null;
  selectedAddons: NormalizedBillingAddon[];
  extraPaidOrBlockingAddonsCount: number;
} {
  const rawSelected = Array.isArray(raw?.selected_addons) ? raw.selected_addons : [];
  const selectedAddons: NormalizedBillingAddon[] = [];
  let computeSizeLabel: string | null = null;
  let computeIdentifier: string | null = null;

  for (const item of rawSelected) {
    const type = String(item?.type || 'addon');
    const variant = item?.variant || {};
    const identifier = String(variant?.identifier || item?.identifier || '');
    const name = String(variant?.name || item?.name || type);
    const priceNum =
      typeof variant?.price === 'number' ? variant.price : Number(variant?.price ?? NaN);
    const priceDescRaw = String(variant?.price_description || variant?.price_interval || '').trim();
    const priceDescription = Number.isFinite(priceNum)
      ? `US$ ${priceNum}${priceDescRaw ? ` (${priceDescRaw})` : ''}`
      : priceDescRaw || 'Incluso / Padrao';

    const isCompute =
      type.toLowerCase().includes('compute') || identifier.toLowerCase().startsWith('ci_');

    if (isCompute) {
      computeSizeLabel = name;
      computeIdentifier = identifier || null;
    }

    // No Pro, Micro (ci_micro) e coberto pelos US$ 10 de Compute Credits e reverte automaticamente no downgrade.
    // Qualquer compute maior que Micro (Small, Medium, Large...) ou qualquer add-on extra (Custom Domain, PITR, IPv4, Read Replica)
    // gera cobranca fora do Spend Cap ou exige remocao antes do downgrade para o Free.
    const idLower = identifier.toLowerCase();
    const isDefaultMicroOrNano =
      isCompute &&
      (idLower === 'ci_micro' ||
        idLower === 'ci_nano' ||
        name.toLowerCase().includes('micro') ||
        name.toLowerCase().includes('nano'));

    const isExtraPaidOrBlocksFree = !isDefaultMicroOrNano;

    selectedAddons.push({
      type,
      identifier,
      name,
      priceDescription,
      isCompute,
      isExtraPaidOrBlocksFree,
    });
  }

  const extraPaidOrBlockingAddonsCount = selectedAddons.filter(
    (a) => a.isExtraPaidOrBlocksFree
  ).length;

  return {
    computeSizeLabel,
    computeIdentifier,
    selectedAddons,
    extraPaidOrBlockingAddonsCount,
  };
}

function parseApiGatewayCounts(countsData: any, totalReqData: any): ApiGatewayUsageCounts {
  const rows: any[] = Array.isArray(countsData?.result)
    ? countsData.result
    : Array.isArray(countsData)
    ? countsData
    : [];

  let restRequests = 0;
  let authRequests = 0;
  let storageRequests = 0;
  let realtimeRequests = 0;

  for (const r of rows) {
    restRequests += Number(r?.total_rest_requests ?? r?.rest_requests ?? 0) || 0;
    authRequests += Number(r?.total_auth_requests ?? r?.auth_requests ?? 0) || 0;
    storageRequests += Number(r?.total_storage_requests ?? r?.storage_requests ?? 0) || 0;
    realtimeRequests += Number(r?.total_realtime_requests ?? r?.realtime_requests ?? 0) || 0;
  }

  const sumByService = restRequests + authRequests + storageRequests + realtimeRequests;

  let fallbackTotal = 0;
  if (Array.isArray(totalReqData?.result) && totalReqData.result.length > 0) {
    fallbackTotal = Number(totalReqData.result[0]?.count ?? totalReqData.result[0]?.total ?? 0) || 0;
  } else if (typeof totalReqData?.count === 'number') {
    fallbackTotal = totalReqData.count;
  }

  const totalRequests = sumByService > 0 ? sumByService : fallbackTotal;
  const available = rows.length > 0 || fallbackTotal > 0;

  return {
    available,
    windowLabel: 'Ultimas 24h (API Gateway)',
    restRequests,
    authRequests,
    storageRequests,
    realtimeRequests,
    totalRequests,
    bucketsCount: rows.length,
  };
}

function parsePrometheusExposition(
  text: string,
  source: 'management_api' | 'privileged_customer_endpoint'
): VmPrometheusMetrics {
  if (!text || !text.includes('node_')) {
    return {
      available: false,
      source: 'unavailable',
      reason: 'Formato Prometheus vazio ou indisponivel.',
      ramTotalBytes: null,
      ramAvailableBytes: null,
      ramUsedBytes: null,
      ramUsedPct: null,
      diskTotalBytes: null,
      diskAvailBytes: null,
      diskUsedBytes: null,
      diskUsedPct: null,
      networkTxBytesTotal: null,
      networkRxBytesTotal: null,
    };
  }

  let ramTotal: number | null = null;
  let ramAvail: number | null = null;
  let netTxTotal = 0;
  let hasNetTx = false;
  let netRxTotal = 0;
  let hasNetRx = false;

  const fsSizes = new Map<string, number>();
  const fsAvails = new Map<string, number>();

  const lines = text.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('node_memory_MemTotal_bytes')) {
      const val = Number(line.split(/\s+/).pop());
      if (Number.isFinite(val) && val > 0) ramTotal = val;
    } else if (line.startsWith('node_memory_MemAvailable_bytes')) {
      const val = Number(line.split(/\s+/).pop());
      if (Number.isFinite(val) && val >= 0) ramAvail = val;
    } else if (line.startsWith('node_network_transmit_bytes_total')) {
      if (!line.includes('device="lo"')) {
        const val = Number(line.split(/\s+/).pop());
        if (Number.isFinite(val) && val >= 0) {
          netTxTotal += val;
          hasNetTx = true;
        }
      }
    } else if (line.startsWith('node_network_receive_bytes_total')) {
      if (!line.includes('device="lo"')) {
        const val = Number(line.split(/\s+/).pop());
        if (Number.isFinite(val) && val >= 0) {
          netRxTotal += val;
          hasNetRx = true;
        }
      }
    } else if (line.startsWith('node_filesystem_size_bytes')) {
      if (!line.includes('fstype="tmpfs"') && !line.includes('fstype="overlay"')) {
        const mpMatch = line.match(/mountpoint="([^"]+)"/);
        const mp = mpMatch ? mpMatch[1] : 'default';
        const val = Number(line.split(/\s+/).pop());
        if (Number.isFinite(val) && val > 0) {
          fsSizes.set(mp, val);
        }
      }
    } else if (line.startsWith('node_filesystem_avail_bytes')) {
      if (!line.includes('fstype="tmpfs"') && !line.includes('fstype="overlay"')) {
        const mpMatch = line.match(/mountpoint="([^"]+)"/);
        const mp = mpMatch ? mpMatch[1] : 'default';
        const val = Number(line.split(/\s+/).pop());
        if (Number.isFinite(val) && val >= 0) {
          fsAvails.set(mp, val);
        }
      }
    }
  }

  // Prioriza o volume dedicado de dados (/data) da instancia Postgres na Supabase
  let chosenMount: string | null = null;
  if (fsSizes.has('/data')) {
    chosenMount = '/data';
  } else {
    let maxBytes = 0;
    for (const [mp, size] of fsSizes.entries()) {
      if (size > maxBytes) {
        maxBytes = size;
        chosenMount = mp;
      }
    }
  }

  const diskTotalBytes = chosenMount ? fsSizes.get(chosenMount) ?? null : null;
  const diskAvailBytes =
    chosenMount && fsAvails.has(chosenMount) ? fsAvails.get(chosenMount) ?? null : null;
  const diskUsedBytes =
    diskTotalBytes !== null && diskAvailBytes !== null
      ? Math.max(0, diskTotalBytes - diskAvailBytes)
      : null;
  const diskUsedPct =
    diskTotalBytes && diskUsedBytes !== null
      ? Math.round((diskUsedBytes / diskTotalBytes) * 1000) / 10
      : null;

  const ramUsedBytes =
    ramTotal !== null && ramAvail !== null ? Math.max(0, ramTotal - ramAvail) : null;
  const ramUsedPct =
    ramTotal && ramUsedBytes !== null ? Math.round((ramUsedBytes / ramTotal) * 1000) / 10 : null;

  return {
    available:
      ramTotal !== null || diskTotalBytes !== null || hasNetTx || hasNetRx,
    source,
    ramTotalBytes: ramTotal,
    ramAvailableBytes: ramAvail,
    ramUsedBytes,
    ramUsedPct,
    diskTotalBytes,
    diskAvailBytes,
    diskUsedBytes,
    diskUsedPct,
    networkTxBytesTotal: hasNetTx ? netTxTotal : null,
    networkRxBytesTotal: hasNetRx ? netRxTotal : null,
  };
}

export async function fetchSupabasePlatformSnapshot(options: {
  projectRef: string;
  force?: boolean;
}): Promise<SupabasePlatformSnapshot> {
  const { projectRef, force = false } = options;

  if (
    !force &&
    platformCache &&
    Date.now() - platformCache.timestamp < PLATFORM_CACHE_TTL_MS
  ) {
    return {
      ...platformCache.snapshot,
      cached: true,
      cacheAgeSec: Math.round((Date.now() - platformCache.timestamp) / 1000),
    };
  }

  const pat = (process.env.SUPABASE_ACCESS_TOKEN || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  // 1. Coleta da Management API v1 (se SUPABASE_ACCESS_TOKEN estiver presente)
  let managementApi: SupabasePlatformSnapshot['managementApi'] = {
    configured: Boolean(pat),
    reachable: false,
    reason: pat
      ? undefined
      : 'Variavel SUPABASE_ACCESS_TOKEN nao configurada no ambiente do servidor.',
    organizationId: null,
    organizationName: null,
    detectedPlan: 'unknown',
    projectName: null,
    projectStatus: null,
    postgresEngineVersion: null,
    computeSizeLabel: null,
    computeIdentifier: null,
    selectedAddons: [],
    extraPaidOrBlockingAddonsCount: 0,
    activeProjectsInCurrentOrg: 0,
    totalProjectsInCurrentOrg: 0,
    otherFreeOrgsActiveProjectsCount: 0,
    allFreeOrgsActiveProjectsCount: 0,
    freeOrgProjects: [],
    apiGatewayUsage: {
      available: false,
      windowLabel: 'Ultimas 24h (API Gateway)',
      restRequests: 0,
      authRequests: 0,
      storageRequests: 0,
      realtimeRequests: 0,
      totalRequests: 0,
      bucketsCount: 0,
    },
  };

  if (pat) {
    const authHeaders = {
      Authorization: `Bearer ${pat}`,
      Accept: 'application/json',
    };

    const [projRes, orgsRes, allProjectsRes, addonsRes, apiCountsRes, apiReqTotalRes] =
      await Promise.all([
        fetchJsonWithTimeout(`https://api.supabase.com/v1/projects/${projectRef}`, authHeaders),
        fetchJsonWithTimeout('https://api.supabase.com/v1/organizations', authHeaders),
        fetchJsonWithTimeout('https://api.supabase.com/v1/projects', authHeaders),
        fetchJsonWithTimeout(
          `https://api.supabase.com/v1/projects/${projectRef}/billing/addons`,
          authHeaders
        ),
        fetchJsonWithTimeout(
          `https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/usage.api-counts?interval=1day`,
          authHeaders
        ),
        fetchJsonWithTimeout(
          `https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/usage.api-requests-count`,
          authHeaders
        ),
      ]);

    if (!projRes.ok && !orgsRes.ok) {
      managementApi.reachable = false;
      managementApi.reason =
        projRes.status === 401 || orgsRes.status === 401
          ? 'SUPABASE_ACCESS_TOKEN rejeitado (HTTP 401). Verifique se o PAT esta valido.'
          : `Management API temporariamente indisponivel (HTTP ${projRes.status || orgsRes.status || 0}).`;
    } else {
      managementApi.reachable = true;

      const projectData = projRes.ok ? projRes.data : null;
      const currentOrgSlug = String(
        projectData?.organization_slug || projectData?.organization_id || ''
      ).trim();

      managementApi.organizationId = currentOrgSlug || null;
      managementApi.projectName = projectData?.name ? String(projectData.name) : null;
      managementApi.projectStatus = projectData?.status ? String(projectData.status) : null;
      managementApi.postgresEngineVersion = projectData?.database?.version
        ? String(projectData.database.version)
        : null;

      // Busca detalhes de cada organizacao (ate 8 orgs) para obter o campo `plan` exato ('free' | 'pro' | ...)
      const orgList: any[] = Array.isArray(orgsRes.data) ? orgsRes.data : [];
      const orgSlugsToInspect = Array.from(
        new Set(
          [
            currentOrgSlug,
            ...orgList.map((o) => String(o?.slug || o?.id || '').trim()),
          ].filter(Boolean)
        )
      ).slice(0, 8);

      const orgDetailResponses = await Promise.all(
        orgSlugsToInspect.map(async (slug) => {
          const detail = await fetchJsonWithTimeout(
            `https://api.supabase.com/v1/organizations/${encodeURIComponent(slug)}`,
            authHeaders
          );
          return { slug, ok: detail.ok, data: detail.data };
        })
      );

      const orgMap = new Map<
        string,
        { id: string; name: string; plan: 'free' | 'pro' | 'team' | 'enterprise' | 'unknown' }
      >();

      for (const o of orgList) {
        const slug = String(o?.slug || o?.id || '').trim();
        if (slug) {
          orgMap.set(slug, {
            id: slug,
            name: String(o?.name || slug),
            plan: normalizePlan(o?.plan),
          });
        }
      }

      for (const det of orgDetailResponses) {
        if (det.ok && det.data) {
          orgMap.set(det.slug, {
            id: det.slug,
            name: String(det.data?.name || orgMap.get(det.slug)?.name || det.slug),
            plan: normalizePlan(det.data?.plan),
          });
        }
      }

      if (currentOrgSlug && orgMap.has(currentOrgSlug)) {
        const currOrg = orgMap.get(currentOrgSlug)!;
        managementApi.organizationName = currOrg.name;
        managementApi.detectedPlan = currOrg.plan;
      }

      // Cruza todos os projetos da conta com o plano de cada organizacao
      const allProjects: any[] = Array.isArray(allProjectsRes.data) ? allProjectsRes.data : [];
      let activeInCurrOrg = 0;
      let totalInCurrOrg = 0;
      let otherFreeActiveCount = 0;
      let allFreeActiveCount = 0;
      const freeOrgProjects: FreeOrgProjectSummary[] = [];

      for (const p of allProjects) {
        const pOrgId = String(p?.organization_slug || p?.organization_id || '').trim();
        const pRef = String(p?.ref || p?.id || '').trim();
        const pName = String(p?.name || pRef);
        const pStatus = String(p?.status || 'UNKNOWN');
        const pRegion = String(p?.region || '');
        const isActive = isProjectActiveStatus(pStatus);

        if (currentOrgSlug && pOrgId === currentOrgSlug) {
          totalInCurrOrg++;
          if (isActive) activeInCurrOrg++;
        }

        const orgInfo = orgMap.get(pOrgId);
        if (orgInfo?.plan === 'free') {
          if (isActive) {
            allFreeActiveCount++;
            if (!currentOrgSlug || pOrgId !== currentOrgSlug) {
              otherFreeActiveCount++;
            }
          }
          freeOrgProjects.push({
            orgId: pOrgId,
            orgName: orgInfo.name,
            projectRef: pRef,
            projectName: pName,
            region: pRegion,
            status: pStatus,
            isActive,
          });
        }
      }

      // Ordena ativos primeiro
      freeOrgProjects.sort((a, b) => Number(b.isActive) - Number(a.isActive));

      managementApi.activeProjectsInCurrentOrg = activeInCurrOrg || 1;
      managementApi.totalProjectsInCurrentOrg = totalInCurrOrg || 1;
      managementApi.otherFreeOrgsActiveProjectsCount = otherFreeActiveCount;
      managementApi.allFreeOrgsActiveProjectsCount = allFreeActiveCount;
      managementApi.freeOrgProjects = freeOrgProjects;

      if (addonsRes.ok && addonsRes.data) {
        const parsedAddons = parseAddonsPayload(addonsRes.data);
        managementApi.computeSizeLabel = parsedAddons.computeSizeLabel;
        managementApi.computeIdentifier = parsedAddons.computeIdentifier;
        managementApi.selectedAddons = parsedAddons.selectedAddons;
        managementApi.extraPaidOrBlockingAddonsCount =
          parsedAddons.extraPaidOrBlockingAddonsCount;
      }

      if (apiCountsRes.ok || apiReqTotalRes.ok) {
        managementApi.apiGatewayUsage = parseApiGatewayCounts(
          apiCountsRes.data,
          apiReqTotalRes.data
        );
      }
    }
  }

  // 2. Coleta Prometheus Metrics API (Tenta via PAT primeiro, com fallback automatico para service_role)
  let vmMetrics: VmPrometheusMetrics = {
    available: false,
    source: 'unavailable',
    reason: 'Nenhuma credencial compativel para scrape de metricas da VM.',
    ramTotalBytes: null,
    ramAvailableBytes: null,
    ramUsedBytes: null,
    ramUsedPct: null,
    diskTotalBytes: null,
    diskAvailBytes: null,
    diskUsedBytes: null,
    diskUsedPct: null,
    networkTxBytesTotal: null,
    networkRxBytesTotal: null,
  };

  if (pat) {
    const promMgmt = await fetchTextWithTimeout(
      `https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/metrics`,
      {
        Authorization: `Bearer ${pat}`,
        Accept: 'text/plain',
      }
    );
    if (promMgmt.ok && promMgmt.text) {
      vmMetrics = parsePrometheusExposition(promMgmt.text, 'management_api');
    }
  }

  if (!vmMetrics.available && serviceRoleKey) {
    const basicToken = Buffer.from(`service_role:${serviceRoleKey}`).toString('base64');
    const promPriv = await fetchTextWithTimeout(
      `https://${projectRef}.supabase.co/customer/v1/privileged/metrics`,
      {
        Authorization: `Basic ${basicToken}`,
        Accept: 'text/plain',
      }
    );
    if (promPriv.ok && promPriv.text) {
      vmMetrics = parsePrometheusExposition(promPriv.text, 'privileged_customer_endpoint');
    } else if (!pat) {
      vmMetrics.reason =
        promPriv.status === 401 || promPriv.status === 403
          ? 'Endpoint Prometheus requer SUPABASE_ACCESS_TOKEN ou Secret Key sb_secret_.'
          : `Metrics API retornou HTTP ${promPriv.status || 0}.`;
    }
  }

  const snapshot: SupabasePlatformSnapshot = {
    collectedAt: new Date().toISOString(),
    cached: false,
    cacheAgeSec: 0,
    managementApi,
    vmMetrics,
  };

  platformCache = {
    timestamp: Date.now(),
    snapshot,
  };

  return snapshot;
}

export function clearSupabasePlatformCache(): void {
  platformCache = null;
}
