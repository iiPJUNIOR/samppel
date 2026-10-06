'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Check, ChevronDown, Building2, Loader2, RefreshCw } from 'lucide-react';
import { getCustomerById } from '@/services/supabase';
import { syncAllCustomersFromContaAzul } from '@/services/customer_sync';

export interface CustomerOption {
  id: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface SearchableCustomerSelectProps {
  customers?: CustomerOption[];
  initialCustomer?: CustomerOption | null;
  value: string;
  onChange: (customerId: string, customer?: CustomerOption) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  tenantId?: string;
}

export default function SearchableCustomerSelect({
  customers = [],
  initialCustomer = null,
  value,
  onChange,
  placeholder = 'Buscar cliente por nome ou CNPJ/CPF...',
  disabled = false,
  required = false,
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0'
}: SearchableCustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [remoteResults, setRemoteResults] = useState<CustomerOption[]>([]);
  const [initialOptions, setInitialOptions] = useState<CustomerOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cachedCustomer, setCachedCustomer] = useState<CustomerOption | null>(initialCustomer || null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSyncContaAzul = async () => {
    setIsSyncing(true);
    setSyncStatus('Iniciando sincronização...');
    try {
      const res = await syncAllCustomersFromContaAzul((step, progress) => {
        setSyncStatus(`${progress > 0 ? progress + '%' : ''} ${step}`);
      });
      if (res.success) {
        setSyncStatus(`Sucesso! ${res.imported} novos, ${res.updated} atualizados.`);
        try {
          const freshRes = await fetch(`/api/customers/search?tenantId=${encodeURIComponent(tenantId)}&limit=30`);
          if (freshRes.ok) {
            const json = await freshRes.json();
            if (json.success && Array.isArray(json.data)) {
              setInitialOptions(json.data);
            }
          }
        } catch { }
        if (searchTerm.trim()) {
          try {
            const searchRes = await fetch(`/api/customers/search?q=${encodeURIComponent(searchTerm.trim())}&tenantId=${encodeURIComponent(tenantId)}&limit=40`);
            if (searchRes.ok) {
              const json = await searchRes.json();
              if (json.success && Array.isArray(json.data)) {
                setRemoteResults(json.data);
              }
            }
          } catch { }
        }
      } else {
        setSyncStatus(res.error || 'Erro na sincronização');
      }
    } catch (e: any) {
      setSyncStatus(e.message || 'Erro ao sincronizar');
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setSyncStatus('');
      }, 5000);
    }
  };

  // 1. Resolução garantida do cliente selecionado pelo value
  useEffect(() => {
    if (!value) {
      setCachedCustomer(null);
      return;
    }

    // Se já está em cache
    if (cachedCustomer && cachedCustomer.id === value) {
      return;
    }

    // Procura nas listas locais existentes
    const found =
      customers.find(c => c.id === value) ||
      remoteResults.find(c => c.id === value) ||
      initialOptions.find(c => c.id === value);

    if (found) {
      setCachedCustomer(found);
      return;
    }

    // Busca autoritativa pelo ID no servidor
    let isCancelled = false;
    getCustomerById(value, tenantId).then(res => {
      if (!isCancelled && res.data) {
        setCachedCustomer(res.data);
      }
    }).catch(err => {
      console.warn('Erro ao resolver cliente por ID:', err);
    });

    return () => {
      isCancelled = true;
    };
  }, [value, customers, remoteResults, initialOptions, cachedCustomer, tenantId]);

  const selectedCustomer = useMemo(() => {
    if (!value) return null;
    if (cachedCustomer && cachedCustomer.id === value) return cachedCustomer;
    return (
      customers.find(c => c.id === value) ||
      remoteResults.find(c => c.id === value) ||
      initialOptions.find(c => c.id === value) ||
      null
    );
  }, [value, cachedCustomer, customers, remoteResults, initialOptions]);

  // 2. Carrega opções iniciais ao abrir o dropdown caso estejam vazias
  const fetchDefaultOptions = useCallback(async () => {
    if (initialOptions.length > 0) return;
    if (customers.length > 0) {
      setInitialOptions(customers.slice(0, 30));
      return;
    }

    try {
      const res = await fetch(`/api/customers/search?tenantId=${encodeURIComponent(tenantId)}&limit=30`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setInitialOptions(json.data);
        }
      }
    } catch (err) {
      console.warn('Falha ao carregar lista inicial de clientes:', err);
    }
  }, [initialOptions.length, customers, tenantId]);

  // 3. Busca remota ultra-rápida na API Server-Side com debounce e cancelamento de requisições anteriores
  useEffect(() => {
    if (!isOpen) return;

    const term = searchTerm.trim();
    if (!term) {
      setRemoteResults([]);
      setIsSearching(false);
      fetchDefaultOptions();
      return;
    }

    setIsSearching(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const url = `/api/customers/search?q=${encodeURIComponent(term)}&tenantId=${encodeURIComponent(tenantId)}&limit=40`;
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setRemoteResults(json.data);
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Erro na pesquisa corporativa de clientes:', e);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 550);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm, isOpen, tenantId, fetchDefaultOptions]);

  // Limpa o AbortController ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 4. Lista combinada exibida no dropdown
  const displayedCustomers = useMemo(() => {
    const term = searchTerm.trim();
    if (!term) {
      const base = initialOptions.length > 0 ? initialOptions : customers.slice(0, 30);
      if (selectedCustomer && !base.some(c => c.id === selectedCustomer.id)) {
        return [selectedCustomer, ...base];
      }
      return base;
    }

    // Se houver busca remota ativa, exibe os resultados retornados pelo servidor
    if (remoteResults.length > 0) {
      return remoteResults;
    }

    // Se estiver aguardando busca ou sem resultados remotos, tenta filtrar itens locais
    const cleanSearch = term.toLowerCase();
    const localFiltered = (initialOptions.length > 0 ? initialOptions : customers).filter(c => {
      const name = (c.name || '').toLowerCase();
      const doc = (c.document || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      return name.includes(cleanSearch) || doc.includes(cleanSearch) || email.includes(cleanSearch);
    });

    return localFiltered;
  }, [searchTerm, remoteResults, initialOptions, customers, selectedCustomer]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Foca no input e carrega dados ao abrir
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setRemoteResults([]);
      setHighlightedIndex(0);
      fetchDefaultOptions();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, fetchDefaultOptions]);

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % (displayedCustomers.length + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + displayedCustomers.length + 1) % (displayedCustomers.length + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex === 0) {
        setCachedCustomer(null);
        onChange('');
        setIsOpen(false);
      } else if (displayedCustomers[highlightedIndex - 1]) {
        const chosen = displayedCustomers[highlightedIndex - 1];
        setCachedCustomer(chosen);
        onChange(chosen.id, chosen);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      style={{ position: 'relative', width: '100%' }}
      onKeyDown={handleKeyDown}
    >
      {/* Botão Gatilho / Visualização do Selecionado */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 0.75rem',
          backgroundColor: 'var(--surface)',
          border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          minHeight: '42px',
          boxShadow: isOpen ? '0 0 0 2px rgba(var(--primary-rgb, 59, 130, 246), 0.2)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, overflow: 'hidden' }}>
          {selectedCustomer ? (
            <>
              <Building2 size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedCustomer.name}
                </span>
                {selectedCustomer.document && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    CNPJ/CPF: {selectedCustomer.document}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {placeholder}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {selectedCustomer && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCachedCustomer(null);
                onChange('');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--text-muted)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Desvincular cliente"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </div>
      </div>

      {/* Dropdown com Campo de Busca */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '320px',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Campo de Pesquisa em Tempo Real */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--background)' }}>
            {isSearching ? (
              <Loader2 size={16} style={{ color: 'var(--primary)', marginLeft: '4px', animation: 'spin 1s linear infinite' }} />
            ) : (
              <Search size={16} style={{ color: 'var(--text-muted)', marginLeft: '4px' }} />
            )}
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome ou CNPJ para filtrar..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '0.85rem',
                color: 'var(--text)'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setRemoteResults([]);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Lista de Clientes */}
          <div 
            ref={listRef} 
            style={{ 
              overflowY: 'auto', 
              maxHeight: '260px',
              padding: '0.25rem' 
            }}
          >
            {/* Opção Desvincular / Nenhum */}
            <div
              onClick={() => {
                setCachedCustomer(null);
                onChange('');
                setIsOpen(false);
              }}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                backgroundColor: highlightedIndex === 0 ? 'var(--background)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>— Nenhum (Desvincular Cliente) —</span>
              {!value && <Check size={14} style={{ color: 'var(--primary)' }} />}
            </div>

            {displayedCustomers.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {isSearching ? 'Buscando clientes no banco de dados...' : `Nenhum cliente encontrado para "${searchTerm}".`}
              </div>
            ) : (
              displayedCustomers.map((c, idx) => {
                const isSelected = c.id === value;
                const isHighlighted = highlightedIndex === idx + 1;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setCachedCustomer(c);
                      onChange(c.id, c);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx + 1)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      backgroundColor: isHighlighted ? 'var(--background)' : (isSelected ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.08)' : 'transparent'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      transition: 'background-color 0.1s ease'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--primary)' : 'var(--text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {c.name}
                      </span>
                      {c.document && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          CNPJ/CPF: {c.document}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé: Sincronização Sob Demanda do Conta Azul */}
          <div style={{
            padding: '0.45rem 0.75rem',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            gap: '0.5rem'
          }}>
            <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isSyncing ? syncStatus : (displayedCustomers.length === 0 ? 'Não encontrou a empresa?' : 'Precisa de novos clientes?')}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSyncContaAzul();
              }}
              disabled={isSyncing}
              style={{
                background: 'rgba(var(--primary-rgb, 59, 130, 246), 0.1)',
                border: '1px solid rgba(var(--primary-rgb, 59, 130, 246), 0.25)',
                color: 'var(--primary)',
                fontWeight: 600,
                fontSize: '0.72rem',
                cursor: isSyncing ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap'
              }}
              title="Puxar todos os clientes do Conta Azul para alimentar o banco de dados"
            >
              <RefreshCw size={11} className={isSyncing ? 'spin' : ''} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar do Conta Azul'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
