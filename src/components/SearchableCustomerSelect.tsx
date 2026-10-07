'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Check, Building2, Loader2, RefreshCw } from 'lucide-react';
import { searchCustomers, getCustomerById } from '@/services/supabase';
import { syncAllCustomersFromContaAzul } from '@/services/customer_sync';

export interface CustomerOption {
  id: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
}

interface SearchableCustomerSelectProps {
  customers?: CustomerOption[];
  initialCustomer?: CustomerOption | null;
  value: string;
  onChange: (customerId: string, customer?: CustomerOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  tenantId?: string;
  className?: string;
}

export default function SearchableCustomerSelect({
  customers = [],
  initialCustomer = null,
  value,
  onChange,
  placeholder = 'Ex: Doce Vida Doceria (Digite o nome ou documento)',
  disabled = false,
  required = false,
  tenantId = 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0',
  className = ''
}: SearchableCustomerSelectProps) {
  const [displayInput, setDisplayInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<CustomerOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cachedCustomer, setCachedCustomer] = useState<CustomerOption | null>(initialCustomer || null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Estados de Sincronização com Conta Azul
  const [isSyncingContaAzulSingle, setIsSyncingContaAzulSingle] = useState(false);
  const [isSyncingContaAzulAll, setIsSyncingContaAzulAll] = useState(false);
  const [syncAllProgressText, setSyncAllProgressText] = useState('');
  const [customerSyncFeedback, setCustomerSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isTypingRef = useRef(false);

  // 1. Sincroniza o valor de exibição com base na prop value
  useEffect(() => {
    if (!value) {
      if (!isTypingRef.current) {
        setDisplayInput('');
      }
      setCachedCustomer(null);
      return;
    }

    // Se já temos em initialCustomer e bate com o id
    if (initialCustomer && initialCustomer.id === value) {
      setDisplayInput(initialCustomer.name);
      setCachedCustomer(initialCustomer);
      return;
    }

    // Se já está em cachedCustomer
    if (cachedCustomer && cachedCustomer.id === value) {
      if (!isTypingRef.current) {
        setDisplayInput(cachedCustomer.name);
      }
      return;
    }

    // Procura na lista local de clientes se foi passada
    const foundLocal = customers.find(c => c.id === value);
    if (foundLocal) {
      setDisplayInput(foundLocal.name);
      setCachedCustomer(foundLocal);
      return;
    }

    // Busca autoritativa pelo ID no banco
    let isCancelled = false;
    getCustomerById(value, tenantId).then(res => {
      if (!isCancelled && res.data) {
        setDisplayInput(res.data.name);
        setCachedCustomer(res.data);
      }
    }).catch(err => {
      console.warn('Erro ao resolver cliente por ID:', err);
    });

    return () => {
      isCancelled = true;
    };
  }, [value, initialCustomer, tenantId]);

  // 2. Executa a busca com a mesma lógica do Novo Pedido (searchCustomers)
  const triggerSearch = useCallback(async (term: string) => {
    setIsSearching(true);
    try {
      const res = await searchCustomers(term, tenantId, 25);
      const list = res.data || [];
      setSuggestions(list);
      setHighlightedIndex(-1);
    } catch (err) {
      console.error('Erro na pesquisa de clientes:', err);
    } finally {
      setIsSearching(false);
    }
  }, [tenantId]);

  // 3. Debounce para digitação imediata no campo
  useEffect(() => {
    if (!isOpen && !isTypingRef.current) return;

    const term = displayInput.trim();

    const timer = setTimeout(() => {
      triggerSearch(term);
      isTypingRef.current = false;
    }, 450);

    return () => clearTimeout(timer);
  }, [displayInput, isOpen, triggerSearch]);

  // 4. Fechar dropdown ao clicar fora do componente
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        isTypingRef.current = false;

        // Se o usuário digitou mas não selecionou nenhum cliente, restaura o nome do cliente ativo ou limpa
        if (cachedCustomer && cachedCustomer.id === value) {
          setDisplayInput(cachedCustomer.name);
        } else if (!value) {
          setDisplayInput('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [cachedCustomer, value]);

  // 5. Navegação e Seleção por Teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        triggerSearch(displayInput.trim());
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1 < suggestions.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        const selected = suggestions[highlightedIndex];
        handleSelectCustomer(selected);
      } else {
        triggerSearch(displayInput.trim());
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // 6. Seleciona cliente da lista
  const handleSelectCustomer = (customer: CustomerOption) => {
    isTypingRef.current = false;
    setDisplayInput(customer.name);
    setCachedCustomer(customer);
    onChange(customer.id, customer);
    setIsOpen(false);
    setSuggestions([]);
  };

  // 7. Limpa a seleção
  const handleClear = () => {
    isTypingRef.current = false;
    setDisplayInput('');
    setCachedCustomer(null);
    setSuggestions([]);
    onChange('', null);
    inputRef.current?.focus();
  };

  // 8. Busca pontual no Conta Azul (igual ao Novo Pedido)
  const handleSyncContaAzulSingle = async () => {
    const term = displayInput.trim();
    if (!term) {
      alert('Digite o nome ou CNPJ/CPF do cliente para buscar no Conta Azul.');
      return;
    }

    setIsSyncingContaAzulSingle(true);
    setCustomerSyncFeedback({ type: 'info', text: 'Buscando cliente na Conta Azul...' });

    try {
      const cleanDoc = term.replace(/\D/g, '');
      const params = new URLSearchParams();
      if (cleanDoc && (cleanDoc.length === 11 || cleanDoc.length === 14)) {
        params.append('document', cleanDoc);
      } else {
        params.append('name', term);
      }
      params.append('sync', 'true');

      const res = await fetch(`/api/sync/search-customer?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.found) {
        setCustomerSyncFeedback({
          type: 'error',
          text: data.message || data.error || 'Cliente não encontrado no Conta Azul.'
        });
        return;
      }

      const c = data.customer;
      handleSelectCustomer(c);
      setCustomerSyncFeedback({
        type: 'success',
        text: `Cliente "${c.name}" sincronizado do Conta Azul com sucesso!`
      });

      setTimeout(() => setCustomerSyncFeedback(null), 5000);
    } catch (err: any) {
      console.error(err);
      setCustomerSyncFeedback({
        type: 'error',
        text: 'Erro ao conectar com Conta Azul: ' + (err.message || 'Falha na requisição')
      });
    } finally {
      setIsSyncingContaAzulSingle(false);
    }
  };

  // 9. Sincronização Completa de Todos os Clientes do Conta Azul (igual ao Novo Pedido)
  const handleSyncContaAzulAll = async () => {
    setIsSyncingContaAzulAll(true);
    setSyncAllProgressText('Iniciando sincronização...');
    setCustomerSyncFeedback({ type: 'info', text: 'Conectando ao Conta Azul para puxar todos os clientes...' });

    try {
      const res = await syncAllCustomersFromContaAzul((step, progress) => {
        setSyncAllProgressText(`${progress > 0 ? progress + '%' : ''} ${step}`);
      });

      if (res.success) {
        setCustomerSyncFeedback({
          type: 'success',
          text: `Base de clientes atualizada no banco! (${res.imported} novos, ${res.updated} atualizados).`
        });
        triggerSearch(displayInput.trim());
      } else {
        setCustomerSyncFeedback({
          type: 'error',
          text: res.error || 'Erro ao sincronizar base de clientes.'
        });
      }
    } catch (err: any) {
      setCustomerSyncFeedback({
        type: 'error',
        text: 'Erro de conexão: ' + (err.message || 'Falha ao sincronizar clientes')
      });
    } finally {
      setIsSyncingContaAzulAll(false);
      setSyncAllProgressText('');
      setTimeout(() => setCustomerSyncFeedback(null), 8000);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input de Digitação Direta (Idêntico ao Novo Pedido) */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          className={`form-input ${className}`}
          placeholder={placeholder}
          value={displayInput}
          disabled={disabled}
          required={required}
          onFocus={() => {
            setIsOpen(true);
            if (suggestions.length === 0) {
              triggerSearch(displayInput.trim());
            }
          }}
          onChange={(e) => {
            isTypingRef.current = true;
            setDisplayInput(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onChange('', null);
              setCachedCustomer(null);
            }
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          style={{
            paddingRight: displayInput ? '34px' : '12px',
            width: '100%'
          }}
        />

        {/* Indicador de Busca */}
        {isSearching && (
          <span style={{
            position: 'absolute',
            right: displayInput && !disabled ? '30px' : '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Buscando...</span>
          </span>
        )}

        {/* Botão de Limpar Seleção (X) */}
        {displayInput && !disabled && !isSearching && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px'
            }}
            title="Limpar cliente selecionado"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Feedback de Sincronização com Conta Azul */}
      {customerSyncFeedback && (
        <div style={{
          marginTop: '4px',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: customerSyncFeedback.type === 'error' ? '#ef4444' : customerSyncFeedback.type === 'success' ? '#10b981' : 'var(--primary)'
        }}>
          {customerSyncFeedback.text}
        </div>
      )}

      {/* Dropdown de Sugestões Dinâmicas (Idêntico ao Novo Pedido) */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1050,
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md, 6px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          maxHeight: '280px',
          overflowY: 'auto',
          marginTop: '4px',
          animation: 'fadeIn 0.15s ease'
        }}>
          {/* Opção Desvincular / Nenhum */}
          <div
            onClick={() => {
              handleClear();
              setIsOpen(false);
            }}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border)',
              backgroundColor: !value ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.08)' : 'transparent',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !value ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.08)' : 'transparent'}
          >
            <span>— Nenhum (Desvincular Cliente) —</span>
            {!value && <Check size={14} style={{ color: 'var(--primary)' }} />}
          </div>

          {/* Lista de Resultados */}
          {suggestions.map((c, idx) => {
            const isSelected = c.id === value;
            const isHighlighted = highlightedIndex === idx;

            return (
              <div
                key={c.id}
                onClick={() => handleSelectCustomer(c)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: isHighlighted ? 'var(--surface-hover)' : (isSelected ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.08)' : 'transparent'),
                  transition: 'background-color 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  setHighlightedIndex(idx);
                  e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isSelected ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.08)' : 'transparent';
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                    {c.name}
                  </div>
                  {c.document && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Doc: {c.document}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {c.company_name && c.company_name !== c.name && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {c.company_name}
                    </span>
                  )}
                  {isSelected && <Check size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                </div>
              </div>
            );
          })}

          {suggestions.length === 0 && !isSearching && (
            <div style={{ padding: '10px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Nenhum cliente local encontrado para "{displayInput}".
            </div>
          )}

          {/* Rodapé de Sincronização Sob Demanda (Idêntico ao Novo Pedido) */}
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {displayInput && displayInput.trim().length > 0 && (
              <div
                onClick={handleSyncContaAzulSingle}
                style={{
                  cursor: isSyncingContaAzulSingle ? 'wait' : 'pointer',
                  fontSize: '0.78rem',
                  color: 'var(--primary)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={12} className={isSyncingContaAzulSingle ? 'spin' : ''} style={{ animation: isSyncingContaAzulSingle ? 'spin 1s linear infinite' : 'none' }} />
                <span>Buscar "{displayInput}" pontual no Conta Azul</span>
              </div>
            )}

            <div
              onClick={handleSyncContaAzulAll}
              style={{
                cursor: isSyncingContaAzulAll ? 'wait' : 'pointer',
                fontSize: '0.78rem',
                color: 'var(--primary)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Não encontrou na lista?</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={12} className={isSyncingContaAzulAll ? 'spin' : ''} style={{ animation: isSyncingContaAzulAll ? 'spin 1s linear infinite' : 'none' }} />
                <span>{isSyncingContaAzulAll ? (syncAllProgressText || 'Sincronizando...') : 'Sincronizar Todos do Conta Azul'}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
