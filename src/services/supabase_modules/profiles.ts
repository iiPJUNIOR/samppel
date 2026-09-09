import { getDbClient, isMockMode, mockProfiles, setMockProfiles } from '../supabaseClient';
import { authenticatedFetch } from '@/lib/apiFetch';

export async function getProfilesWithPermissions(tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0') {
  if (isMockMode) {
    return { 
      data: mockProfiles.filter(p => p.tenant_id === tenantId).map(p => ({
        ...p,
        profile_stage_permissions: []
      })), 
      error: null 
    };
  }

  // Se executado no cliente, tenta obter via rota protegida por token
  if (typeof window !== 'undefined') {
    try {
      const response = await authenticatedFetch(`/api/config/profiles?tenantId=${tenantId}`);
      if (response.ok) {
        const json = await response.json();
        if (json.data && Array.isArray(json.data)) {
          return { data: json.data, error: null };
        }
      }
    } catch (err: any) {
      console.warn('Aviso: Falha na API /api/config/profiles, acionando consulta direta ao banco:', err);
    }
  }

  const { data, error } = await getDbClient()
    .from('profiles')
    .select('*, profile_stage_permissions(stage_id, can_enter, can_exit)')
    .eq('tenant_id', tenantId)
    .order('full_name');
  return { data, error };
}

export async function saveProfileStagePermission(profileId: string, stageId: string, canEnter: boolean, canExit: boolean) {
  if (isMockMode) {
    return { data: null, error: null };
  }

  // Se executado no cliente, chama a rota de API do servidor para pular RLS de permissões
  if (typeof window !== 'undefined') {
    try {
      const response = await authenticatedFetch('/api/config/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profileId, stageId, canEnter, canExit })
      });
      if (response.ok) {
        return { data: null, error: null };
      }
    } catch (err: any) {
      console.warn('Aviso: Falha na API /api/config/profiles para salvar permissões, tentando fallback direto:', err);
    }
  }
  
  if (!canEnter && !canExit) {
    const { error } = await getDbClient()
      .from('profile_stage_permissions')
      .delete()
      .eq('profile_id', profileId)
      .eq('stage_id', stageId);
    return { data: null, error };
  }

  const { data, error } = await getDbClient()
    .from('profile_stage_permissions')
    .upsert({
      profile_id: profileId,
      stage_id: stageId,
      can_enter: canEnter,
      can_exit: canExit
    })
    .select();
    
  return { data, error };
}

export async function updateProfileStagePermissions(profileId: string, stageIds: string[]) {
  if (isMockMode) {
    return { data: null, error: null };
  }
  const { error: deleteError } = await getDbClient()
    .from('profile_stage_permissions')
    .delete()
    .eq('profile_id', profileId);
    
  if (deleteError) return { data: null, error: deleteError };
  
  if (stageIds.length === 0) return { data: [], error: null };
  
  const rows = stageIds.map(stageId => ({
    profile_id: profileId,
    stage_id: stageId,
    can_enter: true,
    can_exit: true
  }));
  
  const { data, error } = await getDbClient()
    .from('profile_stage_permissions')
    .insert(rows)
    .select();
    
  return { data, error };
}

const SELLER_PERMISSIONS_CACHE_KEY = 'samppel_seller_permissions_map_v1';

export function getSellerPermissionsMap(): Record<string, { primary_seller_name: string; seller_access_mode: string; allowed_sellers: string[] }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SELLER_PERMISSIONS_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

export async function saveSellerPermissions(
  profileId: string,
  primarySellerName: string,
  sellerAccessMode: 'OWN' | 'SPECIFIC' | 'ALL',
  allowedSellers: string[]
) {
  if (typeof window !== 'undefined') {
    try {
      const map = getSellerPermissionsMap();
      map[profileId] = {
        primary_seller_name: primarySellerName,
        seller_access_mode: sellerAccessMode,
        allowed_sellers: allowedSellers
      };
      localStorage.setItem(SELLER_PERMISSIONS_CACHE_KEY, JSON.stringify(map));
    } catch (err) {
      console.warn('Erro ao salvar permissões de vendedor no localStorage:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      await authenticatedFetch('/api/config/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSellerPermissions',
          profileId,
          primarySellerName,
          sellerAccessMode,
          allowedSellers
        })
      });
      return { data: true, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  return { data: true, error: null };
}
